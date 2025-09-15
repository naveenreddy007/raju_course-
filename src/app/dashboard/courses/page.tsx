'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Play, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { authenticatedFetch } from '@/lib/auth-utils'
import { toast } from 'sonner'

interface CourseData {
  id: string
  title: string
  description: string
  thumbnail?: string
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  enrolledAt: string
  lastAccessed?: string
  purchaseAmount: number
  purchaseDate: string
}

interface CoursesData {
  courses: CourseData[]
  stats: {
    totalEnrolled: number
    completed: number
    inProgress: number
  }
}

export default function DashboardCoursesPage() {
  const { user, loading } = useAuth()
  const [coursesData, setCoursesData] = useState<CoursesData | null>(null)
  const [dataLoading, setDataLoading] = useState(false)

  const fetchCoursesData = async () => {
    if (!user) return
    
    setDataLoading(true)
    try {
      const response = await authenticatedFetch('/api/dashboard/courses')
      if (response.ok) {
        const result = await response.json()
        const courses = result.data || []
        
        // Calculate stats
        const stats = {
          totalEnrolled: courses.length,
          completed: courses.filter((c: CourseData) => c.progressPercentage === 100).length,
          inProgress: courses.filter((c: CourseData) => c.progressPercentage > 0 && c.progressPercentage < 100).length
        }
        
        setCoursesData({ courses, stats })
      } else {
        toast.error('Failed to load courses data')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to load courses data')
    } finally {
      setDataLoading(false)
    }
  }

  useEffect(() => {
    if (user && !loading) {
      fetchCoursesData()
    }
  }, [user, loading])

  if (loading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your courses</h1>
        <Button asChild>
          <a href="/auth/login">Login</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Learning</h1>
          <p className="text-gray-600">Track your course progress and continue learning</p>
        </div>

        {/* Learning Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coursesData?.stats.totalEnrolled || 0}</div>
              <p className="text-xs text-muted-foreground">Total enrollments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coursesData?.stats.completed || 0}</div>
              <p className="text-xs text-muted-foreground">Courses finished</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coursesData?.stats.inProgress || 0}</div>
              <p className="text-xs text-muted-foreground">Currently learning</p>
            </CardContent>
          </Card>
        </div>

        {/* Package Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Package</CardTitle>
            <CardDescription>Your current learning package and benefits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{user?.affiliate?.packageType} Package</h3>
                <p className="text-sm text-gray-600">
                  Access to courses based on your package level
                </p>
              </div>
              <Button asChild>
                <a href="/courses">Browse Courses</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Courses you're currently enrolled in</CardDescription>
          </CardHeader>
          <CardContent>
            {coursesData?.courses && coursesData.courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coursesData.courses.map((course) => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                          <CardDescription className="text-sm mt-1 line-clamp-2">
                            {course.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{course.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${course.progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                          <span>Enrolled {new Date(course.enrolledAt).toLocaleDateString()}</span>
                        </div>
                        <Button className="w-full mt-4" size="sm">
                          <Play className="w-4 h-4 mr-2" />
                          {course.progressPercentage > 0 ? 'Continue Learning' : 'Start Course'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm">No courses enrolled yet</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">
                  Browse available courses and start learning!
                </p>
                <Button asChild>
                  <a href="/courses">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Browse Courses
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
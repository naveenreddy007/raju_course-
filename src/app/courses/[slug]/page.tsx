'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  PlayCircle, 
  Clock, 
  Users, 
  BookOpen, 
  CheckCircle, 
  Lock,
  Star,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'

interface Course {
  id: string
  title: string
  slug: string
  description: string
  shortDescription: string
  thumbnail?: string
  videoUrl?: string
  price: number
  duration: number
  level: string
  category: string
  packageTypes: string[]
  isPublished: boolean
  metaTitle?: string
  metaDescription?: string
  _count: {
    modules: number
    enrollments: number
  }
}

interface EnrollmentStatus {
  enrolled: boolean
  enrollment?: {
    id: string
    status: string
    progress_percent: number
    created_at: string
  }
}

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slug = params.slug as string

  useEffect(() => {
    if (slug) {
      fetchCourseData()
    }
  }, [slug])

  useEffect(() => {
    if (course && user && !authLoading) {
      checkEnrollmentStatus()
    }
  }, [course, user, authLoading])

  const fetchCourseData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/courses?slug=${slug}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch course')
      }

      const foundCourse = data.data.find((c: Course) => c.slug === slug)
      if (!foundCourse) {
        throw new Error('Course not found')
      }

      setCourse(foundCourse)
    } catch (error) {
      console.error('Error fetching course:', error)
      setError(error instanceof Error ? error.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const checkEnrollmentStatus = async () => {
    if (!course || !user) return

    try {
      const response = await fetch(`/api/courses/${course.id}/enroll`, {
        headers: {
          'Authorization': `Bearer ${user.accessToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setEnrollmentStatus(data.data)
      } else {
        // User is not enrolled
        setEnrollmentStatus({ enrolled: false })
      }
    } catch (error) {
      console.error('Error checking enrollment:', error)
      setEnrollmentStatus({ enrolled: false })
    }
  }

  const handleEnroll = async () => {
    if (!course || !user) {
      toast.error('Please log in to enroll in courses')
      router.push('/auth/login')
      return
    }

    // Check if user has the required package for free enrollment
    const userPackage = user.affiliate?.packageType
    const hasPackageAccess = userPackage && course.packageTypes.includes(userPackage)

    // If user has package access, enroll for free
    if (hasPackageAccess) {
      try {
        setEnrolling(true)
        const response = await fetch(`/api/courses/${course.id}/enroll`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
          },
          body: JSON.stringify({
            paymentMethod: 'FREE' // Since user already has the package
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to enroll in course')
        }

        toast.success('Successfully enrolled in course!')
        await checkEnrollmentStatus() // Refresh enrollment status
      } catch (error) {
        console.error('Error enrolling in course:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to enroll in course')
      } finally {
        setEnrolling(false)
      }
    } else {
      // Redirect to course purchase page for standalone purchase
      router.push(`/courses/${course.slug}/purchase`)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const canAccessCourse = () => {
    if (!user || !course) return false
    const userPackage = user.affiliate?.packageType
    return userPackage && course.packageTypes.includes(userPackage)
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Loading course...</span>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-600 font-medium">{error || 'Course not found'}</p>
            <Button 
              onClick={() => router.push('/courses')} 
              variant="outline" 
              className="mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => router.push('/courses')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Courses
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Course Header */}
            <div className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {course.packageTypes.map(packageType => (
                  <Badge 
                    key={packageType}
                    variant={packageType === 'SILVER' ? 'secondary' : 
                            packageType === 'GOLD' ? 'default' : 'destructive'}
                  >
                    {packageType}
                  </Badge>
                ))}
                <Badge variant="outline">{course.level}</Badge>
                <Badge variant="outline">{course.category}</Badge>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>
              
              <p className="text-xl text-gray-600 mb-6">
                {course.shortDescription}
              </p>

              {/* Course Stats */}
              <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{formatDuration(course.duration)}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{course._count.enrollments} students</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <span>{course._count.modules} modules</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  <span>4.8 (124 reviews)</span>
                </div>
              </div>
            </div>

            {/* Course Video/Thumbnail */}
            <Card className="mb-8">
              <CardContent className="p-0">
                <div className="relative w-full h-64 md:h-96 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <PlayCircle className="w-20 h-20 text-white/80 hover:text-white transition-colors cursor-pointer" />
                </div>
              </CardContent>
            </Card>

            {/* Course Description */}
            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {course.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="sticky top-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {course.price === 0 ? 'Free' : formatCurrency(course.price)}
                </CardTitle>
                <CardDescription>
                  {enrollmentStatus?.enrolled ? 'You are enrolled in this course' : 'One-time purchase'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enrollment Status */}
                {enrollmentStatus?.enrolled ? (
                  <div className="space-y-4">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-medium">Enrolled</span>
                    </div>
                    
                    {enrollmentStatus.enrollment && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{enrollmentStatus.enrollment.progress_percent}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${enrollmentStatus.enrollment.progress_percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <Button className="w-full" size="lg">
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!user ? (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => router.push('/auth/login')}
                      >
                        Login to Enroll
                      </Button>
                    ) : !canAccessCourse() ? (
                      <div className="space-y-3">
                        <div className="flex items-center text-amber-600">
                          <Lock className="w-5 h-5 mr-2" />
                          <span className="font-medium">Purchase Required</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Buy this course individually or get it with {course.packageTypes.join(' or ')} package.
                        </p>
                        <div className="space-y-2">
                          <Button 
                            className="w-full" 
                            size="lg"
                            onClick={handleEnroll}
                            disabled={enrolling}
                          >
                            {enrolling ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                Buy Course - {formatCurrency(course.price)}
                              </>
                            )}
                          </Button>
                          <Button 
                            variant="outline"
                            className="w-full" 
                            size="lg"
                            onClick={() => router.push('/packages')}
                          >
                            Or Get Package
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleEnroll}
                        disabled={enrolling}
                      >
                        {enrolling ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Enroll Now
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {/* Course Features */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium">This course includes:</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      <span>Mobile and desktop access</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      <span>Expert instructor support</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
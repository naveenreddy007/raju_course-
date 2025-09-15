'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  PlayCircle, 
  Clock, 
  Users, 
  Star, 
  Filter,
  Search,
  BookOpen,
  Award,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { PackageType } from '@/types'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

interface Course {
  id: string
  title: string
  slug: string
  description: string
  category: string
  level: string
  price: number
  duration: number
  instructorId: string
  isPublished: boolean
  packageTypes: string[]
  createdAt: string
  updatedAt: string
  _count: {
    modules: number
    enrollments: number
  }
}

const categories = ['All', 'Marketing', 'Sales', 'Finance', 'Leadership', 'Business']
const levels = ['All', 'Beginner', 'Intermediate', 'Advanced']
const packages = ['All', 'SILVER', 'GOLD', 'PLATINUM']

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All')
  const [selectedPackage, setSelectedPackage] = useState('All')

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/courses?limit=50')
        const data = await response.json()
        
        if (data.success) {
          setCourses(data.data)
        } else {
          setError('Failed to load courses')
        }
      } catch (err) {
        setError('Failed to load courses')
        console.error('Error fetching courses:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory
    const matchesLevel = selectedLevel === 'All' || course.level === selectedLevel
    const matchesPackage = selectedPackage === 'All' || 
                          course.packageTypes.includes(selectedPackage)
    
    return matchesSearch && matchesCategory && matchesLevel && matchesPackage
  })

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Premium Learning Courses
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Access high-quality courses designed by industry experts to accelerate your career and business growth.
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
                </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {levels.map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map(pkg => (
                  <SelectItem key={pkg} value={pkg}>{pkg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-gray-600">
          Showing {filteredCourses.length} of {courses.length} courses
        </p>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2 text-gray-600">Loading courses...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-red-600 font-medium">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {!loading && !error && (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={staggerChildren}
          initial="initial"
          animate="animate"
        >
          {filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No courses found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            filteredCourses.map((course, index) => (
              <motion.div key={course.id} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 group">
              {/* Course Thumbnail */}
              <div className="relative overflow-hidden rounded-t-lg">
                <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <PlayCircle className="w-16 h-16 text-white/80 group-hover:text-white transition-colors" />
                </div>

                <div className="absolute top-4 right-4">
                  <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {formatDuration(course.duration)}
                  </span>
                </div>
              </div>

              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Level: {course.level}</p>
                  </div>
                </div>
                
                <CardDescription className="line-clamp-2">
                  {course.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Course Stats */}
                <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{course._count.enrollments} students</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span>{course._count.modules} modules</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium">{formatCurrency(course.price)}</span>
                  </div>
                </div>

                {/* Package Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {course.packageTypes.map(packageType => (
                    <span 
                      key={packageType}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        packageType === 'SILVER' ? 'bg-gray-100 text-gray-700' :
                        packageType === 'GOLD' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {packageType}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <Button asChild className="w-full">
                  <Link href={`/courses/${course.slug}`}>
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Start Learning
                  </Link>
                </Button>
              </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  )
}
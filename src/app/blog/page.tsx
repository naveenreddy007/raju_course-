'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Calendar, 
  User, 
  Clock, 
  ArrowRight,
  Search,
  Filter,
  Eye,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

// Mock blog posts
const blogPosts = [
  {
    id: 1,
    title: 'How to Build a Successful Affiliate Marketing Business in 2024',
    excerpt: 'Discover the proven strategies and techniques that top affiliate marketers use to generate consistent income online.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/600/300',
    author: 'Sarah Johnson',
    publishedAt: '2024-01-15',
    readTime: 8,
    viewCount: 2847,
    category: 'Affiliate Marketing',
    tags: ['affiliate', 'marketing', 'business', 'online income'],
    isPopular: true
  },
  {
    id: 2,
    title: 'The Ultimate Guide to Personal Finance and Wealth Building',
    excerpt: 'Learn essential financial planning strategies that will help you build long-term wealth and achieve financial freedom.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/600/300',
    author: 'Michael Chen',
    publishedAt: '2024-01-12',
    readTime: 12,
    viewCount: 1923,
    category: 'Finance',
    tags: ['finance', 'investment', 'wealth', 'planning'],
    isPopular: false
  },
  {
    id: 3,
    title: 'Digital Marketing Trends That Will Dominate This Year',
    excerpt: 'Stay ahead of the curve with these emerging digital marketing trends and strategies for business growth.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/600/300',
    author: 'Emma Rodriguez',
    publishedAt: '2024-01-10',
    readTime: 6,
    viewCount: 3156,
    category: 'Marketing',
    tags: ['digital marketing', 'trends', 'strategy', 'growth'],
    isPopular: true
  },
  {
    id: 4,
    title: 'Leadership Skills Every Entrepreneur Needs to Master',
    excerpt: 'Develop the essential leadership qualities that separate successful entrepreneurs from the rest.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/600/300',
    author: 'David Thompson',
    publishedAt: '2024-01-08',
    readTime: 10,
    viewCount: 1654,
    category: 'Leadership',
    tags: ['leadership', 'entrepreneur', 'skills', 'business'],
    isPopular: false
  },
  {
    id: 5,
    title: 'Creating Engaging Content That Converts Visitors to Customers',
    excerpt: 'Master the art of content creation and learn how to turn your audience into paying customers.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/600/300',
    author: 'Alex Kumar',
    publishedAt: '2024-01-05',
    readTime: 7,
    viewCount: 2234,
    category: 'Content Marketing',
    tags: ['content', 'conversion', 'marketing', 'customers'],
    isPopular: false
  },
  {
    id: 6,
    title: 'E-commerce Success: From Startup to Scale',
    excerpt: 'Learn the step-by-step process to build and scale a profitable e-commerce business.',
    content: 'Full article content here...',
    featuredImage: '/api/placeholder/600/300',
    author: 'Priya Sharma',
    publishedAt: '2024-01-03',
    readTime: 15,
    viewCount: 1876,
    category: 'E-commerce',
    tags: ['ecommerce', 'business', 'startup', 'scale'],
    isPopular: true
  }
]

const categories = ['All', 'Affiliate Marketing', 'Finance', 'Marketing', 'Leadership', 'Content Marketing', 'E-commerce']

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('latest')

  // Filter and sort blog posts
  const filteredPosts = blogPosts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.viewCount - a.viewCount
      if (sortBy === 'oldest') return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() // latest
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const featuredPost = blogPosts.find(post => post.isPopular) || blogPosts[0]

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
          Learning Hub & Insights
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Stay updated with the latest trends, strategies, and insights in affiliate marketing, finance, and business growth.
        </p>
      </motion.div>

      {/* Featured Post */}
      {featuredPost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <div className="md:flex">
              <div className="md:w-1/2">
                <div className="h-64 md:h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <MessageSquare className="w-16 h-16 text-white/80" />
                </div>
              </div>
              <div className="md:w-1/2 p-8">
                <div className="flex items-center mb-4">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </span>
                  <span className="ml-4 text-sm text-gray-500">{featuredPost.category}</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 line-clamp-2">
                  {featuredPost.title}
                </h2>
                <p className="text-gray-600 mb-6 line-clamp-3">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="w-4 h-4 mr-1" />
                    <span className="mr-4">{featuredPost.author}</span>
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="mr-4">{formatDate(featuredPost.publishedAt)}</span>
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{featuredPost.readTime} min read</span>
                  </div>
                  <Button asChild>
                    <Link href={`/blog/${featuredPost.id}`}>
                      Read More
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search articles..."
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

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-gray-600">
          Showing {filteredPosts.length} of {blogPosts.length} articles
        </p>
      </motion.div>

      {/* Blog Posts Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        {filteredPosts.map((post, index) => (
          <motion.div key={post.id} variants={fadeInUp}>
            <Card className="h-full hover:shadow-lg transition-all duration-300 group">
              {/* Post Thumbnail */}
              <div className="relative overflow-hidden rounded-t-lg">
                <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <MessageSquare className="w-12 h-12 text-white/80 group-hover:text-white transition-colors" />
                </div>
                {post.isPopular && (
                  <div className="absolute top-4 left-4">
                    <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Popular
                    </span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4">
                  <span className="bg-black/50 text-white px-2 py-1 rounded text-xs">
                    {post.category}
                  </span>
                </div>
              </div>

              <CardHeader>
                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Post Meta */}
                <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    <span>{post.author}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{post.readTime} min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>{formatDate(post.publishedAt)}</span>
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    <span>{post.viewCount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Read More Button */}
                <Button asChild className="w-full">
                  <Link href={`/blog/${post.id}`}>
                    Read Article
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('All')
              setSortBy('latest')
            }}
          >
            Clear Filters
          </Button>
        </motion.div>
      )}

      {/* Newsletter Subscription */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="mt-16"
      >
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
            <p className="mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter and get the latest insights, tips, and strategies delivered directly to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <Input 
                placeholder="Enter your email" 
                className="bg-white text-gray-900"
              />
              <Button variant="secondary">
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
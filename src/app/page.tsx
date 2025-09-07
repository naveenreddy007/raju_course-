'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowRight, 
  BookOpen, 
  TrendingUp, 
  Users, 
  Shield, 
  Star,
  PlayCircle,
  Award,
  Zap,
  CheckCircle,
  IndianRupee
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, packagePricing, cn } from '@/lib/utils'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const packages = [
  {
    name: 'Silver',
    type: 'SILVER' as const,
    price: packagePricing.SILVER,
    popular: false,
    features: [
      'Access to 5 Premium Courses',
      'Direct Commission: ₹1,875 - ₹2,875',
      'Indirect Commission: ₹150 - ₹400',
      'Email Support',
      'Basic Analytics',
      'Mobile App Access'
    ]
  },
  {
    name: 'Gold',
    type: 'GOLD' as const,
    price: packagePricing.GOLD,
    popular: true,
    features: [
      'Access to 10 Premium Courses',
      'Direct Commission: ₹1,875 - ₹3,875',
      'Indirect Commission: ₹200 - ₹600',
      'Priority Support',
      'Advanced Analytics',
      'Monthly Webinars',
      'Exclusive Resources'
    ]
  },
  {
    name: 'Platinum',
    type: 'PLATINUM' as const,
    price: packagePricing.PLATINUM,
    popular: false,
    features: [
      'Access to All 15+ Courses',
      'Direct Commission: ₹1,875 - ₹5,625',
      'Indirect Commission: ₹200 - ₹1,000',
      '24/7 VIP Support',
      'Real-time Analytics',
      'Weekly 1-on-1 Sessions',
      'White-label Materials',
      'Early Access to New Content'
    ]
  }
]

const features = [
  {
    icon: TrendingUp,
    title: 'Two-Level Commission',
    description: 'Earn from direct referrals and their referrals with our sustainable commission model.'
  },
  {
    icon: BookOpen,
    title: 'Premium Learning',
    description: 'Access high-quality video courses designed by industry experts.'
  },
  {
    icon: Shield,
    title: 'KYC Verified',
    description: 'Secure platform with PAN-based verification ensuring one account per person.'
  },
  {
    icon: Zap,
    title: 'Instant Payouts',
    description: 'Quick commission processing with transparent tracking and analytics.'
  }
]

const stats = [
  { number: '10,000+', label: 'Active Learners' },
  { number: '₹2.5Cr+', label: 'Commissions Paid' },
  { number: '15+', label: 'Premium Courses' },
  { number: '98%', label: 'Satisfaction Rate' }
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1 
              className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              Learn, Earn, and 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> 
                Grow Together
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Join India's fastest-growing affiliate learning platform. Master new skills while building a sustainable income through our innovative two-level commission system.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Button size="lg" className="text-lg px-8 py-3" asChild>
                <Link href="/auth/register">
                  Start Learning Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3" asChild>
                <Link href="/courses">
                  <PlayCircle className="mr-2 w-5 h-5" />
                  Explore Courses
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the perfect blend of education and entrepreneurship with our innovative features.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="text-center">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-center">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Learning Package
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start your journey with any package and unlock earning potential through our commission system.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {packages.map((pkg, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className={cn(
                  "relative h-full",
                  pkg.popular && "border-primary shadow-lg scale-105"
                )}>
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                    <div className="mt-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {formatCurrency(pkg.price.final)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Base: {formatCurrency(pkg.price.base)} + GST: {formatCurrency(pkg.price.gst)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {pkg.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full" 
                      variant={pkg.popular ? "default" : "outline"}
                      asChild
                    >
                      <Link href={`/auth/register?package=${pkg.type.toLowerCase()}`}>
                        Get Started
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center text-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Future?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already building their financial freedom through education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3" asChild>
                <Link href="/auth/register">
                  <Award className="mr-2 w-5 h-5" />
                  Start Your Journey
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 text-white border-white hover:bg-white hover:text-primary" asChild>
                <Link href="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
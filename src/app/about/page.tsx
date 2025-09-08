'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Users, 
  Target, 
  Award,
  ArrowRight,
  CheckCircle,
  BookOpen,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About AffiliateLearn</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Empowering learners to build sustainable income through education and affiliate marketing
          </p>
        </div>

        {/* Mission */}
        <motion.div variants={fadeInUp} className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="w-6 h-6" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-lg">
                To create a sustainable learning ecosystem where knowledge meets opportunity. We believe that everyone deserves access to quality education and the ability to build financial independence through sharing that knowledge with others.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* How It Works */}
        <motion.div variants={fadeInUp} className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <BookOpen className="w-6 h-6" />
                How AffiliateLearn Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Learn Premium Courses</h3>
                    <p className="text-gray-600">Access high-quality video courses designed by industry experts across various domains.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <span className="text-blue-600 font-semibold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Share & Refer</h3>
                    <p className="text-gray-600">Share your learning experience with friends and family using your unique referral code.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-1">
                    <span className="text-blue-600 font-semibold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Earn Commissions</h3>
                    <p className="text-gray-600">Get rewarded with attractive commissions from direct referrals and their network too.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Values */}
        <motion.div variants={fadeInUp} className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Award className="w-6 h-6" />
                Our Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Quality Education</h3>
                    <p className="text-gray-600 text-sm">We provide only the highest quality educational content from verified experts.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Transparent Commissions</h3>
                    <p className="text-gray-600 text-sm">Clear, fair, and transparent commission structure with real-time tracking.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Secure Platform</h3>
                    <p className="text-gray-600 text-sm">KYC verified accounts and secure payment processing for your safety.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Community Support</h3>
                    <p className="text-gray-600 text-sm">Strong community support and customer service to help you succeed.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="text-center">
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-gray-600 mb-6">
                Join thousands of learners who are already transforming their lives through education and smart referrals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/auth/register">
                    Get Started Today
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href="/courses">
                    <BookOpen className="mr-2 w-4 h-4" />
                    Explore Courses
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
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
  IndianRupee,
  Copy,
  Share2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, packagePricing, cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { toast } from 'sonner'
import { authenticatedFetch } from '@/lib/auth-utils'

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
  { number: '1,000+', label: 'Active Learners' },
  { number: '₹50L+', label: 'Commissions Paid' },
  { number: '15+', label: 'Premium Courses' },
  { number: '95%', label: 'Satisfaction Rate' }
]

export default function HomePage() {
  const { user, loading } = useAuth()
  const [referralData, setReferralData] = useState(null)
  const [loadingReferral, setLoadingReferral] = useState(false)

  // Fetch referral data for logged-in users
  useEffect(() => {
    if (user && !loading) {
      fetchReferralData()
    }
  }, [user, loading])

  const fetchReferralData = async () => {
    try {
      setLoadingReferral(true)
      const response = await authenticatedFetch('/api/referrals/generate', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        setReferralData(data.affiliate)
      }
    } catch (error) {
      console.error('Error fetching referral data:', error)
    } finally {
      setLoadingReferral(false)
    }
  }

  const copyReferralLink = async () => {
    if (referralData?.referralLink) {
      try {
        await navigator.clipboard.writeText(referralData.referralLink)
        toast.success('Referral link copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy referral link')
      }
    }
  }

  const copyReferralCode = async () => {
    if (referralData?.referralCode) {
      try {
        await navigator.clipboard.writeText(referralData.referralCode)
        toast.success('Referral code copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy referral code')
      }
    }
  }

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
              Unlock your earning potential with our comprehensive affiliate program. Learn new skills, refer others, and earn significant commissions.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex justify-center space-x-4"
            >
              <Link href="/auth/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                  Get Started Today <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/#how-it-works">
                <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50 py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                  Learn More
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={fadeInUp} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-4xl font-bold text-blue-600 mb-2">{stat.number}</h3>
                <p className="text-gray-600 text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            How It <span className="text-blue-600">Works</span>
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
          >
            {features.map((feature, index) => (
              <motion.div key={index} variants={fadeInUp} className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md">
                <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="packages" className="py-16 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            Choose Your <span className="text-blue-600">Package</span>
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.3 }}
          >
            {packages.map((pkg, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className={cn(
                  "relative flex flex-col p-8 bg-white rounded-xl shadow-lg border-2 border-transparent transition-all duration-300 hover:border-blue-500",
                  pkg.popular && "border-blue-600 ring-2 ring-blue-600"
                )}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-xl">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <p className="text-gray-600 mb-4">Perfect for {pkg.name} affiliates</p>
                <div className="flex items-baseline mb-5">
                  <span className="text-5xl font-bold text-gray-900">₹{formatCurrency(pkg.price.final)}</span>
                  <span className="text-xl font-semibold text-gray-500 ml-2">incl. GST</span>
                </div>
                <ul className="space-y-3 text-gray-600 flex-grow mb-8">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={user ? `/purchase?type=${pkg.type}` : '/auth/signup'} className="mt-auto">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-lg transform hover:scale-105 transition-all duration-300">
                    {user ? 'Get Started' : 'Sign Up to Purchase'}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Referral Section */}
      {user && referralData && (
        <section id="referral" className="py-16 sm:py-24 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h2 
              className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6 }}
            >
              Your <span className="text-blue-600">Referral</span> Dashboard
            </motion.h2>
            <motion.div
              className="max-w-3xl mx-auto bg-gray-50 p-8 rounded-xl shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="mb-6 text-center">
                <p className="text-lg text-gray-700 mb-2">Share your unique link and start earning!</p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <div className="relative w-full sm:w-auto flex-grow">
                    <input
                      type="text"
                      readOnly
                      value={referralData.referralLink || 'Generating...'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10 text-gray-700 bg-white"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyReferralLink} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                    >
                      <Copy className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="relative w-full sm:w-auto flex-grow">
                    <input
                      type="text"
                      readOnly
                      value={referralData.referralCode || 'Generating...'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10 text-gray-700 bg-white"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyReferralCode} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                    >
                      <Copy className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-md text-gray-600">Total Referrals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">{referralData.totalReferrals || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-md text-gray-600">Total Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">₹{formatCurrency(referralData.totalEarnings || 0)}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="mt-8 text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Commission Structure</h3>
                <div className="flex justify-center items-center space-x-4 text-gray-700">
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">Direct:</span>
                    <span className="text-green-600">15-25%</span>
                  </div>
                  <ArrowRight className="w-5 h-5" />
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">Indirect:</span>
                    <span className="text-green-600">1-2%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-4">Exact percentages depend on the package purchased by your referral.</p>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Call to Action Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            Ready to Start Your Journey?
          </motion.h2>
          <motion.p 
            className="text-xl mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join thousands of successful affiliates. Sign up today and transform your future!
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/auth/signup">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-300">
                Join Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} Raju. All rights reserved.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
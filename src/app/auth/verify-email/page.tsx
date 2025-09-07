'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, CheckCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [userEmail, setUserEmail] = useState<string>('')

  useEffect(() => {
    // Get the current user's email from Supabase session
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        setUserEmail(session.user.email)
      }
    }
    getCurrentUser()
  }, [])

  const handleResendEmail = async () => {
    if (!userEmail) return
    
    setIsResending(true)
    setResendStatus('idle')
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail
      })
      
      if (error) {
        setResendStatus('error')
        console.error('Error resending email:', error)
      } else {
        setResendStatus('success')
      }
    } catch (error) {
      setResendStatus('error')
      console.error('Unexpected error:', error)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent a verification link to{' '}
              {userEmail && (
                <span className="font-medium text-gray-900">{userEmail}</span>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Account Created Successfully!
                </h3>
                <p className="text-sm text-gray-600">
                  Please check your email and click the verification link to activate your account and complete your registration.
                </p>
              </motion.div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <p className="text-yellow-800">
                  <strong>Important:</strong> Make sure to check your spam folder if you don't see the email in your inbox.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {resendStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm"
                >
                  ✅ Verification email sent successfully!
                </motion.div>
              )}

              {resendStatus === 'error' && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                >
                  ❌ Failed to resend email. Please try again.
                </motion.div>
              )}

              <Button
                onClick={handleResendEmail}
                disabled={isResending || !userEmail}
                variant="outline"
                className="w-full"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Resending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Already verified your email?
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/login">
                    Continue to Login
                  </Link>
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Need help?{' '}
                  <Link href="/contact" className="text-primary hover:underline">
                    Contact Support
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
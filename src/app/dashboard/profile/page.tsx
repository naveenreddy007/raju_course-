'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Phone, CreditCard, Settings, Shield } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'

export default function ProfilePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Please log in to view your profile</h1>
        <Button asChild>
          <a href="/auth/login">Login</a>
        </Button>
      </div>
    )
  }

  const getKYCStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-50'
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50'
      case 'REJECTED':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        {/* Profile Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your basic account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={user.name} readOnly />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email} readOnly />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={user.phone || 'Not provided'} readOnly />
              </div>
              <div>
                <Label htmlFor="joined">Member Since</Label>
                <Input id="joined" value={new Date(user.createdAt).toLocaleDateString()} readOnly />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              KYC Verification
            </CardTitle>
            <CardDescription>Your identity verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getKYCStatusColor(user.kycStatus)}`}>
                  {user.kycStatus}
                </div>
                {user.panCard && (
                  <p className="text-sm text-gray-600 mt-2">
                    PAN: {user.panCard}
                  </p>
                )}
              </div>
              {user.kycStatus === 'PENDING' && (
                <Button variant="outline">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Complete KYC
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Affiliate Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Affiliate Information
            </CardTitle>
            <CardDescription>Your affiliate account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="referralCode">Referral Code</Label>
                <Input id="referralCode" value={user.affiliate?.referralCode || 'Not available'} readOnly />
              </div>
              <div>
                <Label htmlFor="package">Package Type</Label>
                <Input id="package" value={user.affiliate?.packageType || 'Not available'} readOnly />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="joinDate">Join Date</Label>
                <Input 
                  id="joinDate" 
                  value={user.affiliate?.createdAt ? new Date(user.affiliate.createdAt).toLocaleDateString() : 'Not available'} 
                  readOnly 
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Input 
                  id="status" 
                  value={user.affiliate?.isActive ? 'Active' : 'Inactive'} 
                  readOnly 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button variant="outline">
                <Mail className="w-4 h-4 mr-2" />
                Update Email
              </Button>
              <Button variant="outline">
                <Phone className="w-4 h-4 mr-2" />
                Update Phone
              </Button>
              <Button variant="outline">
                <Shield className="w-4 h-4 mr-2" />
                Security Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
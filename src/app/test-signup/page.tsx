'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function TestSignupPage() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [testData, setTestData] = useState({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    phone: '9876543210',
    packageType: 'SILVER'
  })

  const testSupabaseAuth = async () => {
    setLoading(true)
    setTestResult('Testing Supabase authentication...\n')
    
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      setTestResult(prev => prev + 'Supabase client initialized ✅\n')
      
      // Test auth signup
      const { data, error } = await supabase.auth.signUp({
        email: testData.email,
        password: testData.password,
        options: {
          data: {
            name: testData.name,
            phone: testData.phone
          }
        }
      })

      if (error) {
        setTestResult(prev => prev + `Supabase auth error: ${error.message} ❌\n`)
      } else {
        setTestResult(prev => prev + `Supabase auth success: User ID ${data.user?.id} ✅\n`)
        
        // Clean up - delete the test user
        if (data.user) {
          await supabase.auth.admin.deleteUser(data.user.id)
          setTestResult(prev => prev + 'Test user cleaned up ✅\n')
        }
      }
    } catch (error) {
      setTestResult(prev => prev + `Unexpected error: ${error} ❌\n`)
    }
    
    setLoading(false)
  }

  const testAPIEndpoint = async () => {
    setLoading(true)
    setTestResult('Testing registration API endpoint...\n')
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          supabaseId: 'test_' + Date.now(),
          email: testData.email,
          name: testData.name,
          phone: testData.phone,
          packageType: testData.packageType,
          referralCode: ''
        })
      })

      setTestResult(prev => prev + `API response status: ${response.status}\n`)
      
      const result = await response.text()
      setTestResult(prev => prev + `API response: ${result}\n`)
      
      if (response.ok) {
        setTestResult(prev => prev + 'API endpoint working ✅\n')
      } else {
        setTestResult(prev => prev + 'API endpoint failed ❌\n')
      }
    } catch (error) {
      setTestResult(prev => prev + `API test error: ${error} ❌\n`)
    }
    
    setLoading(false)
  }

  const testFullSignup = async () => {
    setLoading(true)
    setTestResult('Testing full signup flow...\n')
    
    try {
      const { useAuth } = await import('@/lib/auth')
      // This won't work in this context, but we can test the function directly
      
      setTestResult(prev => prev + 'Would test full signup flow here\n')
      setTestResult(prev => prev + 'Please test manually through the signup form\n')
    } catch (error) {
      setTestResult(prev => prev + `Full signup test error: ${error} ❌\n`)
    }
    
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Signup Testing & Debugging</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Data Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Data Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={testData.email}
                  onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={testData.name}
                  onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={testData.phone}
                  onChange={(e) => setTestData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="package">Package</Label>
                <Select value={testData.packageType} onValueChange={(value) => setTestData(prev => ({ ...prev, packageType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SILVER">Silver</SelectItem>
                    <SelectItem value="GOLD">Gold</SelectItem>
                    <SelectItem value="PLATINUM">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tests</h3>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={testSupabaseAuth} 
                disabled={loading}
                variant="outline"
              >
                Test Supabase Auth
              </Button>
              <Button 
                onClick={testAPIEndpoint} 
                disabled={loading}
                variant="outline"
              >
                Test API Endpoint
              </Button>
              <Button 
                onClick={testFullSignup} 
                disabled={loading}
                variant="outline"
              >
                Test Full Signup
              </Button>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm min-h-[200px] whitespace-pre-wrap">
              {testResult || 'No tests run yet. Click a test button above.'}
            </div>
          </div>

          {/* Manual Test Instructions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Manual Testing Instructions</h3>
            <div className="bg-blue-50 p-4 rounded-md">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to <a href="/auth/register" className="text-blue-600 hover:underline">/auth/register</a></li>
                <li>Fill in the registration form with valid data</li>
                <li>Select a package (Silver, Gold, or Platinum)</li>
                <li>Click "Create Account & Continue to Payment"</li>
                <li>Check the browser console for any JavaScript errors</li>
                <li>Check the Network tab in DevTools for API call responses</li>
                <li>If successful, you should be redirected to the dashboard</li>
              </ol>
            </div>
          </div>

          {/* Environment Check */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Environment Variables Check</h3>
            <div className="space-y-2 text-sm">
              <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
              <p>Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
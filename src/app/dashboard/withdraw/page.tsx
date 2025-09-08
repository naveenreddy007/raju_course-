'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  IndianRupee, 
  Wallet, 
  CreditCard, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface BankDetail {
  id: string
  bankName: string
  accountNumber: string
  ifscCode: string
  accountHolderName: string
  isVerified: boolean
  isDefault: boolean
}

interface WithdrawalRequest {
  id: string
  amount: number
  status: string
  adminNotes?: string
  createdAt: string
  processedAt?: string
  bankDetail?: BankDetail
}

export default function WithdrawPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [amount, setAmount] = useState('')
  const [selectedBankId, setSelectedBankId] = useState('')
  const [loading, setLoading] = useState(false)
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([])
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [affiliateBalance, setAffiliateBalance] = useState(0)
  const [fetchingData, setFetchingData] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      // Fetch affiliate balance and bank details
      const [earningsRes, withdrawalsRes] = await Promise.all([
        fetch('/api/dashboard/earnings'),
        fetch('/api/withdrawals')
      ])

      if (earningsRes.ok) {
        const earningsData = await earningsRes.json()
        setAffiliateBalance(earningsData.data?.currentBalance || 0)
      }

      if (withdrawalsRes.ok) {
        const withdrawalsData = await withdrawalsRes.json()
        setWithdrawalRequests(withdrawalsData.data || [])
      }

      // Fetch bank details
      const bankRes = await fetch('/api/bank-details')
      if (bankRes.ok) {
        const bankData = await bankRes.json()
        setBankDetails(bankData.data || [])
        
        // Set default bank as selected
        const defaultBank = bankData.data?.find((bank: BankDetail) => bank.isDefault)
        if (defaultBank) {
          setSelectedBankId(defaultBank.id)
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setFetchingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount",
        variant: "destructive"
      })
      return
    }

    if (parseFloat(amount) < 500) {
      toast({
        title: "Minimum Amount Required",
        description: "Minimum withdrawal amount is ₹500",
        variant: "destructive"
      })
      return
    }

    if (parseFloat(amount) > affiliateBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Withdrawal amount exceeds available balance",
        variant: "destructive"
      })
      return
    }

    if (!selectedBankId) {
      toast({
        title: "Bank Details Required",
        description: "Please select or add bank details",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          bankDetailId: selectedBankId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Withdrawal Request Submitted",
          description: "Your withdrawal request has been submitted for review",
        })
        setAmount('')
        fetchUserData() // Refresh data
      } else {
        toast({
          title: "Request Failed",
          description: data.error || "Failed to submit withdrawal request",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'PROCESSING':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'APPROVED':
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800'
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdraw Earnings</h1>
          <p className="text-gray-600">Request withdrawal of your affiliate commissions</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Withdrawal Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-green-500" />
                    Available Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(affiliateBalance)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Minimum withdrawal: ₹500
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Withdrawal Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Request Withdrawal</CardTitle>
                  <CardDescription>
                    Submit a withdrawal request for your earnings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Withdrawal Amount</Label>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="pl-10"
                          min="500"
                          max={affiliateBalance}
                          step="1"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Enter amount between ₹500 and {formatCurrency(affiliateBalance)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Bank Account</Label>
                      {bankDetails.length > 0 ? (
                        <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank account" />
                          </SelectTrigger>
                          <SelectContent>
                            {bankDetails.map((bank) => (
                              <SelectItem key={bank.id} value={bank.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{bank.bankName} - {bank.accountNumber.slice(-4)}</span>
                                  {bank.isVerified && (
                                    <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Alert>
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription>
                            No bank details found. Please add your bank details first.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard/bank-details')}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {bankDetails.length > 0 ? 'Manage Bank Details' : 'Add Bank Details'}
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !selectedBankId || affiliateBalance < 500}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Withdrawal History */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Recent Withdrawals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {withdrawalRequests.length > 0 ? (
                    <div className="space-y-4">
                      {withdrawalRequests.slice(0, 5).map((request) => (
                        <div key={request.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {formatCurrency(request.amount)}
                            </span>
                            <div className="flex items-center">
                              {getStatusIcon(request.status)}
                              <Badge 
                                className={`ml-1 text-xs ${getStatusColor(request.status)}`}
                                variant="secondary"
                              >
                                {request.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                          {request.adminNotes && (
                            <p className="text-xs text-gray-600 mt-1">
                              Note: {request.adminNotes}
                            </p>
                          )}
                        </div>
                      ))}
                      
                      {withdrawalRequests.length > 5 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => router.push('/dashboard/withdrawals')}
                        >
                          View All Withdrawals
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No withdrawal requests yet</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
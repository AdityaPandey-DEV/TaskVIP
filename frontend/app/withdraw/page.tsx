'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'
import { 
  Download, 
  CreditCard, 
  Banknote, 
  Shield, 
  CheckCircle,
  Crown,
  AlertCircle,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PaymentMethod {
  id: string
  name: string
  description: string
  processingTime: string
  minAmount: number
  maxAmount: number
  fees: string
  supported: boolean
}

interface WithdrawalStatus {
  canWithdraw: boolean
  requirements: {
    emailVerified: boolean
    kycVerified: boolean
    minBalance: boolean
  }
  wallet: {
    total: number
    withdrawable: number
    pending: number
    currency: string
  }
  user: {
    emailVerified: boolean
    kycStatus: string
    userType: string
  }
}

export default function WithdrawPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [withdrawalStatus, setWithdrawalStatus] = useState<WithdrawalStatus | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingMethods, setLoadingMethods] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState('')
  const [amount, setAmount] = useState('')
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '',
    ifsc: '',
    accountHolderName: '',
    email: '',
    stripeAccountId: ''
  })
  const [processing, setProcessing] = useState(false)

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = Cookies.get('token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  useEffect(() => {
    if (!loading) {
      if (user) {
        fetchWithdrawalStatus()
        fetchPaymentMethods()
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login'
      }
    }
  }, [user, loading])

  const fetchWithdrawalStatus = async () => {
    try {
      const response = await fetch('/api/withdrawals/status', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setWithdrawalStatus(data)
      }
    } catch (error) {
      console.error('Error fetching withdrawal status:', error)
    } finally {
      setLoadingStatus(false)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/withdrawals/methods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.methods)
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoadingMethods(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)

    try {
      const response = await fetch('/api/withdrawals/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod: selectedMethod,
          accountDetails
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Withdrawal request submitted successfully!')
        router.push('/dashboard')
      } else {
        alert(data.message || 'Withdrawal request failed')
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      alert('Withdrawal request failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleKycVerification = async () => {
    try {
      const response = await fetch('/api/withdrawals/verify-kyc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        alert('KYC verification email sent! Please check your email.')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to send KYC verification email')
      }
    } catch (error) {
      console.error('KYC verification error:', error)
      alert('Failed to send KYC verification email')
    }
  }

  const handleEmailVerification = async () => {
    try {
      const response = await fetch('/api/email-verification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type: 'signup' })
      })

      if (response.ok) {
        alert('Email verification sent! Please check your email.')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to send email verification')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      alert('Failed to send email verification')
    }
  }

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <Link href="/login" className="btn btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-primary-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">TaskVIP</h1>
            </div>
            <Link href="/dashboard" className="btn btn-secondary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Withdrawal Status */}
        {withdrawalStatus && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Withdrawal Status</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 mb-2">
                  ₹{withdrawalStatus.wallet.withdrawable}
                </div>
                <div className="text-sm text-gray-600">Withdrawable Balance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success-600 mb-2">
                  ₹{withdrawalStatus.wallet.total}
                </div>
                <div className="text-sm text-gray-600">Total Balance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning-600 mb-2">
                  ₹{withdrawalStatus.wallet.pending}
                </div>
                <div className="text-sm text-gray-600">Pending Balance</div>
              </div>
            </div>

            {/* Requirements Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Verified</span>
                <div className="flex items-center">
                  {withdrawalStatus.requirements.emailVerified ? (
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  ) : (
                    <button
                      onClick={handleEmailVerification}
                      className="btn btn-secondary btn-sm"
                    >
                      Verify Email
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">KYC Verified</span>
                <div className="flex items-center">
                  {withdrawalStatus.requirements.kycVerified ? (
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  ) : (
                    <button
                      onClick={handleKycVerification}
                      className="btn btn-secondary btn-sm"
                    >
                      Verify KYC
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Minimum Balance (₹100)</span>
                <div className="flex items-center">
                  {withdrawalStatus.requirements.minBalance ? (
                    <CheckCircle className="w-5 h-5 text-success-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-warning-600" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Form */}
        {withdrawalStatus?.canWithdraw ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Request Withdrawal</h2>
            
            <form onSubmit={handleWithdraw} className="space-y-6">
              {/* Amount */}
              <div>
                <label className="label">Withdrawal Amount</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Banknote className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="100"
                    max={withdrawalStatus?.wallet.withdrawable || 0}
                    step="1"
                    required
                    className="input pl-10"
                    placeholder="Enter amount (minimum ₹100)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Available: ₹{withdrawalStatus?.wallet.withdrawable || 0}
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="label">Payment Method</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedMethod === method.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedMethod === method.id}
                          onChange={(e) => setSelectedMethod(e.target.value)}
                          className="mr-3"
                        />
                        <div>
                          <div className="font-semibold text-gray-900">{method.name}</div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {method.processingTime} • {method.fees} fee
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Details */}
              {selectedMethod === 'razorpay' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Bank Account Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Account Number</label>
                      <input
                        type="text"
                        required
                        className="input"
                        placeholder="Enter account number"
                        value={accountDetails.accountNumber}
                        onChange={(e) => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="label">IFSC Code</label>
                      <input
                        type="text"
                        required
                        className="input"
                        placeholder="Enter IFSC code"
                        value={accountDetails.ifsc}
                        onChange={(e) => setAccountDetails({...accountDetails, ifsc: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">Account Holder Name</label>
                      <input
                        type="text"
                        required
                        className="input"
                        placeholder="Enter account holder name"
                        value={accountDetails.accountHolderName}
                        onChange={(e) => setAccountDetails({...accountDetails, accountHolderName: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedMethod === 'paypal' && (
                <div>
                  <label className="label">PayPal Email</label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="Enter PayPal email"
                    value={accountDetails.email}
                    onChange={(e) => setAccountDetails({...accountDetails, email: e.target.value})}
                  />
                </div>
              )}

              {selectedMethod === 'stripe' && (
                <div>
                  <label className="label">Stripe Account ID</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Enter Stripe account ID"
                    value={accountDetails.stripeAccountId}
                    onChange={(e) => setAccountDetails({...accountDetails, stripeAccountId: e.target.value})}
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <div className="flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Your payment information is secure and encrypted
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={processing || !selectedMethod || !amount}
                  className="btn btn-primary"
                >
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Request Withdrawal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-warning-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-warning-900 mb-2">
                  Withdrawal Requirements Not Met
                </h3>
                <p className="text-warning-700">
                  Please complete all verification steps and ensure you have the minimum balance to withdraw.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIP Upgrade Prompt */}
        {!user.isVipActive && (
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Earn More with VIP
                </h3>
                <p className="text-gray-600">
                  Get higher daily limits and faster withdrawal processing with VIP membership.
                </p>
              </div>
              <Link href="/vip" className="btn btn-primary">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to VIP
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


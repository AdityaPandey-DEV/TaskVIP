'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  Zap, 
  Wallet,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface WithdrawalMethod {
  id: string
  name: string
  description: string
  fee: number
  minAmount: number
  processingTime: string
  icon: string
  fields: Array<{
    name: string
    label: string
    type: string
    required: boolean
    placeholder?: string
    options?: Array<{ value: string; label: string }>
  }>
}

interface WithdrawalHistory {
  id: string
  amount: number
  coinAmount: number
  netAmount: number
  processingFee: number
  withdrawalMethod: string
  status: string
  createdAt: string
  processedAt?: string
  failureReason?: string
  payoutDetails: any
}

interface UserBalance {
  availableCredits: number
  coinBalance: number
  totalCredits: number
}

export default function RazorpayWithdraw() {
  const { user } = useAuth()
  const [methods, setMethods] = useState<WithdrawalMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod | null>(null)
  const [amount, setAmount] = useState('')
  const [payoutDetails, setPayoutDetails] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [methodsLoading, setMethodsLoading] = useState(true)
  const [balanceLoading, setBalanceLoading] = useState(true)
  const [userBalance, setUserBalance] = useState<UserBalance>({
    availableCredits: 0,
    coinBalance: 0,
    totalCredits: 0
  })
  const [history, setHistory] = useState<WithdrawalHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [step, setStep] = useState(1) // 1: method selection, 2: details, 3: confirmation

  useEffect(() => {
    fetchWithdrawalMethods()
    fetchWithdrawalHistory()
    fetchUserBalance()
  }, [])

  const fetchWithdrawalMethods = async () => {
    setMethodsLoading(true)
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      const response = await apiRequest('api/razorpay-withdrawals/methods', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('Withdrawal methods response:', data) // Debug log
      
      if (data.success && data.data) {
        setMethods(data.data)
      } else {
        console.error('Invalid response format:', data)
        // Set fallback methods if API fails
        setFallbackMethods()
      }
    } catch (error) {
      console.error('Error fetching withdrawal methods:', error)
      // Set fallback methods if API fails
      setFallbackMethods()
    } finally {
      setMethodsLoading(false)
    }
  }

  const setFallbackMethods = () => {
    const fallbackMethods = [
      {
        id: 'upi',
        name: 'UPI Payment',
        description: 'Pay using UPI ID - Instant & Secure',
        fee: 1.5,
        minAmount: 10,
        processingTime: '1-2 hours',
        icon: '📱',
        fields: [
          { name: 'upiId', label: 'UPI ID', type: 'text', required: true, placeholder: 'yourname@paytm' }
        ]
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct transfer to your bank account',
        fee: 2.0,
        minAmount: 10,
        processingTime: '2-4 hours',
        icon: '🏦',
        fields: [
          { name: 'accountNumber', label: 'Account Number', type: 'text', required: true },
          { name: 'confirmAccountNumber', label: 'Confirm Account Number', type: 'text', required: true },
          { name: 'ifscCode', label: 'IFSC Code', type: 'text', required: true },
          { name: 'accountHolderName', label: 'Account Holder Name', type: 'text', required: true },
          { name: 'bankName', label: 'Bank Name', type: 'text', required: true }
        ]
      },
      {
        id: 'wallet',
        name: 'Digital Wallet',
        description: 'Transfer to Paytm, PhonePe, etc.',
        fee: 3.0,
        minAmount: 20,
        processingTime: '1-2 hours',
        icon: '💳',
        fields: [
          { 
            name: 'walletType', 
            label: 'Wallet Type', 
            type: 'select', 
            required: true, 
            options: [
              { value: 'paytm', label: 'Paytm' },
              { value: 'phonepe', label: 'PhonePe' },
              { value: 'googlepay', label: 'Google Pay' }
            ]
          },
          { name: 'walletNumber', label: 'Mobile Number', type: 'tel', required: true }
        ]
      }
    ]
    setMethods(fallbackMethods)
  }

  const fetchWithdrawalHistory = async () => {
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      const response = await apiRequest('api/razorpay-withdrawals/history?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.error('Failed to fetch withdrawal history:', response.status)
        return
      }
      
      const data = await response.json()
      console.log('Withdrawal history response:', data) // Debug log
      
      if (data.success && data.data && data.data.withdrawals) {
        setHistory(data.data.withdrawals)
      } else {
        console.error('Invalid withdrawal history response format:', data)
        setHistory([]) // Set empty array as fallback
      }
    } catch (error) {
      console.error('Error fetching withdrawal history:', error)
      setHistory([]) // Set empty array as fallback
    }
  }

  const fetchUserBalance = async () => {
    setBalanceLoading(true)
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      const response = await apiRequest('api/stats/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.error('Failed to fetch user balance:', response.status)
        return
      }
      
      const data = await response.json()
      console.log('User balance response:', data) // Debug log
      
      setUserBalance({
        availableCredits: data.coinBalance || 0,
        coinBalance: data.coinBalance || 0,
        totalCredits: data.totalCredits || 0
      })
    } catch (error) {
      console.error('Error fetching user balance:', error)
    } finally {
      setBalanceLoading(false)
    }
  }

  const handleMethodSelect = (method: WithdrawalMethod) => {
    setSelectedMethod(method)
    setPayoutDetails({})
    setStep(2)
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setPayoutDetails(prev => ({
      ...prev,
      [fieldName]: value
    }))
  }

  const calculateFee = () => {
    if (!selectedMethod || !amount) return 0
    const amountNum = parseFloat(amount)
    return Math.round((amountNum * selectedMethod.fee) / 100)
  }

  const getNetAmount = () => {
    const amountNum = parseFloat(amount) || 0
    const fee = calculateFee()
    return amountNum - fee
  }

  const getCreditsRequired = () => {
    return (parseFloat(amount) || 0) * 10 // 10 credits = ₹1
  }

  const validateUPI = (upiId: string) => {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/
    return upiRegex.test(upiId)
  }

  const validateIFSC = (ifsc: string) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    return ifscRegex.test(ifsc.toUpperCase())
  }

  const validateAccountNumber = (accountNumber: string) => {
    const accRegex = /^[0-9]{9,18}$/
    return accRegex.test(accountNumber)
  }

  const validateForm = () => {
    if (!selectedMethod || !amount) return false
    
    const amountNum = parseFloat(amount)
    if (amountNum < selectedMethod.minAmount) return false
    if (amountNum > Math.floor(userBalance.availableCredits / 10)) return false
    
    // Validate required fields
    for (const field of selectedMethod.fields) {
      if (field.required && !payoutDetails[field.name]) return false
    }
    
    // Method-specific validation
    if (selectedMethod.id === 'upi') {
      if (!validateUPI(payoutDetails.upiId)) return false
    }
    
    if (selectedMethod.id === 'bank_transfer') {
      if (!validateAccountNumber(payoutDetails.accountNumber)) return false
      if (!validateIFSC(payoutDetails.ifscCode)) return false
      if (payoutDetails.accountNumber !== payoutDetails.confirmAccountNumber) return false
    }
    
    return true
  }

  const getFieldError = (fieldName: string) => {
    const value = payoutDetails[fieldName]
    if (!value) return null
    
    switch (fieldName) {
      case 'upiId':
        return !validateUPI(value) ? 'Invalid UPI ID format' : null
      case 'accountNumber':
        return !validateAccountNumber(value) ? 'Invalid account number' : null
      case 'confirmAccountNumber':
        return payoutDetails.accountNumber && value !== payoutDetails.accountNumber ? 'Account numbers do not match' : null
      case 'ifscCode':
        return !validateIFSC(value) ? 'Invalid IFSC code format' : null
      default:
        return null
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields')
      return
    }
    
    setLoading(true)
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]
      const response = await apiRequest('api/razorpay-withdrawals/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          withdrawalMethod: selectedMethod!.id,
          payoutDetails
        })
      })
      
      const data = await response.json()
      console.log('Withdrawal submission response:', data) // Debug log
      
      if (response.ok && data.success) {
        toast.success('Withdrawal request submitted successfully!')
        setStep(1)
        setSelectedMethod(null)
        setAmount('')
        setPayoutDetails({})
        fetchWithdrawalHistory()
        fetchUserBalance() // Refresh balance after withdrawal
      } else {
        toast.error(data.message || 'Failed to create withdrawal request')
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      toast.error('Failed to create withdrawal request')
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (iconName: string) => {
    switch (iconName) {
      case '🏦': return <Building className="w-6 h-6" />
      case '📱': return <Smartphone className="w-6 h-6" />
      case '💳': return <Wallet className="w-6 h-6" />
      case '⚡': return <Zap className="w-6 h-6" />
      default: return <CreditCard className="w-6 h-6" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-green-600 bg-green-50'
      case 'processing': return 'text-blue-600 bg-blue-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'failed': case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return <CheckCircle className="w-4 h-4" />
      case 'processing': case 'pending': return <Clock className="w-4 h-4" />
      case 'failed': case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Withdraw Your Earnings</h2>
            <p className="text-green-100">
              Convert your credits to real money with multiple payout options
            </p>
          </div>
          <button
            onClick={fetchUserBalance}
            disabled={balanceLoading}
            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors disabled:opacity-50 text-sm"
          >
            {balanceLoading ? 'Loading...' : 'Refresh Balance'}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            {balanceLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-white/20 rounded mb-1"></div>
                <div className="h-4 bg-white/20 rounded w-20"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{userBalance.availableCredits}</div>
                <div className="text-sm text-green-100">Credits Ready</div>
              </>
            )}
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            {balanceLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-white/20 rounded mb-1"></div>
                <div className="h-4 bg-white/20 rounded w-16"></div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">₹{Math.floor(userBalance.availableCredits / 10)}</div>
                <div className="text-sm text-green-100">Cash Value</div>
              </>
            )}
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">₹10</div>
            <div className="text-sm text-green-100">Minimum Withdrawal</div>
          </div>
        </div>
      </div>

      {/* Toggle between withdraw and history */}
      <div className="flex space-x-4">
        <button
          onClick={() => setShowHistory(false)}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            !showHistory 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          New Withdrawal
        </button>
        <button
          onClick={() => setShowHistory(true)}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            showHistory 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Withdrawal History
        </button>
      </div>

      {!showHistory ? (
        <div className="bg-white rounded-xl shadow-lg p-6">
          {step === 1 && (
            <div>
              <h3 className="text-xl font-semibold mb-6">Choose Withdrawal Method</h3>
              {methodsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading withdrawal methods...</span>
                </div>
              ) : methods.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No withdrawal methods available at the moment.</p>
                  <button 
                    onClick={fetchWithdrawalMethods}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {methods.map(method => (
                  <div
                    key={method.id}
                    onClick={() => handleMethodSelect(method)}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        {getMethodIcon(method.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold">{method.name}</h4>
                          <span className="text-sm text-green-600 font-medium">
                            {method.fee}% fee
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{method.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Min: ₹{method.minAmount}</span>
                          <span>{method.processingTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && selectedMethod && (
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <button
                  onClick={() => setStep(1)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  ← Back
                </button>
                <h3 className="text-xl font-semibold">
                  {selectedMethod.name} Details
                </h3>
              </div>

              <div className="space-y-6">
                {/* Amount Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Withdrawal Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min={selectedMethod.minAmount}
                    max={Math.floor(userBalance.availableCredits / 10)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Min ₹${selectedMethod.minAmount}`}
                  />
                  {amount && (
                    <div className="mt-2 text-sm text-gray-600">
                      <div>Credits required: {getCreditsRequired()}</div>
                      <div>Processing fee: ₹{calculateFee()}</div>
                      <div className="font-semibold">You'll receive: ₹{getNetAmount()}</div>
                    </div>
                  )}
                </div>

                {/* Payout Details */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Payout Details</h4>
                  {selectedMethod.fields.map(field => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={payoutDetails[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={field.required}
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div>
                          <input
                            type={field.type}
                            value={payoutDetails[field.name] || ''}
                            onChange={(e) => handleFieldChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              getFieldError(field.name) ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required={field.required}
                          />
                          {getFieldError(field.name) && (
                            <p className="mt-1 text-sm text-red-600">{getFieldError(field.name)}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Summary */}
                {amount && validateForm() && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">Withdrawal Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>₹{amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fee ({selectedMethod.fee}%):</span>
                        <span>₹{calculateFee()}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>You'll Receive:</span>
                        <span>₹{getNetAmount()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Processing Time:</span>
                        <span>{selectedMethod.processingTime}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!validateForm() || loading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Submit Withdrawal Request'}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-6">Withdrawal History</h3>
          {history.length > 0 ? (
            <div className="space-y-4">
              {history.map(withdrawal => (
                <div key={withdrawal.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                        <span className="capitalize">{withdrawal.status}</span>
                      </span>
                      <span className="text-sm text-gray-600 capitalize">
                        {withdrawal.withdrawalMethod.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{withdrawal.amount}</div>
                      <div className="text-sm text-gray-500">
                        Net: ₹{withdrawal.netAmount}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div>Requested: {new Date(withdrawal.createdAt).toLocaleString()}</div>
                    {withdrawal.processedAt && (
                      <div>Processed: {new Date(withdrawal.processedAt).toLocaleString()}</div>
                    )}
                    {withdrawal.failureReason && (
                      <div className="text-red-600 mt-1">Reason: {withdrawal.failureReason}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No withdrawal history yet. Make your first withdrawal!
            </div>
          )}
        </div>
      )}
    </div>
  )
}

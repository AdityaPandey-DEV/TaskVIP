'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Gift, 
  TrendingUp, 
  Download, 
  Clock, 
  CheckCircle,
  Crown,
  ArrowRight,
  RefreshCw,
  Target,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CreditTransaction {
  id: string
  amount: number
  type: string
  source: string
  description: string
  status: string
  createdAt: string
  vestedAt?: string
}

interface CreditStats {
  totalCredits: number
  availableCredits: number
  withdrawableCredits: number
  dailyCreditsEarned: number
  dailyCreditLimit: number
  streak: number
}

export default function CreditsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [stats, setStats] = useState<CreditStats | null>(null)
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (user) {
      fetchCreditStats()
      fetchTransactions()
    }
  }, [user, currentPage])

  const fetchCreditStats = async () => {
    try {
      const response = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching credit stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`/api/credits/history?page=${currentPage}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleWithdraw = () => {
    router.push('/withdraw')
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'task_completion':
        return <Target className="w-5 h-5 text-primary-600" />
      case 'referral_bonus':
        return <Users className="w-5 h-5 text-success-600" />
      case 'vip_purchase':
        return <Crown className="w-5 h-5 text-purple-600" />
      case 'withdrawal':
        return <Download className="w-5 h-5 text-warning-600" />
      default:
        return <Gift className="w-5 h-5 text-gray-600" />
    }
  }

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) {
      return 'text-success-600'
    } else {
      return 'text-warning-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credit Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Gift className="w-8 h-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">{stats?.availableCredits || 0}</div>
                <div className="stat-label">Available Credits</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-success-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">{stats?.totalCredits || 0}</div>
                <div className="stat-label">Total Credits</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Download className="w-8 h-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">{stats?.withdrawableCredits || 0}</div>
                <div className="stat-label">Withdrawable Credits</div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Credits Earned Today</span>
                <span className="text-sm font-semibold text-primary-600">
                  {stats?.dailyCreditsEarned || 0}/{stats?.dailyCreditLimit || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((stats?.dailyCreditsEarned || 0) / (stats?.dailyCreditLimit || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Current Streak</span>
                <span className="text-sm font-semibold text-success-600">
                  {stats?.streak || 0} days
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Keep earning daily to maintain your streak!
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Section */}
        {stats && stats.withdrawableCredits >= 100 ? (
          <div className="bg-success-50 border border-success-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-success-900 mb-2">
                  Ready to Withdraw!
                </h3>
                <p className="text-success-700">
                  You have ₹{stats.withdrawableCredits} available for withdrawal.
                </p>
              </div>
              <button
                onClick={handleWithdraw}
                className="btn btn-success"
              >
                <Download className="w-4 h-4 mr-2" />
                Withdraw Now
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-warning-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-warning-900 mb-2">
                  Minimum Withdrawal: ₹100
                </h3>
                <p className="text-warning-700">
                  You need ₹{100 - (stats?.withdrawableCredits || 0)} more to withdraw.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Transaction History</h2>
              <button
                onClick={() => {
                  fetchTransactions()
                  fetchCreditStats()
                }}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {loadingTransactions ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
              <p className="text-gray-600 mb-4">
                Start completing tasks to earn credits!
              </p>
              <Link href="/tasks" className="btn btn-primary">
                <Target className="w-4 h-4 mr-2" />
                View Tasks
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {transaction.description}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span className="capitalize">{transaction.type.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{formatDate(transaction.createdAt)}</span>
                          {transaction.status === 'vested' && (
                            <>
                              <span>•</span>
                              <span className="flex items-center text-success-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Completed
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                        {transaction.amount > 0 ? '+' : ''}₹{transaction.amount}
                      </div>
                      <div className="text-sm text-gray-500">
                        {transaction.source.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* VIP Upgrade Prompt */}
        {!user.isVipActive && (
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Earn More with VIP
                </h3>
                <p className="text-gray-600">
                  Get higher daily limits, better rewards, and exclusive earning opportunities.
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


'use client'

import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { useAuth } from '@/contexts/AuthContext'
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Shield,
  Crown,
  Target,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  Settings
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  vipUsers: number
  totalRevenue: number
  totalPayouts: number
  netProfit: number
  todayEarnings: number
  todayPayouts: number
}

interface RecentActivity {
  type: string
  user: {
    firstName: string
    lastName: string
    userType: string
  }
  amount: number
  description: string
  createdAt: string
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (user) {
        fetchAdminStats()
        fetchRecentActivity()
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login'
      }
    }
  }, [user, loading])

  const fetchAdminStats = async () => {
    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      if (response.status === 401 || response.status === 403) {
        setUnauthorized(true)
        return
      }
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/stats/recent-activity?limit=10', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data.activity)
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    } finally {
      setLoadingActivity(false)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
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

  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard
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
              <Shield className="w-8 h-8 text-primary-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">TaskVIP Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="btn btn-secondary">
                Back to Dashboard
              </Link>
              <button
                onClick={() => {
                  fetchAdminStats()
                  fetchRecentActivity()
                }}
                className="btn btn-primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">{stats?.totalUsers || 0}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Crown className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">{stats?.vipUsers || 0}</div>
                <div className="stat-label">VIP Users</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="w-8 h-8 text-success-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">{formatCurrency(stats?.totalRevenue || 0)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">{formatCurrency(stats?.netProfit || 0)}</div>
                <div className="stat-label">Net Profit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Earnings</h3>
            <div className="text-3xl font-bold text-success-600 mb-2">
              {formatCurrency(stats?.todayEarnings || 0)}
            </div>
            <div className="text-sm text-gray-600">
              Revenue generated today
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Payouts</h3>
            <div className="text-3xl font-bold text-warning-600 mb-2">
              {formatCurrency(stats?.todayPayouts || 0)}
            </div>
            <div className="text-sm text-gray-600">
              Amount paid out today
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn btn-primary">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </button>
            <button className="btn btn-secondary">
              <DollarSign className="w-4 h-4 mr-2" />
              View Transactions
            </button>
            <button className="btn btn-secondary">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>

          {loadingActivity ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No recent activity</h3>
              <p className="text-gray-600">
                Activity will appear here as users interact with the platform.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentActivity.map((activity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 mr-4">
                        {activity.type === 'credit_earned' ? (
                          <Target className="w-8 h-8 text-primary-600" />
                        ) : (
                          <Crown className="w-8 h-8 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {activity.description}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>
                            {activity.user.firstName} {activity.user.lastName}
                          </span>
                          <span>•</span>
                          <span className="capitalize">{activity.user.userType}</span>
                          <span>•</span>
                          <span>{formatDate(activity.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-success-600">
                        +{formatCurrency(activity.amount)}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {activity.type.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-success-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Database</h4>
              <p className="text-sm text-gray-600">Connected</p>
            </div>
            <div className="text-center">
              <div className="bg-success-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Email Service</h4>
              <p className="text-sm text-gray-600">Operational</p>
            </div>
            <div className="text-center">
              <div className="bg-success-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Payment Gateway</h4>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


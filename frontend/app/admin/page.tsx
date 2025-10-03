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
  Settings,
  PieChart,
  UserCheck,
  Activity,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'
import ReferralTree from '@/components/ReferralTree'
import VipPricingManagement from '@/components/VipPricingManagement'

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
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Check if user is admin
        if (user.role !== 'admin' && !user.isAdmin) {
          setUnauthorized(true)
          return
        }
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

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'referrals', name: 'Referral Tree', icon: UserCheck },
              { id: 'vip-pricing', name: 'VIP Pricing', icon: Crown },
              { id: 'analytics', name: 'Analytics', icon: PieChart },
              { id: 'transactions', name: 'Transactions', icon: CreditCard }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <AdminDashboard />
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{stats?.totalUsers || 0}</div>
                      <div className="text-sm text-blue-700">Total Users</div>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Crown className="w-8 h-8 text-purple-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-purple-900">{stats?.vipUsers || 0}</div>
                      <div className="text-sm text-purple-700">VIP Users</div>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Activity className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">{stats?.activeUsers || 0}</div>
                      <div className="text-sm text-green-700">Active Users</div>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-orange-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-orange-900">{formatCurrency(stats?.totalRevenue || 0)}</div>
                      <div className="text-sm text-orange-700">Total Revenue</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">User Management Interface</h4>
                <p className="text-gray-600">Advanced user management features will be implemented here.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Tree Visualization</h3>
              <ReferralTree />
            </div>
          </div>
        )}

        {activeTab === 'vip-pricing' && (
          <div className="space-y-6">
            <VipPricingManagement />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics Dashboard</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">User Growth Analytics</h4>
                  <p className="text-gray-600">Charts and graphs showing user growth trends</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Revenue Analytics</h4>
                  <p className="text-gray-600">Revenue trends and financial insights</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">VIP Distribution</h4>
                  <p className="text-gray-600">VIP level distribution and conversion rates</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Referral Analytics</h4>
                  <p className="text-gray-600">Referral performance and network analysis</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-green-900">{formatCurrency(stats?.totalRevenue || 0)}</div>
                      <div className="text-sm text-green-700">Total Revenue</div>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CreditCard className="w-8 h-8 text-red-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-red-900">{formatCurrency(stats?.totalPayouts || 0)}</div>
                      <div className="text-sm text-red-700">Total Payouts</div>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-blue-600 mr-3" />
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{formatCurrency(stats?.netProfit || 0)}</div>
                      <div className="text-sm text-blue-700">Net Profit</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Transaction Management Interface</h4>
                <p className="text-gray-600">Advanced transaction management features will be implemented here.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


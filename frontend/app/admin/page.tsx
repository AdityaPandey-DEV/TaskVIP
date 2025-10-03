'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
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
  BarChart3,
  Activity,
  CreditCard,
  Calendar,
  Clock,
  Star,
  Zap,
  Database,
  Server,
  Globe,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  vipUsers: number
  totalRevenue: number
  totalPayouts: number
  netProfit: number
  todayEarnings: number
  todayPayouts: number
  pendingWithdrawals: number
  pendingTasks: number
  systemHealth: 'healthy' | 'warning' | 'critical'
  lastBackup: string
  serverUptime: string
  userGrowth?: Array<{
    date: string
    users: number
  }>
  vipDistribution?: Array<{
    level: number
    count: number
    name: string
  }>
  recentActivity?: Array<{
    id: string
    type: string
    user: string
    amount?: number
    timestamp: string
  }>
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  vipLevel: number
  isVipActive: boolean
  totalCredits: number
  coinBalance: number
  kycStatus: string
  isActive: boolean
  streak: number
  createdAt: string
  lastLogin: string
  totalEarnings: number
  referralCount: number
}

interface Withdrawal {
  id: string
  userId: string
  userEmail: string
  amount: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  method: string
  createdAt: string
  processedAt?: string
}

interface RecentActivity {
  id: string
  type: 'user_signup' | 'vip_purchase' | 'withdrawal' | 'task_completion' | 'referral'
  user: string
  amount?: number
  description: string
  timestamp: string
  status: 'success' | 'pending' | 'failed'
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // State management
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  
  // Loading states
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true)
  const [loadingActivity, setLoadingActivity] = useState(true)
  
  // UI states
  const [activeTab, setActiveTab] = useState('overview')
  const [unauthorized, setUnauthorized] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Check admin access
  useEffect(() => {
    if (!loading && user) {
      if (user.role !== 'admin' && !user.isAdmin) {
        setUnauthorized(true)
        return
      }
      fetchAllData()
    } else if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading])

  const fetchAllData = async () => {
    try {
      setLoadingStats(true)
      setLoadingUsers(true)
      setLoadingWithdrawals(true)
      setLoadingActivity(true)
      
      await Promise.all([
        fetchAdminStats(),
        fetchUsers(),
        fetchWithdrawals(),
        fetchRecentActivity()
      ])
    } catch (error) {
      console.error('Error fetching all data:', error)
      toast.error('Failed to refresh data')
    }
  }

  const handleRefresh = async () => {
    toast.loading('Refreshing data...')
    await fetchAllData()
    toast.success('Data refreshed successfully')
  }

  const fetchAdminStats = async () => {
    try {
      setLoadingStats(true)
      const response = await fetch('/api/admin-dashboard/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        console.error('Failed to fetch admin stats:', response.status, response.statusText)
        toast.error('Failed to load admin statistics')
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
      toast.error('Failed to load admin statistics')
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await fetch('/api/admin-dashboard/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText)
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true)
      const response = await fetch('/api/admin-dashboard/transactions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.transactions || [])
      } else {
        console.error('Failed to fetch withdrawals:', response.status, response.statusText)
        toast.error('Failed to load withdrawals')
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      toast.error('Failed to load withdrawals')
    } finally {
      setLoadingWithdrawals(false)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      setLoadingActivity(true)
      // Use the dashboard endpoint which includes recent activity
      const response = await fetch('/api/admin-dashboard/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data.recentActivity || [])
      } else {
        console.error('Failed to fetch recent activity:', response.status, response.statusText)
        toast.error('Failed to load recent activity')
      }
    } catch (error) {
      console.error('Error fetching activity:', error)
      toast.error('Failed to load recent activity')
    } finally {
      setLoadingActivity(false)
    }
  }

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast.success(`User ${action} successful`)
        fetchUsers()
      } else {
        toast.error(`Failed to ${action} user`)
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error)
      toast.error(`Failed to ${action} user`)
    }
  }

  const handleWithdrawalAction = async (withdrawalId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawalId}/${action}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast.success(`Withdrawal ${action} successful`)
        fetchWithdrawals()
      } else {
        toast.error(`Failed to ${action} withdrawal`)
      }
    } catch (error) {
      console.error(`Error ${action} withdrawal:`, error)
      toast.error(`Failed to ${action} withdrawal`)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'processing': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // Unauthorized access
  if (unauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">TaskVIP Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <Link href="/dashboard" className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <ArrowUpRight className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'withdrawals', name: 'Withdrawals', icon: CreditCard },
              { id: 'activity', name: 'Activity', icon: Activity },
              { id: 'settings', name: 'Settings', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+12% from last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">VIP Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.vipUsers || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+8% from last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+15% from last month</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Profit</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.netProfit || 0)}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+22% from last month</span>
                </div>
              </div>
            </div>

            {/* User Growth Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">User Growth Analytics</h3>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg">Last 30 Days</button>
                  <button className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Last 7 Days</button>
                </div>
              </div>
              
              {stats?.userGrowth && stats.userGrowth.length > 0 ? (
                <div className="h-64 flex items-end space-x-2">
                  {stats.userGrowth.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                        style={{ 
                          height: `${Math.max((data.users / Math.max(...stats.userGrowth.map(d => d.users))) * 200, 10)}px` 
                        }}
                        title={`${data.date}: ${data.users} users`}
                      ></div>
                      <div className="mt-2 text-xs text-gray-500 transform -rotate-45 origin-left">
                        {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No user growth data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* VIP Distribution Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">VIP Distribution</h3>
                <div className="text-sm text-gray-500">Total: {stats?.vipUsers || 0} VIP users</div>
              </div>
              
              {stats?.vipDistribution && stats.vipDistribution.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {stats.vipDistribution.map((vip, index) => (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {vip.level}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{vip.name}</div>
                      <div className="text-lg font-bold text-gray-700">{vip.count}</div>
                      <div className="text-xs text-gray-500">users</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Crown className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No VIP distribution data available</p>
                  </div>
                </div>
              )}
            </div>

            {/* System Health */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getHealthColor(stats?.systemHealth || 'healthy')}`}>
                  <div className={`w-2 h-2 rounded-full ${getHealthColor(stats?.systemHealth || 'healthy').split(' ')[0]}`}></div>
                  <span className="capitalize">{stats?.systemHealth || 'healthy'}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <Server className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Server Uptime</p>
                    <p className="font-medium text-gray-900">{stats?.serverUptime || '99.9%'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Last Backup</p>
                    <p className="font-medium text-gray-900">{stats?.lastBackup || '2 hours ago'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="font-medium text-gray-900">{stats?.activeUsers || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View All</button>
              </div>
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' : 
                      activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                    {activity.amount && (
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(activity.amount)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="vip">VIP Users</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        VIP Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Credits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {user.firstName[0]}{user.lastName[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.vipLevel > 0 ? (
                              <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                <Crown className="w-3 h-3" />
                                <span>VIP {user.vipLevel}</span>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">Free</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.coinBalance.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isActive ? 'active' : 'inactive')}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserAction(user.id, user.isActive ? 'deactivate' : 'activate')}
                              className={user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                            >
                              {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </button>
                            <button className="text-gray-600 hover:text-gray-900">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Withdrawal Requests</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{withdrawal.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(withdrawal.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {withdrawal.method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(withdrawal.status)}`}>
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(withdrawal.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {withdrawal.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Activity</h3>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' : 
                      activity.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatDate(activity.timestamp)}</p>
                    </div>
                    {activity.amount && (
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(activity.amount)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                    <p className="text-sm text-gray-500">Enable maintenance mode to prevent user access</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Auto Backup</h4>
                    <p className="text-sm text-gray-500">Automatically backup database daily</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-500">Send email notifications for important events</p>
                  </div>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
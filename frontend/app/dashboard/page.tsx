'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'
import { apiRequest } from '@/lib/api'
import { 
  PlayCircle, 
  Users, 
  Star, 
  Gift, 
  TrendingUp,
  Crown,
  Zap,
  Clock,
  CheckCircle,
  ArrowRight,
  Copy,
  Share2,
  Target,
  Award,
  Menu,
  Bell,
  Settings,
  LogOut,
  Coins,
  Calendar,
  Activity,
  Smartphone,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { RewardSystem } from '@/components/RewardSystem'

interface DashboardStats {
  totalCredits: number
  availableCredits: number
  dailyCreditsEarned: number
  dailyCreditLimit: number
  streak: number
  totalTasks: number
  completedTasks: number
  referralStats: {
    totalReferrals: number
    totalEarnings: number
    activeReferrals: number
  }
}

interface Task {
  id: string
  type: string
  title: string
  description: string
  reward: number
  status: string
  adNetwork: string
  expiresAt: string
  isExpired: boolean
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = Cookies.get('token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  useEffect(() => {
    if (!loading) {
      if (user) {
        fetchDashboardData()
      } else {
        // Redirect to login if not authenticated
        window.location.href = '/login'
      }
    }
  }, [user, loading])

  const fetchDashboardData = async () => {
    try {
      setLoadingStats(true)
      setLoadingTasks(true)

      // Fetch user stats
      const statsResponse = await apiRequest('api/credits/balance', {
        headers: getAuthHeaders()
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        // Transform the API response to match the expected interface
        const transformedStats = {
          availableCredits: statsData.availableCredits || 0,
          totalCredits: statsData.totalCredits || 0,
          dailyCreditsEarned: statsData.user?.dailyCreditsEarned || 0,
          dailyCreditLimit: statsData.user?.dailyCreditLimit || 0,
          streak: 0, // Not available from this endpoint
          totalTasks: 0, // Not available from this endpoint
          completedTasks: 0, // Not available from this endpoint
          referralStats: {
            totalReferrals: 0, // Not available from this endpoint
            totalEarnings: 0, // Not available from this endpoint
            activeReferrals: 0 // Not available from this endpoint
          }
        }
        setStats(transformedStats)
      } else {
        console.error('Failed to fetch stats:', statsResponse.status)
      }
      setLoadingStats(false)

      // Fetch daily tasks
      const tasksResponse = await apiRequest('api/tasks/daily', {
        headers: getAuthHeaders()
      })
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        setTasks(tasksData.tasks || [])
      } else {
        console.error('Failed to fetch tasks:', tasksResponse.status)
      }
      setLoadingTasks(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoadingStats(false)
      setLoadingTasks(false)
    }
  }

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`
    navigator.clipboard.writeText(referralLink)
    // You could add a toast notification here
  }

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md mx-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Welcome to TaskVIP</h1>
          <p className="text-slate-600 mb-6">Please sign in to access your dashboard</p>
          <Link href="/login" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors">
            Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-slate-800">TaskVIP</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{user.firstName?.[0]}</span>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative flex flex-col w-64 bg-white shadow-xl">
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-slate-800">TaskVIP</h2>
                  <p className="text-sm text-slate-500">Earn & Grow</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-medium">
                <Activity className="w-4 h-4" />
                <span className="text-sm">Dashboard</span>
              </Link>
              <Link href="/tasks" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
                <Target className="w-4 h-4" />
                <span className="text-sm">Tasks</span>
              </Link>
              <Link href="/referrals" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
                <Users className="w-4 h-4" />
                <span className="text-sm">Referrals</span>
              </Link>
              <Link href="/vip" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
                <Crown className="w-4 h-4" />
                <span className="text-sm">VIP</span>
              </Link>
              <Link href="/withdraw" className="flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Withdraw</span>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800">TaskVIP</h2>
                <p className="text-sm text-slate-500">Earn & Grow</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <Link href="/dashboard" className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium">
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link href="/tasks" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
              <Target className="w-4 h-4" />
              <span>Tasks</span>
            </Link>
            <Link href="/referrals" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
              <Users className="w-4 h-4" />
              <span>Referrals</span>
            </Link>
            <Link href="/vip" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
              <Crown className="w-4 h-4" />
              <span>VIP</span>
            </Link>
            <Link href="/withdraw" className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors">
              <DollarSign className="w-4 h-4" />
              <span>Withdraw</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-50">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">{user.firstName?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:pl-64 flex-1">
          {/* Desktop Header */}
          <div className="hidden lg:flex bg-white border-b border-slate-200 px-6 py-4 items-center justify-between sticky top-0 z-40">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Welcome back, {user.firstName}! 👋</h1>
              <p className="text-slate-600">Here's what's happening with your account today.</p>
            </div>
            <div className="flex items-center space-x-4">
              {user.vipLevel > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                  <Crown className="w-4 h-4 text-white" />
                  <span className="text-white font-medium text-sm">VIP {user.vipLevel}</span>
                </div>
              )}
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <Settings className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
            {/* Mobile Welcome Header */}
            <div className="lg:hidden bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-slate-800">Welcome back, {user.firstName}! 👋</h1>
                  <p className="text-sm text-slate-600">Ready to earn some coins?</p>
                </div>
                {user.vipLevel > 0 && (
                  <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                    <Crown className="w-3 h-3 text-white" />
                    <span className="text-white font-medium text-xs">VIP {user.vipLevel}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {/* Available Credits */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 lg:mb-4">
                  <div className="flex items-center justify-between lg:justify-start lg:space-x-3 mb-2 lg:mb-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                      <Coins className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full lg:hidden">Available</span>
                  </div>
                  <span className="hidden lg:inline-flex text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Available</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xl lg:text-2xl font-bold text-slate-800">{stats?.availableCredits || 0}</p>
                  <p className="text-xs lg:text-sm text-slate-500">Credits Ready</p>
                </div>
              </div>

              {/* Total Earned */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 lg:mb-4">
                  <div className="flex items-center justify-between lg:justify-start lg:space-x-3 mb-2 lg:mb-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full lg:hidden">Total</span>
                  </div>
                  <span className="hidden lg:inline-flex text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Total</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xl lg:text-2xl font-bold text-slate-800">{stats?.totalCredits || 0}</p>
                  <p className="text-xs lg:text-sm text-slate-500">Total Earned</p>
                </div>
              </div>

              {/* Daily Progress */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 lg:mb-4">
                  <div className="flex items-center justify-between lg:justify-start lg:space-x-3 mb-2 lg:mb-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full lg:hidden">Today</span>
                  </div>
                  <span className="hidden lg:inline-flex text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Today</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xl lg:text-2xl font-bold text-slate-800">
                    {stats?.dailyCreditsEarned || 0}/{stats?.dailyCreditLimit || 0}
                  </p>
                  <p className="text-xs lg:text-sm text-slate-500">Daily Progress</p>
                </div>
                <div className="mt-2 lg:mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-1.5 lg:h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 h-1.5 lg:h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(((stats?.dailyCreditsEarned || 0) / (stats?.dailyCreditLimit || 1)) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 lg:mb-4">
                  <div className="flex items-center justify-between lg:justify-start lg:space-x-3 mb-2 lg:mb-0">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg lg:rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full lg:hidden">Streak</span>
                  </div>
                  <span className="hidden lg:inline-flex text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Streak</span>
                </div>
                <div className="space-y-1">
                  <p className="text-xl lg:text-2xl font-bold text-slate-800">{stats?.streak || 0}</p>
                  <p className="text-xs lg:text-sm text-slate-500">Days Active</p>
                </div>
              </div>
            </div>

            {/* Reward System */}
            <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 lg:p-6 border-b border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-2 sm:mb-0">
                    <h2 className="text-lg lg:text-xl font-bold text-slate-800">🎯 Earn Rewards</h2>
                    <p className="text-sm lg:text-base text-slate-600">Complete tasks and earn coins that you can withdraw as real money</p>
                  </div>
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-500">
                    <Clock className="w-4 h-4" />
                    <span>Updated just now</span>
                  </div>
                </div>
              </div>
              <div className="p-4 lg:p-6">
                <RewardSystem />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Referral Program */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white bg-opacity-20 rounded-lg lg:rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium bg-white bg-opacity-20 px-2 py-1 rounded-full">Referrals</span>
                </div>
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <h3 className="text-base lg:text-lg font-semibold mb-1 lg:mb-2">Invite Friends & Earn</h3>
                    <p className="text-blue-100 text-sm">Share your referral code and earn bonus credits for every friend who joins!</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white bg-opacity-10 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-blue-100">Your Referral Code</p>
                      <p className="font-mono font-bold text-sm lg:text-base truncate">{user.referralCode}</p>
                    </div>
                    <button 
                      onClick={copyReferralLink}
                      className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors ml-2"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:gap-4 text-center">
                    <div>
                      <p className="text-xl lg:text-2xl font-bold">{stats?.referralStats?.totalReferrals || 0}</p>
                      <p className="text-xs text-blue-100">Total Referrals</p>
                    </div>
                    <div>
                      <p className="text-xl lg:text-2xl font-bold">{stats?.referralStats?.totalEarnings || 0}</p>
                      <p className="text-xs text-blue-100">Bonus Earned</p>
                    </div>
                  </div>
                  <Link 
                    href="/referrals" 
                    className="flex items-center justify-center space-x-2 w-full py-2.5 lg:py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors text-sm lg:text-base"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* VIP Status */}
              <div className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg lg:rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">VIP</span>
                </div>
                
                {user.vipLevel > 0 ? (
                  <div className="space-y-3 lg:space-y-4">
                    <div>
                      <h3 className="text-base lg:text-lg font-semibold text-slate-800 mb-1 lg:mb-2">VIP Level {user.vipLevel}</h3>
                      <p className="text-slate-600 text-sm">You're earning {user.vipLevel === 1 ? '20%' : user.vipLevel === 2 ? '50%' : '100%'} more on all tasks!</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Expires</span>
                        <span className="font-medium text-slate-800">
                          {user.vipExpiry ? new Date(user.vipExpiry).toLocaleDateString() : 'Never'}
                        </span>
                      </div>
                    </div>
                    <Link 
                      href="/vip" 
                      className="flex items-center justify-center space-x-2 w-full py-2.5 lg:py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-colors text-sm lg:text-base"
                    >
                      <span>Manage VIP</span>
                      <Crown className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3 lg:space-y-4">
                    <div>
                      <h3 className="text-base lg:text-lg font-semibold text-slate-800 mb-1 lg:mb-2">Upgrade to VIP</h3>
                      <p className="text-slate-600 text-sm">Unlock higher earning potential with VIP membership!</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Up to 2x more coins</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Higher daily limits</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Priority support</span>
                      </div>
                    </div>
                    <Link 
                      href="/vip" 
                      className="flex items-center justify-center space-x-2 w-full py-2.5 lg:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-colors text-sm lg:text-base"
                    >
                      <span>Upgrade Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile App Promotion */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm lg:text-base">Get the Mobile App</h3>
                      <p className="text-slate-300 text-xs lg:text-sm">Earn on the go with our mobile app</p>
                    </div>
                  </div>
                  <p className="text-slate-300 text-sm mb-4 hidden sm:block">
                    Download our mobile app for the best TaskVIP experience. Complete tasks anywhere, anytime!
                  </p>
                  <div className="flex space-x-3">
                    <button className="px-3 py-1.5 lg:px-4 lg:py-2 bg-white text-slate-800 rounded-lg font-medium text-xs lg:text-sm hover:bg-slate-100 transition-colors">
                      Coming Soon
                    </button>
                  </div>
                </div>
                <div className="hidden sm:block ml-4 lg:ml-6">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white bg-opacity-10 rounded-xl lg:rounded-2xl flex items-center justify-center">
                    <Smartphone className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
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
  Award
} from 'lucide-react'
import Link from 'next/link'
import { BannerAd, SidebarAd, InlineAd, VideoAd, NativeAd } from '@/components/AdComponents'

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

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch user stats
      const statsResponse = await fetch('/api/credits/balance', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch daily tasks
      const tasksResponse = await fetch('/api/tasks/daily', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        setTasks(tasksData.tasks)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoadingStats(false)
      setLoadingTasks(false)
    }
  }

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`
    navigator.clipboard.writeText(referralLink)
    // You could add a toast notification here
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
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Welcome back,</div>
                <div className="font-semibold text-gray-900">{user.firstName}</div>
              </div>
              <div className="flex items-center space-x-2">
                {user.isVipActive && (
                  <span className="vip-badge">VIP {user.vipLevel}</span>
                )}
                <button className="btn btn-secondary btn-sm">
                  Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Banner Ad - Maximum Visibility */}
        <BannerAd className="mb-6" />
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Gift className="w-8 h-8 text-success-600" />
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
                <TrendingUp className="w-8 h-8 text-primary-600" />
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
                <Target className="w-8 h-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">
                  {stats?.dailyCreditsEarned || 0}/{stats?.dailyCreditLimit || 0}
                </div>
                <div className="stat-label">Daily Progress</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">{stats?.streak || 0}</div>
                <div className="stat-label">Day Streak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Inline Ad after Stats */}
        <InlineAd className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Tasks */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Daily Tasks</h2>
                <p className="text-gray-600">Complete tasks to earn credits</p>
              </div>
              
              {loadingTasks ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div key={task.id} className="task-card">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{task.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className="task-reward">+{task.reward} credits</span>
                            <span className={`task-status task-status-${task.status}`}>
                              {task.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {task.adNetwork}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {task.status === 'pending' ? (
                            <button className="btn btn-primary btn-sm">
                              Start
                            </button>
                          ) : task.status === 'completed' ? (
                            <button className="btn btn-success btn-sm">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Completed
                            </button>
                          ) : (
                            <button className="btn btn-secondary btn-sm" disabled>
                              {task.status}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sidebar Ad - High Value */}
            <SidebarAd />
            
            {/* VIP Status */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">VIP Status</h3>
              </div>
              {user.isVipActive ? (
                <div className="text-center">
                  <div className="vip-badge mb-4">VIP {user.vipLevel}</div>
                  <p className="text-sm text-gray-600 mb-4">
                    Expires: {new Date(user.vipExpiry || '').toLocaleDateString()}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Daily Limit:</span>
                      <span className="font-semibold">{stats?.dailyCreditLimit || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Referral Bonus:</span>
                      <span className="font-semibold">5%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-900 mb-2">Upgrade to VIP</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Unlock higher daily limits and better rewards
                  </p>
                  <Link href="/vip" className="btn btn-primary w-full">
                    View Plans
                  </Link>
                </div>
              )}
            </div>

            {/* Video Ad - High Value */}
            <VideoAd className="my-4" />

            {/* Referral Program */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Referral Program</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Your Referral Code</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={user.referralCode}
                      readOnly
                      className="referral-link flex-1"
                    />
                    <button
                      onClick={copyReferralLink}
                      className="btn btn-secondary ml-2"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary-600">
                      {stats?.referralStats.totalReferrals || 0}
                    </div>
                    <div className="text-sm text-gray-600">Referrals</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-success-600">
                      {stats?.referralStats.totalEarnings || 0}
                    </div>
                    <div className="text-sm text-gray-600">Earned</div>
                  </div>
                </div>

                <Link href="/referrals" className="btn btn-secondary w-full">
                  <Users className="w-4 h-4 mr-2" />
                  View Referrals
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="space-y-3">
                <Link href="/tasks" className="btn btn-primary w-full">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  View All Tasks
                </Link>
                <Link href="/credits" className="btn btn-secondary w-full">
                  <Gift className="w-4 h-4 mr-2" />
                  Credit History
                </Link>
                <Link href="/redeem" className="btn btn-success w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Redeem Credits
                </Link>
              </div>
            </div>
            
            {/* Native Ad - Bottom Placement */}
            <NativeAd className="mt-4" />
          </div>
        </div>
        
        {/* Bottom Banner Ad - Final Impression */}
        <BannerAd className="mt-8" />
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import { Users, TrendingUp, Award, Copy, Share2, Eye, DollarSign } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ReferralStats {
  referrals: {
    level1: { count: number; users: any[] }
    level2: { count: number; users: any[] }
    level3: { count: number; users: any[] }
  }
  commissions: {
    level1: { total: number; count: number }
    level2: { total: number; count: number }
    level3: { total: number; count: number }
  }
  totalReferrals: number
  totalCommissions: number
}

interface Commission {
  id: string
  from: { name: string; email: string }
  level: number
  percentage: number
  originalAmount: number
  commissionAmount: number
  transactionType: string
  status: string
  createdAt: string
}

export default function MultiLevelReferrals() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showReferralTree, setShowReferralTree] = useState(false)

  useEffect(() => {
    if (user) {
      fetchReferralStats()
      fetchCommissions()
    }
  }, [user])

  const fetchReferralStats = async () => {
    try {
      const response = await apiRequest('api/multi-level-referrals/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error)
    }
  }

  const fetchCommissions = async () => {
    try {
      const response = await apiRequest('api/multi-level-referrals/commissions?limit=10')
      const data = await response.json()
      if (data.success) {
        setCommissions(data.data.commissions)
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = () => {
    const referralLink = `https://task-vip.vercel.app/register?ref=${user?.referralCode}`
    navigator.clipboard.writeText(referralLink)
    toast.success('Referral link copied to clipboard!')
  }

  const shareReferralLink = async () => {
    const referralLink = `https://task-vip.vercel.app/register?ref=${user?.referralCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TaskVIP and Earn Money!',
          text: 'Complete tasks, watch ads, and earn real money with TaskVIP. Use my referral code to get started!',
          url: referralLink
        })
      } catch (error) {
        copyReferralLink()
      }
    } else {
      copyReferralLink()
    }
  }

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'text-yellow-600 bg-yellow-50'
      case 2: return 'text-blue-600 bg-blue-50'
      case 3: return 'text-purple-600 bg-purple-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getLevelPercentage = (level: number) => {
    switch (level) {
      case 1: return '50%'
      case 2: return '10%'
      case 3: return '5%'
      default: return '0%'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">3-Level Referral System</h2>
        <p className="text-blue-100 mb-4">
          Earn commissions from 3 levels: Level 1 (50%), Level 2 (10%), Level 3 (5%)
        </p>
        
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Your Referral Code</span>
            <div className="flex gap-2">
              <button
                onClick={copyReferralLink}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={shareReferralLink}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-2xl font-bold tracking-wider">
            {user?.referralCode}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Users className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.referrals.level1.count || 0}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Level 1 Referrals</h3>
          <p className="text-sm text-gray-500">Direct referrals (50%)</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.referrals.level2.count || 0}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Level 2 Referrals</h3>
          <p className="text-sm text-gray-500">Indirect referrals (10%)</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {stats?.referrals.level3.count || 0}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Level 3 Referrals</h3>
          <p className="text-sm text-gray-500">Deep referrals (5%)</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              ₹{stats?.totalCommissions || 0}
            </span>
          </div>
          <h3 className="font-semibold text-gray-900">Total Earnings</h3>
          <p className="text-sm text-gray-500">From all levels</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'commissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Commission History
            </button>
            <button
              onClick={() => setActiveTab('tree')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tree'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Referral Tree
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Commission Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Commission Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map(level => (
                    <div key={level} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(level)}`}>
                          Level {level}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                          {getLevelPercentage(level)}
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        ₹{stats?.commissions[`level${level}` as keyof typeof stats.commissions]?.total || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        {stats?.commissions[`level${level}` as keyof typeof stats.commissions]?.count || 0} transactions
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div>
                <h3 className="text-lg font-semibold mb-4">How It Works</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                      <div>
                        <div className="font-medium">Level 1 (Direct) - 50%</div>
                        <div className="text-sm text-gray-600">When someone you refer makes a purchase, you earn 50% commission</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                      <div>
                        <div className="font-medium">Level 2 (Indirect) - 10%</div>
                        <div className="text-sm text-gray-600">When your referrals refer others, you earn 10% from their purchases</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                      <div>
                        <div className="font-medium">Level 3 (Deep) - 5%</div>
                        <div className="text-sm text-gray-600">From third-level referrals, you earn 5% commission</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commissions' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Commissions</h3>
              {commissions.length > 0 ? (
                <div className="space-y-3">
                  {commissions.map(commission => (
                    <div key={commission.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(commission.level)}`}>
                            Level {commission.level}
                          </span>
                          <div>
                            <div className="font-medium">{commission.from.name}</div>
                            <div className="text-sm text-gray-500">{commission.transactionType.replace('_', ' ')}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">+₹{commission.commissionAmount}</div>
                          <div className="text-xs text-gray-500">
                            {commission.percentage}% of ₹{commission.originalAmount}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No commissions yet. Start referring friends to earn!
                </div>
              )}
            </div>
          )}

          {activeTab === 'tree' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Referral Network</h3>
              <div className="space-y-6">
                {[1, 2, 3].map(level => (
                  <div key={level}>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor(level)}`}>
                        Level {level} ({getLevelPercentage(level)})
                      </span>
                      <span className="text-gray-500">
                        {stats?.referrals[`level${level}` as keyof typeof stats.referrals]?.count || 0} referrals
                      </span>
                    </div>
                    {stats?.referrals[`level${level}` as keyof typeof stats.referrals]?.users.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.referrals[`level${level}` as keyof typeof stats.referrals].users.slice(0, 6).map((user: any, index: number) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">
                              Joined {new Date(user.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">No referrals at this level yet</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

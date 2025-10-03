'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'
import { apiRequest } from '@/lib/api'
import { 
  Users, 
  Gift, 
  Share2, 
  Copy, 
  CheckCircle,
  Crown,
  TrendingUp,
  Target,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ReferralStats {
  totalReferrals: number
  activeReferrals: number
  totalEarnings: number
  pendingEarnings: number
}

interface Referral {
  id: string
  referredUser: {
    firstName: string
    lastName: string
    email: string
    userType: string
    vipLevel: number
    createdAt: string
  }
  status: string
  bonusCredits: number
  pendingCredits: number
  totalEarnings: number
  createdAt: string
}

export default function ReferralsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingReferrals, setLoadingReferrals] = useState(true)
  const [copied, setCopied] = useState(false)
  const [commissionStructure, setCommissionStructure] = useState({
    signupBonus: { amount: 10, currency: 'INR' },
    dailyCommission: { percentage: 10 }
  })

  useEffect(() => {
    if (!loading) {
      if (user) {
        fetchReferralStats()
        fetchReferrals()
        fetchCommissionStructure()
      } else {
        // Redirect to login if not authenticated
        router.push('/login')
      }
    }
  }, [user, loading, router])

  const getAuthHeaders = () => {
    const token = Cookies.get('token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  const fetchReferralStats = async () => {
    try {
      const response = await apiRequest('api/users/referral-stats', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchReferrals = async () => {
    try {
      const response = await apiRequest('api/referrals/my-referrals', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setReferrals(data.referrals)
      }
    } catch (error) {
      console.error('Error fetching referrals:', error)
    } finally {
      setLoadingReferrals(false)
    }
  }

  const fetchCommissionStructure = async () => {
    try {
      const response = await apiRequest('api/referral-bonus/commission-structure')
      if (response.ok) {
        const data = await response.json()
        setCommissionStructure(data)
      }
    } catch (error) {
      console.error('Error fetching commission structure:', error)
    }
  }

  const copyReferralLink = async () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}/register?ref=${user?.referralCode}`
    const shareText = `Join TaskVIP and start earning money by watching ads! Use my referral code: ${user?.referralCode}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TaskVIP',
          text: shareText,
          url: referralLink
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copying to clipboard
      copyReferralLink()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success-600 bg-success-100'
      case 'pending':
        return 'text-warning-600 bg-warning-100'
      case 'inactive':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
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
        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">{stats?.totalReferrals || 0}</div>
                <div className="stat-label">Total Referrals</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">{stats?.activeReferrals || 0}</div>
                <div className="stat-label">Active Referrals</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Gift className="w-8 h-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">₹{stats?.totalEarnings || 0}</div>
                <div className="stat-label">Total Earned</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="stat-value">₹{stats?.pendingEarnings || 0}</div>
                <div className="stat-label">Pending Earnings</div>
              </div>
            </div>
          </div>
        </div>

        {/* Referral Link Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Referral Link</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Referral Code</label>
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

            <div>
              <label className="label">Referral Link</label>
              <div className="flex">
                <input
                  type="text"
                  value={`${window.location.origin}/register?ref=${user.referralCode}`}
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

            {copied && (
              <div className="text-sm text-success-600 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Copied to clipboard!
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={shareReferralLink}
                className="btn btn-primary"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Referral Link
              </button>
              <button
                onClick={() => {
                  fetchReferralStats()
                  fetchReferrals()
                }}
                className="btn btn-secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How Referrals Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Share Your Link</h3>
              <p className="text-sm text-gray-600">
                Share your referral link with friends and family
              </p>
            </div>
            <div className="text-center">
              <div className="bg-success-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-success-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">They Sign Up</h3>
              <p className="text-sm text-gray-600">
                When they sign up using your link, you get ₹{commissionStructure.signupBonus.amount} bonus
              </p>
            </div>
            <div className="text-center">
              <div className="bg-warning-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-warning-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Earn Forever</h3>
              <p className="text-sm text-gray-600">
                Earn 10% of their daily earnings for life
              </p>
            </div>
          </div>
        </div>

        {/* Referrals List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Your Referrals</h2>
          </div>

          {loadingReferrals ? (
            <div className="flex justify-center py-8">
              <div className="loading-spinner"></div>
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No referrals yet</h3>
              <p className="text-gray-600 mb-4">
                Start sharing your referral link to earn bonus credits!
              </p>
              <button
                onClick={shareReferralLink}
                className="btn btn-primary"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Your Link
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {referrals.map((referral) => (
                <div key={referral.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">
                            {referral.referredUser.firstName[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="font-semibold text-gray-900">
                          {referral.referredUser.firstName} {referral.referredUser.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{referral.referredUser.email}</span>
                          <span>•</span>
                          <span>Joined {formatDate(referral.createdAt)}</span>
                          <span>•</span>
                          <span className="capitalize">{referral.referredUser.userType}</span>
                          {referral.referredUser.vipLevel > 0 && (
                            <>
                              <span>•</span>
                              <span className="vip-badge">VIP {referral.referredUser.vipLevel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-lg font-semibold text-success-600">
                            ₹{referral.totalEarnings}
                          </div>
                          <div className="text-sm text-gray-500">Total Earned</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-warning-600">
                            ₹{referral.pendingCredits}
                          </div>
                          <div className="text-sm text-gray-500">Pending</div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(referral.status)}`}>
                            {referral.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* VIP Upgrade Prompt */}
        {!user.isVipActive && (
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Earn More with VIP Referrals
                </h3>
                <p className="text-gray-600">
                  VIP members get higher referral bonuses and exclusive referral opportunities.
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


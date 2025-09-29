'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Crown, 
  CheckCircle, 
  Star, 
  Zap, 
  Shield, 
  TrendingUp,
  ArrowRight,
  Gift,
  Users,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface VipPlan {
  level: number
  name: string
  price: number
  duration: string
  features: string[]
  popular: boolean
  dailyAdsLimit: number
  perAdReward: number
  maxDailyEarning: number
  referralBonus: number
  monthlyEarning: number
}

export default function VipPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [plans, setPlans] = useState<VipPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)

  useEffect(() => {
    fetchVipPlans()
  }, [])

  const fetchVipPlans = async () => {
    try {
      const response = await fetch('/api/vip/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error fetching VIP plans:', error)
    } finally {
      setLoadingPlans(false)
    }
  }

  const handlePurchase = async (planLevel: number) => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/vip/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ level: planLevel })
      })

      if (response.ok) {
        const data = await response.json()
        // Handle successful purchase
        alert('VIP purchase successful!')
        router.push('/dashboard')
      } else {
        const error = await response.json()
        alert(error.message || 'Purchase failed')
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Purchase failed')
    }
  }

  if (loading || loadingPlans) {
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
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Upgrade to <span className="text-primary-600">VIP</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock higher daily limits, better rewards, and exclusive earning opportunities. 
            Choose your VIP level and maximize your earning potential.
          </p>
        </div>

        {/* Current Status */}
        {user.isVipActive ? (
          <div className="bg-success-50 border border-success-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-success-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-success-900">
                  You are currently VIP {user.vipLevel}
                </h3>
                <p className="text-success-700">
                  Expires: {new Date(user.vipExpiry || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-warning-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-warning-900">
                  You are currently a Free user
                </h3>
                <p className="text-warning-700">
                  Upgrade to VIP to unlock higher earning potential
                </p>
              </div>
            </div>
          </div>
        )}

        {/* VIP Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.level}
              className={`card relative ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <div className="vip-badge mb-4">{plan.name}</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  ₹{plan.price}
                </div>
                <div className="text-gray-600 mb-6">{plan.duration}</div>
                
                {/* Key Benefits */}
                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Daily Ads Limit</span>
                    <span className="font-semibold text-primary-600">{plan.dailyAdsLimit}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Per Ad Reward</span>
                    <span className="font-semibold text-success-600">₹{plan.perAdReward}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Daily Earning Cap</span>
                    <span className="font-semibold text-warning-600">₹{plan.maxDailyEarning}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Referral Bonus</span>
                    <span className="font-semibold text-purple-600">₹{plan.referralBonus}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">Monthly Potential</span>
                    <span className="font-semibold text-primary-600">₹{plan.monthlyEarning}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 text-left">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-success-600 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePurchase(plan.level)}
                  disabled={user.isVipActive && user.vipLevel >= plan.level}
                  className={`btn w-full ${
                    plan.popular ? 'btn-primary' : 'btn-secondary'
                  } ${user.isVipActive && user.vipLevel >= plan.level ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {user.isVipActive && user.vipLevel >= plan.level ? (
                    'Current Plan'
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Choose VIP?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Higher Earnings</h3>
              <p className="text-sm text-gray-600">
                Earn up to ₹2.5 per ad with VIP 3
              </p>
            </div>
            <div className="text-center">
              <div className="bg-success-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-success-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">More Ads</h3>
              <p className="text-sm text-gray-600">
                Watch up to 100 ads per day
              </p>
            </div>
            <div className="text-center">
              <div className="bg-warning-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-warning-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Better Bonuses</h3>
              <p className="text-sm text-gray-600">
                Higher referral bonuses and rewards
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Priority Support</h3>
              <p className="text-sm text-gray-600">
                Get help faster with VIP support
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                How long does VIP membership last?
              </h3>
              <p className="text-gray-600">
                VIP membership is valid for 30 days from the date of purchase. You can renew anytime to continue enjoying VIP benefits.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I upgrade my VIP level?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade to a higher VIP level anytime. The difference in price will be charged, and your membership will be extended.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What happens when VIP expires?
              </h3>
              <p className="text-gray-600">
                When your VIP membership expires, you'll automatically become a Free user with the standard earning limits and rewards.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Are there any hidden fees?
              </h3>
              <p className="text-gray-600">
                No, there are no hidden fees. The price you see is exactly what you pay. All VIP benefits are included in the membership fee.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


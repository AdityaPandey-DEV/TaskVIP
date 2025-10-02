'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import Cookies from 'js-cookie'
import { apiRequest } from '@/lib/api'
import { Crown, CheckCircle, Star, Zap, Shield, Loader2 } from 'lucide-react'

interface VipLevel {
  level: number
  name: string
  price: number // in coins
  dailyCreditLimitMultiplier: number
  referralBonusMultiplier: number
  exclusiveOffers: boolean
  description: string
}

export function VipBenefits() {
  const { user, loading, updateUser } = useAuth()
  const [vipLevels, setVipLevels] = useState<VipLevel[]>([])
  const [loadingVipLevels, setLoadingVipLevels] = useState(true)
  const [upgrading, setUpgrading] = useState<number | null>(null)

  const getAuthHeaders = () => {
    const token = Cookies.get('token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  useEffect(() => {
    if (user && !loading) {
      fetchVipLevels()
    }
  }, [user, loading])

  const fetchVipLevels = async () => {
    setLoadingVipLevels(true)
    try {
      const response = await apiRequest('api/vip/levels', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setVipLevels(data.levels || getDefaultVipLevels())
      } else {
        console.error('Failed to fetch VIP levels:', response.status)
        setVipLevels(getDefaultVipLevels())
      }
    } catch (error) {
      console.error('Error fetching VIP levels:', error)
      setVipLevels(getDefaultVipLevels())
    } finally {
      setLoadingVipLevels(false)
    }
  }

  const getDefaultVipLevels = (): VipLevel[] => [
    {
      level: 0,
      name: 'Free',
      price: 0,
      dailyCreditLimitMultiplier: 1,
      referralBonusMultiplier: 1,
      exclusiveOffers: false,
      description: 'Basic access to earning opportunities'
    },
    {
      level: 1,
      name: 'VIP Bronze',
      price: 1000,
      dailyCreditLimitMultiplier: 1.5,
      referralBonusMultiplier: 1.2,
      exclusiveOffers: true,
      description: 'Enhanced earning limits and exclusive offers'
    },
    {
      level: 2,
      name: 'VIP Silver',
      price: 2500,
      dailyCreditLimitMultiplier: 2,
      referralBonusMultiplier: 1.5,
      exclusiveOffers: true,
      description: 'Higher earning potential with premium rewards'
    },
    {
      level: 3,
      name: 'VIP Gold',
      price: 5000,
      dailyCreditLimitMultiplier: 3,
      referralBonusMultiplier: 2,
      exclusiveOffers: true,
      description: 'Maximum earning potential with exclusive benefits'
    }
  ]

  const handleUpgrade = async (level: number) => {
    if (!user) {
      toast.error('Please sign in to upgrade VIP.')
      return
    }
    setUpgrading(level)
    try {
      const response = await apiRequest('api/vip/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ vipLevel: level })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || `Successfully upgraded to VIP Level ${level}!`)
        if (updateUser) {
          updateUser(data.user) // Update user context
        }
        fetchVipLevels() // Refresh levels to show updated status
      } else {
        toast.error(data.message || 'Failed to upgrade VIP.')
      }
    } catch (error) {
      console.error('Error upgrading VIP:', error)
      toast.error('Error upgrading VIP.')
    } finally {
      setUpgrading(null)
    }
  }

  if (loadingVipLevels) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="ml-3 text-gray-600">Loading VIP levels...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Upgrade to <span className="text-blue-600">VIP</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Unlock higher daily limits, better rewards, and exclusive earning opportunities.
          Choose your VIP level and maximize your earning potential.
        </p>
      </div>

      {user?.isVipActive && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
          <h3 className="text-xl font-semibold text-green-800 mb-2">
            <CheckCircle className="inline-block w-6 h-6 mr-2" /> You are currently a VIP Level {user.vipLevel}!
          </h3>
          <p className="text-green-700">
            Your VIP membership expires on {new Date(user.vipExpiry || '').toLocaleDateString()}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {vipLevels.map((level) => (
          <div
            key={level.level}
            className={`bg-white rounded-lg shadow-lg border p-6 text-center ${
              user?.vipLevel === level.level && user?.isVipActive 
                ? 'border-blue-500 ring-2 ring-blue-500' 
                : 'border-gray-200'
            }`}
          >
            <Crown className={`w-12 h-12 mx-auto mb-4 ${
              user?.vipLevel === level.level && user?.isVipActive 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{level.name}</h3>
            <p className="text-4xl font-extrabold text-blue-600 mb-4">
              {level.price === 0 ? 'Free' : `${level.price} Coins`}
            </p>
            <p className="text-gray-600 mb-6">{level.description}</p>
            <ul className="text-left text-gray-700 space-y-2 mb-6">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Daily Credit Limit: x{level.dailyCreditLimitMultiplier}
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                Referral Bonus: x{level.referralBonusMultiplier}
              </li>
              {level.exclusiveOffers && (
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Exclusive Offers
                </li>
              )}
            </ul>
            {user?.vipLevel === level.level && user?.isVipActive ? (
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium" disabled>
                Current VIP
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade(level.level)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={upgrading === level.level || (user && user.availableCredits < level.price)}
              >
                {upgrading === level.level ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                    Upgrading...
                  </>
                ) : (
                  'Upgrade Now'
                )}
              </button>
            )}
            {user && user.availableCredits < level.price && !user.isVipActive && level.price > 0 && (
              <p className="text-red-500 text-sm mt-2">Not enough coins to upgrade.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

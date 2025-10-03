'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import Cookies from 'js-cookie'
import { apiRequest } from '@/lib/api'
import { Crown, CheckCircle, Star, Zap, Shield, Loader2, CreditCard } from 'lucide-react'

// Declare Razorpay for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

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
        if (data.success && data.levels) {
          setVipLevels(data.levels)
        } else {
          console.error('Invalid VIP levels response:', data)
          setVipLevels([])
        }
      } else {
        console.error('Failed to fetch VIP levels:', response.status)
        setVipLevels([])
      }
    } catch (error) {
      console.error('Error fetching VIP levels:', error)
      setVipLevels([])
    } finally {
      setLoadingVipLevels(false)
    }
  }


  const handleRazorpayPayment = async (level: number, amount: number) => {
    try {
      // Create Razorpay order
      const orderResponse = await apiRequest('api/vip/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ 
          vipLevel: level,
          amount: amount * 100 // Convert to paise
        })
      })

      const orderData = await orderResponse.json()
      
      if (!orderResponse.ok) {
        throw new Error(orderData.message || 'Failed to create order')
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: 'INR',
        name: 'TaskVIP',
        description: `${vipLevels.find(v => v.level === level)?.name} VIP Subscription`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await apiRequest('api/vip/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                vipLevel: level
              })
            })

            const verifyData = await verifyResponse.json()

            if (verifyResponse.ok) {
              toast.success(`Successfully upgraded to ${vipLevels.find(v => v.level === level)?.name} VIP!`)
              if (updateUser) {
                updateUser(verifyData.user)
              }
              fetchVipLevels()
            } else {
              toast.error(verifyData.message || 'Payment verification failed')
            }
          } catch (error) {
            console.error('Payment verification error:', error)
            toast.error('Payment verification failed')
          } finally {
            setUpgrading(null)
          }
        },
        prefill: {
          name: `${user?.firstName} ${user?.lastName}`,
          email: user?.email,
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: () => {
            setUpgrading(null)
            toast.error('Payment cancelled')
          }
        }
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      console.error('Razorpay payment error:', error)
      toast.error('Payment initialization failed')
      setUpgrading(null)
    }
  }

  const handleUpgrade = async (level: number) => {
    if (!user) {
      toast.error('Please sign in to upgrade VIP.')
      return
    }

    // Prevent downgrade or same level upgrade
    if (user.vipLevel >= level && user.isVipActive) {
      toast.error('You cannot downgrade or upgrade to your current VIP level.')
      return
    }

    setUpgrading(level)

    const vipLevel = vipLevels.find(v => v.level === level)
    if (!vipLevel) {
      toast.error('Invalid VIP level selected.')
      setUpgrading(null)
      return
    }

    // Free tier upgrade (using coins)
    if (level === 0 || vipLevel.price === 0) {
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
          toast.success(data.message || `Successfully upgraded to ${vipLevel.name}!`)
          if (updateUser) {
            updateUser(data.user)
          }
          fetchVipLevels()
        } else {
          toast.error(data.message || 'Failed to upgrade VIP.')
        }
      } catch (error) {
        console.error('Error upgrading VIP:', error)
        toast.error('Error upgrading VIP.')
      } finally {
        setUpgrading(null)
      }
    } else {
      // Paid tier upgrade (using Razorpay)
      if (!window.Razorpay) {
        toast.error('Payment system not loaded. Please refresh the page.')
        setUpgrading(null)
        return
      }
      
      await handleRazorpayPayment(level, vipLevel.price)
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

  if (vipLevels.length === 0) {
    return (
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">VIP Levels Not Available</h3>
        <p className="text-gray-600 mb-4">
          We're currently setting up our VIP membership plans. Please check back later.
        </p>
        <button 
          onClick={fetchVipLevels}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
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
              {level.price === 0 ? 'Free' : `₹${level.price}/month`}
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
                <CheckCircle className="w-4 h-4 mr-2 inline" />
                Current Plan
              </button>
            ) : user && user.vipLevel > level.level && user.isVipActive ? (
              <button className="w-full bg-gray-400 text-white py-2 px-4 rounded-lg font-medium" disabled>
                Lower Tier
              </button>
            ) : level.level === 0 ? (
              <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium" disabled>
                <CheckCircle className="w-4 h-4 mr-2 inline" />
                Acquired
              </button>
            ) : (
              <button
                onClick={() => handleUpgrade(level.level)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={upgrading === level.level}
              >
                {upgrading === level.level ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

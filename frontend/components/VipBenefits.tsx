'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Crown, Star, Zap, Gift, TrendingUp, Shield } from 'lucide-react'

interface VipTier {
  level: number
  name: string
  price: number
  monthlyPrice: number
  coinMultiplier: number
  dailyLimit: number
  features: string[]
  color: string
  popular?: boolean
}

export function VipBenefits() {
  const { user } = useAuth()
  const [selectedTier, setSelectedTier] = useState<number | null>(null)

  const vipTiers: VipTier[] = [
    {
      level: 0,
      name: 'Free',
      price: 0,
      monthlyPrice: 0,
      coinMultiplier: 1.0,
      dailyLimit: 1000,
      features: [
        '10 video ads per day',
        '5 app installs per day',
        '6 surveys per day',
        'Basic support',
        'Standard withdrawal (7 days)'
      ],
      color: 'gray'
    },
    {
      level: 1,
      name: 'Bronze VIP',
      price: 99,
      monthlyPrice: 99,
      coinMultiplier: 1.2,
      dailyLimit: 1500,
      features: [
        '20% more coins on all tasks',
        '20 video ads per day',
        '8 app installs per day',
        '10 surveys per day',
        'Priority support',
        'Fast withdrawal (3-5 days)',
        'Exclusive bronze tasks'
      ],
      color: 'orange'
    },
    {
      level: 2,
      name: 'Silver VIP',
      price: 199,
      monthlyPrice: 199,
      coinMultiplier: 1.5,
      dailyLimit: 2500,
      features: [
        '50% more coins on all tasks',
        'Unlimited video ads',
        '15 app installs per day',
        '15 surveys per day',
        'VIP support chat',
        'Express withdrawal (1-2 days)',
        'Exclusive silver tasks',
        'Weekly bonus coins',
        'Referral bonus boost'
      ],
      color: 'gray',
      popular: true
    },
    {
      level: 3,
      name: 'Gold VIP',
      price: 399,
      monthlyPrice: 399,
      coinMultiplier: 2.0,
      dailyLimit: 5000,
      features: [
        '100% more coins on all tasks',
        'Unlimited everything',
        'Premium high-paying tasks',
        'Dedicated account manager',
        'Instant withdrawal (same day)',
        'Exclusive gold tasks',
        'Daily bonus coins',
        'Maximum referral bonuses',
        'Early access to new features',
        'Custom earning strategies'
      ],
      color: 'yellow'
    }
  ];

  const getCurrentTier = () => {
    return vipTiers.find(tier => tier.level === (user?.vipLevel || 0)) || vipTiers[0];
  };

  const getColorClasses = (color: string, isSelected: boolean = false) => {
    const baseClasses = isSelected ? 'ring-2 ring-offset-2' : '';
    
    switch (color) {
      case 'orange':
        return `${baseClasses} border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 ${isSelected ? 'ring-orange-500' : ''}`;
      case 'gray':
        return `${baseClasses} border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 ${isSelected ? 'ring-gray-500' : ''}`;
      case 'yellow':
        return `${baseClasses} border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 ${isSelected ? 'ring-yellow-500' : ''}`;
      default:
        return `${baseClasses} border-gray-200 bg-white ${isSelected ? 'ring-blue-500' : ''}`;
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'orange': return 'text-orange-600';
      case 'gray': return 'text-gray-600';
      case 'yellow': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const currentTier = getCurrentTier();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Crown className="w-8 h-8 text-yellow-500 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">VIP Membership</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Unlock higher earning potential with VIP membership. Get more coins, higher limits, and exclusive tasks.
        </p>
      </div>

      {/* Current Status */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Crown className={`w-6 h-6 mr-2 ${getIconColor(currentTier.color)}`} />
            <div>
              <h3 className="font-semibold text-blue-900">Current Status: {currentTier.name}</h3>
              <p className="text-sm text-blue-700">
                {currentTier.coinMultiplier}x multiplier • {currentTier.dailyLimit} coins daily limit
              </p>
            </div>
          </div>
          {user?.vipLevel > 0 && (
            <div className="text-right">
              <div className="text-sm text-blue-600">Expires</div>
              <div className="font-medium text-blue-900">
                {user.vipExpiry ? new Date(user.vipExpiry).toLocaleDateString() : 'Never'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIP Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vipTiers.map((tier) => (
          <div
            key={tier.level}
            className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${getColorClasses(tier.color, selectedTier === tier.level)}`}
            onClick={() => setSelectedTier(selectedTier === tier.level ? null : tier.level)}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}

            <div className="text-center mb-4">
              <Crown className={`w-8 h-8 mx-auto mb-2 ${getIconColor(tier.color)}`} />
              <h3 className="text-lg font-bold text-gray-900">{tier.name}</h3>
              <div className="mt-2">
                {tier.price === 0 ? (
                  <span className="text-2xl font-bold text-gray-900">Free</span>
                ) : (
                  <div>
                    <span className="text-2xl font-bold text-gray-900">₹{tier.price}</span>
                    <span className="text-sm text-gray-600">/month</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Coin Multiplier</span>
                <span className="font-semibold text-green-600">{tier.coinMultiplier}x</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Daily Limit</span>
                <span className="font-semibold">{tier.dailyLimit.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {tier.features.map((feature, index) => (
                <div key={index} className="flex items-start text-sm">
                  <Star className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              {tier.level === (user?.vipLevel || 0) ? (
                <div className="w-full py-2 px-4 bg-green-100 text-green-800 rounded-lg text-center font-medium">
                  Current Plan
                </div>
              ) : tier.level === 0 ? (
                <div className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded-lg text-center font-medium">
                  Free Forever
                </div>
              ) : (
                <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  {tier.level < (user?.vipLevel || 0) ? 'Downgrade' : 'Upgrade Now'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Earning Comparison */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">💰 Earning Potential Comparison</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {vipTiers.map((tier) => (
            <div key={tier.level} className="bg-white rounded-lg p-4">
              <div className="font-semibold text-gray-900 mb-2">{tier.name}</div>
              <div className="text-2xl font-bold text-green-600 mb-1">
                ₹{Math.round((tier.dailyLimit * 0.01) * 30)}
              </div>
              <div className="text-xs text-gray-500">per month*</div>
              <div className="text-xs text-gray-400 mt-1">
                ({tier.dailyLimit} coins/day)
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center mt-4">
          *Estimated based on daily limits. Actual earnings depend on task availability and completion.
        </p>
      </div>

      {/* Benefits Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4">
          <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h4 className="font-semibold mb-1">Higher Multipliers</h4>
          <p className="text-sm text-gray-600">Earn up to 2x more coins on every task</p>
        </div>
        <div className="text-center p-4">
          <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h4 className="font-semibold mb-1">Increased Limits</h4>
          <p className="text-sm text-gray-600">Higher daily earning limits for maximum income</p>
        </div>
        <div className="text-center p-4">
          <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h4 className="font-semibold mb-1">Priority Support</h4>
          <p className="text-sm text-gray-600">Faster withdrawals and dedicated support</p>
        </div>
      </div>
    </div>
  );
}

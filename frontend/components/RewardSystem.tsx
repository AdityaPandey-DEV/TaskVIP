'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'

interface RewardTask {
  id: string
  type: 'admob_video' | 'cpalead_offer' | 'adgate_survey' | 'daily_bonus'
  title: string
  description: string
  coinReward: number
  vipMultiplier: number
  dailyLimit: number
  completedToday: number
  isAvailable: boolean
  estimatedTime: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface UserCoins {
  balance: number
  totalEarned: number
  todayEarned: number
  dailyLimit: number
}

export function RewardSystem() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<RewardTask[]>([])
  const [coins, setCoins] = useState<UserCoins>({
    balance: 0,
    totalEarned: 0,
    todayEarned: 0,
    dailyLimit: 1000
  })
  const [loading, setLoading] = useState(true)

  const getAuthHeaders = () => {
    const token = Cookies.get('token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  useEffect(() => {
    if (user) {
      fetchRewardTasks()
      fetchUserCoins()
    }
  }, [user])

  const fetchRewardTasks = async () => {
    try {
      const response = await fetch('/api/rewards/tasks', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching reward tasks:', error)
    }
  }

  const fetchUserCoins = async () => {
    try {
      const response = await fetch('/api/coins/balance', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setCoins(data)
      }
    } catch (error) {
      console.error('Error fetching user coins:', error)
    } finally {
      setLoading(false)
    }
  }

  const completeTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/rewards/complete/${taskId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        // Refresh data
        fetchRewardTasks()
        fetchUserCoins()
        // Show success message
        alert(`Task completed! You earned ${data.coinsEarned} coins!`)
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to complete task')
      }
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Failed to complete task')
    }
  }

  const getVipMultiplier = () => {
    if (!user) return 1
    switch (user.vipLevel) {
      case 1: return 1.2
      case 2: return 1.5
      case 3: return 2.0
      default: return 1
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'admob_video':
        return '📺'
      case 'cpalead_offer':
        return '🎯'
      case 'adgate_survey':
        return '📋'
      case 'daily_bonus':
        return '🎁'
      default:
        return '⭐'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Coin Balance Card */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">💰 Your Coins</h2>
            <div className="space-y-1">
              <p className="text-lg">Balance: <span className="font-bold">{coins.balance.toLocaleString()}</span> coins</p>
              <p className="text-sm opacity-90">Today: {coins.todayEarned}/{coins.dailyLimit} coins</p>
              <p className="text-sm opacity-90">Total Earned: {coins.totalEarned.toLocaleString()} coins</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl mb-2">🪙</div>
            {user?.vipLevel > 0 && (
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 text-sm">
                VIP {user.vipLevel} • {getVipMultiplier()}x
              </div>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Daily Progress</span>
            <span>{Math.round((coins.todayEarned / coins.dailyLimit) * 100)}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((coins.todayEarned / coins.dailyLimit) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Reward Tasks */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-xl font-bold mb-4">🎯 Available Tasks</h3>
        
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🎯</div>
            <p>No tasks available right now</p>
            <p className="text-sm">Check back later for new opportunities!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map(task => (
              <div key={task.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getTaskIcon(task.type)}</span>
                      <div>
                        <h4 className="font-semibold text-lg">{task.title}</h4>
                        <p className="text-gray-600 text-sm">{task.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <span className="text-yellow-500">🪙</span>
                        <span className="font-medium">{task.coinReward}</span>
                        {user?.vipLevel > 0 && (
                          <span className="text-green-600">
                            (+{Math.round(task.coinReward * (getVipMultiplier() - 1))})
                          </span>
                        )}
                        coins
                      </span>
                      
                      <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(task.difficulty)}`}>
                        {task.difficulty}
                      </span>
                      
                      <span className="text-gray-500">
                        ⏱️ {task.estimatedTime}
                      </span>
                      
                      <span className="text-gray-500">
                        {task.completedToday}/{task.dailyLimit} today
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <button
                      onClick={() => completeTask(task.id)}
                      disabled={!task.isAvailable || task.completedToday >= task.dailyLimit}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        task.isAvailable && task.completedToday < task.dailyLimit
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {task.completedToday >= task.dailyLimit ? 'Limit Reached' : 
                       !task.isAvailable ? 'Unavailable' : 'Start Task'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Info */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💸</div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Cash Out Your Coins</h4>
            <p className="text-blue-700 text-sm mb-2">
              Exchange your coins for real money via Paytm, UPI, or PayPal
            </p>
            <div className="text-sm text-blue-600">
              <p>• 1000 coins = ₹10</p>
              <p>• Minimum withdrawal: ₹50 (5000 coins)</p>
              <p>• Processing time: 2-7 business days</p>
            </div>
            <button className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Withdraw Coins
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

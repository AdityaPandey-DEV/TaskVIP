'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'
import { apiRequest } from '@/lib/api'
import { showRewardedAd } from '@/lib/admob'
import { PlayCircle, DollarSign, Gift, CheckCircle, Loader2, Clock, Zap, Repeat } from 'lucide-react'
import { toast } from 'react-hot-toast'

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
  stats?: {
    totalEarned: number
    todayEarned: number
    dailyLimit: number
  }
  conversionRate?: {
    coinsPerRupee: number
    rupeesPerCoin: number
    minimumWithdrawal: number
  }
}

export function RewardSystem() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<RewardTask[]>([])
  const [coins, setCoins] = useState<UserCoins>({
    balance: 0,
    stats: {
      totalEarned: 0,
      todayEarned: 0,
      dailyLimit: 1000
    }
  })
  const [loading, setLoading] = useState(true)
  const [completingTask, setCompletingTask] = useState<string | null>(null)

  const getAuthHeaders = () => {
    const token = Cookies.get('token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  useEffect(() => {
    if (user) {
      fetchRewardTasks()
      fetchUserCoins()
      // AdMob is now initialized globally in layout
    }
  }, [user])

  const fetchRewardTasks = async () => {
    try {
      const response = await apiRequest('api/rewards/tasks', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      } else {
        console.error('Failed to fetch reward tasks:', response.status)
        // Set default tasks if API fails
        setTasks([
          {
            id: 'admob_video_1',
            type: 'admob_video',
            title: 'Watch Rewarded Video',
            description: 'Watch a short video ad to earn coins',
            coinReward: 10,
            vipMultiplier: 1.5,
            dailyLimit: 20,
            completedToday: 0,
            isAvailable: true,
            estimatedTime: '30 seconds',
            difficulty: 'easy'
          },
          {
            id: 'daily_bonus_1',
            type: 'daily_bonus',
            title: 'Daily Check-in Bonus',
            description: 'Claim your daily login bonus',
            coinReward: 50,
            vipMultiplier: 2,
            dailyLimit: 1,
            completedToday: 0,
            isAvailable: true,
            estimatedTime: '1 second',
            difficulty: 'easy'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching reward tasks:', error)
      // Set default tasks on error
      setTasks([
        {
          id: 'admob_video_1',
          type: 'admob_video',
          title: 'Watch Rewarded Video',
          description: 'Watch a short video ad to earn coins',
          coinReward: 10,
          vipMultiplier: 1.5,
          dailyLimit: 20,
          completedToday: 0,
          isAvailable: true,
          estimatedTime: '30 seconds',
          difficulty: 'easy'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchUserCoins = async () => {
    try {
      const response = await apiRequest('api/coins/balance', {
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const data = await response.json()
        setCoins(data)
      } else {
        console.error('Failed to fetch user coins:', response.status)
      }
    } catch (error) {
      console.error('Error fetching user coins:', error)
    }
  }

  const completeTask = async (taskId: string) => {
    if (completingTask) return
    
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Handle AdMob video tasks differently
    if (task.type === 'admob_video') {
      await handleAdMobVideo(taskId)
      return
    }
    
    // Handle other tasks normally
    setCompletingTask(taskId)
    try {
      const response = await apiRequest(`api/rewards/complete/${taskId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        toast.success(`Task completed! You earned ${data.coinsEarned || 10} coins!`)
        // Refresh data
        fetchRewardTasks()
        fetchUserCoins()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to complete task')
      }
    } catch (error) {
      console.error('Error completing task:', error)
      toast.error('Failed to complete task. Please try again.')
    } finally {
      setCompletingTask(null)
    }
  }

  const handleAdMobVideo = async (taskId: string) => {
    setCompletingTask(taskId)
    
    try {
      // Show enhanced video ad experience
      toast('Loading premium video ad...', { icon: '🎬' })
      
      // Simulate ad loading
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Show the enhanced video dialog
      const watchVideo = await showRewardedAd()
      
      if (watchVideo) {
        // Award coins after video completion
        const response = await apiRequest(`api/rewards/complete/${taskId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          toast.success(`Video completed! You earned ${data.coinsEarned || 5} coins! 🎉`)
          fetchRewardTasks()
          fetchUserCoins()
        } else {
          const error = await response.json()
          toast.error(error.message || 'Failed to award coins')
        }
      } else {
        toast.error('Video was skipped - no reward given')
      }
    } catch (error) {
      console.error('Error with video ad:', error)
      toast.error('Failed to load video ad. Please try again.')
    } finally {
      setCompletingTask(null)
    }
  }

  // Mock video dialog removed - now using real AdMob integration from /lib/admob.ts

  const getTaskIcon = (type: RewardTask['type']) => {
    switch (type) {
      case 'admob_video': return <PlayCircle className="w-5 h-5 text-red-500" />;
      case 'cpalead_offer': return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'adgate_survey': return <Gift className="w-5 h-5 text-blue-500" />;
      case 'daily_bonus': return <Gift className="w-5 h-5 text-purple-500" />;
      default: return <Gift className="w-5 h-5 text-gray-500" />;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="ml-3 text-gray-600">Loading offers...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Coin Balance Card */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-lg p-4 lg:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-3 sm:mb-0">
            <h2 className="text-xl lg:text-2xl font-bold mb-2">💰 Your Coins</h2>
            <div className="space-y-1">
              <p className="text-base lg:text-lg">Balance: <span className="font-bold">{coins.balance?.toLocaleString() || '0'}</span> coins</p>
              <p className="text-sm opacity-90">Today: {coins.stats?.todayEarned || 0}/{coins.stats?.dailyLimit || 1000} coins</p>
              <p className="text-sm opacity-90">Total Earned: {coins.stats?.totalEarned?.toLocaleString() || '0'} coins</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-2xl lg:text-3xl mb-2">🪙</div>
            {user?.vipLevel && user.vipLevel > 0 && (
              <div className="bg-white bg-opacity-20 rounded-full px-2 py-1 text-xs lg:text-sm inline-block">
                VIP Level {user.vipLevel}
              </div>
            )}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Daily Progress</span>
            <span>{Math.round(((coins.stats?.todayEarned || 0) / (coins.stats?.dailyLimit || 1000)) * 100)}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(((coins.stats?.todayEarned || 0) / (coins.stats?.dailyLimit || 1000)) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Available Tasks Section */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Available Tasks</h2>
          <p className="text-sm text-gray-600">Complete these tasks to earn coins!</p>
        </div>
        <div className="p-6">
          {tasks.length === 0 ? (
            <p className="text-center text-gray-500">No tasks available right now. Check back later!</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tasks.map(task => (
                <div key={task.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 lg:gap-3 mb-2">
                        <span className="text-xl lg:text-2xl flex-shrink-0">{getTaskIcon(task.type)}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-base lg:text-lg truncate">{task.title}</h4>
                          <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm">
                        <span className="flex items-center text-gray-500">
                          <Clock className="w-3 h-3 mr-1" /> {task.estimatedTime}
                        </span>
                        <span className="flex items-center text-gray-500">
                          <Zap className="w-3 h-3 mr-1" /> {task.difficulty}
                        </span>
                        <span className="flex items-center text-gray-500">
                          <Repeat className="w-3 h-3 mr-1" /> {task.completedToday}/{task.dailyLimit} Daily
                        </span>
                        <span className="flex items-center text-green-600 font-medium">
                          <Gift className="w-3 h-3 mr-1" /> +{task.coinReward} coins
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 lg:mt-0 lg:ml-4 flex-shrink-0">
                      <button
                        onClick={() => completeTask(task.id)}
                        className="w-full lg:w-auto px-4 lg:px-6 py-2 rounded-lg font-medium text-sm transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!task.isAvailable || task.completedToday >= task.dailyLimit || completingTask === task.id}
                      >
                        {completingTask === task.id ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2 inline" />
                            Processing...
                          </>
                        ) : task.completedToday >= task.dailyLimit ? (
                          'Daily Limit Reached'
                        ) : (
                          'Complete Task'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

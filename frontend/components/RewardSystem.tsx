'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Cookies from 'js-cookie'
import { apiRequest } from '@/lib/api'
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
      // Check if AdMob is available (in a real implementation)
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        // This would be the real AdMob integration
        toast('Loading video ad...', { icon: '📺' })
        
        // Simulate video ad loading and completion
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Show a mock video dialog
        const watchVideo = await showMockVideoDialog()
        
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
            toast.success(`Video completed! You earned ${data.coinsEarned || 5} coins!`)
            fetchRewardTasks()
            fetchUserCoins()
          } else {
            const error = await response.json()
            toast.error(error.message || 'Failed to award coins')
          }
        } else {
          toast.error('Video was not completed')
        }
      } else {
        // Fallback: Direct reward without video (current behavior)
        toast('AdMob not loaded, awarding coins directly...', { icon: '⚡' })
        
        const response = await apiRequest(`api/rewards/complete/${taskId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          toast.success(`Task completed! You earned ${data.coinsEarned || 5} coins!`)
          fetchRewardTasks()
          fetchUserCoins()
        } else {
          const error = await response.json()
          toast.error(error.message || 'Failed to complete task')
        }
      }
    } catch (error) {
      console.error('Error with AdMob video:', error)
      toast.error('Failed to load video ad. Please try again.')
    } finally {
      setCompletingTask(null)
    }
  }

  const showMockVideoDialog = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div')
      dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `
      
      dialog.innerHTML = `
        <div style="
          background: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          max-width: 400px;
          margin: 20px;
        ">
          <h3 style="margin-bottom: 15px; color: #333;">🎬 Rewarded Video Ad</h3>
          <div style="
            width: 300px;
            height: 200px;
            background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
            margin: 15px auto;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            font-weight: bold;
          ">
            📺 Video Playing...
          </div>
          <div style="margin: 15px 0;">
            <div id="countdown" style="font-size: 16px; color: #666;">Watch for 15 seconds to earn coins!</div>
          </div>
          <button id="closeBtn" style="
            background: #dc3545;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
          ">Close (No Reward)</button>
          <button id="completeBtn" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            opacity: 0.5;
            cursor: not-allowed;
          " disabled>Complete (0s)</button>
        </div>
      `
      
      document.body.appendChild(dialog)
      
      const closeBtn = dialog.querySelector('#closeBtn')
      const completeBtn = dialog.querySelector('#completeBtn') as HTMLButtonElement
      const countdown = dialog.querySelector('#countdown')
      
      let timeLeft = 15
      const timer = setInterval(() => {
        timeLeft--
        if (countdown) countdown.textContent = `Watch for ${timeLeft} seconds to earn coins!`
        if (completeBtn) completeBtn.textContent = `Complete (${15-timeLeft}s)`
        
        if (timeLeft <= 0) {
          clearInterval(timer)
          if (completeBtn) {
            completeBtn.disabled = false
            completeBtn.style.opacity = '1'
            completeBtn.style.cursor = 'pointer'
            completeBtn.textContent = 'Claim Reward! 🎉'
          }
          if (countdown) countdown.textContent = 'Video completed! Click to claim your reward.'
        }
      }, 1000)
      
      closeBtn?.addEventListener('click', () => {
        clearInterval(timer)
        document.body.removeChild(dialog)
        resolve(false)
      })
      
      completeBtn?.addEventListener('click', () => {
        if (!completeBtn.disabled) {
          clearInterval(timer)
          document.body.removeChild(dialog)
          resolve(true)
        }
      })
    })
  }

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

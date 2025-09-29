'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  Target, 
  Gift,
  Crown,
  Zap,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
  estimatedTime: string
  requirements: string[]
}

export default function TasksPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stats, setStats] = useState({
    dailyCreditsEarned: 0,
    dailyCreditLimit: 0,
    dailyAdsWatched: 0,
    dailyAdsLimit: 0
  })

  useEffect(() => {
    if (user) {
      fetchTasks()
      fetchUserStats()
    }
  }, [user])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks/daily', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoadingTasks(false)
    }
  }

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/users/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStats({
          dailyCreditsEarned: data.earnings.dailyCreditsEarned,
          dailyCreditLimit: data.limits.maxDailyEarning,
          dailyAdsWatched: data.earnings.dailyAdsWatched,
          dailyAdsLimit: data.limits.dailyAdsLimit
        })
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const handleTaskStart = async (taskId: string) => {
    try {
      const response = await fetch('/api/tasks/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ taskId })
      })

      if (response.ok) {
        const data = await response.json()
        // Handle task start - redirect to ad or show instructions
        if (data.adUrl) {
          window.open(data.adUrl, '_blank')
        }
        // Refresh tasks
        fetchTasks()
        fetchUserStats()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to start task')
      }
    } catch (error) {
      console.error('Error starting task:', error)
      alert('Failed to start task')
    }
  }

  const handleTaskComplete = async (taskId: string) => {
    try {
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ taskId })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Task completed! You earned ${data.credit.amount} credits.`)
        // Refresh tasks and stats
        fetchTasks()
        fetchUserStats()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to complete task')
      }
    } catch (error) {
      console.error('Error completing task:', error)
      alert('Failed to complete task')
    }
  }

  const categories = [
    { id: 'all', name: 'All Tasks', icon: Target },
    { id: 'ads', name: 'Watch Ads', icon: PlayCircle },
    { id: 'offers', name: 'Offers', icon: Gift },
    { id: 'surveys', name: 'Surveys', icon: CheckCircle }
  ]

  const filteredTasks = tasks.filter(task => 
    selectedCategory === 'all' || task.type === selectedCategory
  )

  if (loading || loadingTasks) {
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
        {/* Daily Progress */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Credits Earned</span>
                <span className="text-sm font-semibold text-primary-600">
                  {stats.dailyCreditsEarned}/{stats.dailyCreditLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.dailyCreditsEarned / stats.dailyCreditLimit) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Ads Watched</span>
                <span className="text-sm font-semibold text-success-600">
                  {stats.dailyAdsWatched}/{stats.dailyAdsLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-success-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(stats.dailyAdsWatched / stats.dailyAdsLimit) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {category.name}
              </button>
            )
          })}
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks available</h3>
              <p className="text-gray-600 mb-4">
                {selectedCategory === 'all' 
                  ? 'Check back later for new tasks'
                  : `No ${selectedCategory} tasks available right now`
                }
              </p>
              <button
                onClick={() => {
                  fetchTasks()
                  setSelectedCategory('all')
                }}
                className="btn btn-secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Tasks
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => (
              <div key={task.id} className="task-card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="font-semibold text-gray-900 mr-3">{task.title}</h3>
                      <span className={`task-status task-status-${task.status}`}>
                        {task.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <Gift className="w-4 h-4 mr-1" />
                        <span>+{task.reward} credits</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{task.estimatedTime}</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="w-4 h-4 mr-1" />
                        <span>{task.adNetwork}</span>
                      </div>
                    </div>

                    {task.requirements && task.requirements.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Requirements:</p>
                        <ul className="text-xs text-gray-600">
                          {task.requirements.map((req, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1 text-success-600" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    {task.status === 'pending' ? (
                      <button
                        onClick={() => handleTaskStart(task.id)}
                        className="btn btn-primary btn-sm"
                      >
                        <PlayCircle className="w-4 h-4 mr-1" />
                        Start
                      </button>
                    ) : task.status === 'in_progress' ? (
                      <button
                        onClick={() => handleTaskComplete(task.id)}
                        className="btn btn-success btn-sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete
                      </button>
                    ) : task.status === 'completed' ? (
                      <button className="btn btn-success btn-sm" disabled>
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
            ))
          )}
        </div>

        {/* VIP Upgrade Prompt */}
        {!user.isVipActive && (
          <div className="bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg p-6 mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unlock More Tasks with VIP
                </h3>
                <p className="text-gray-600">
                  Get access to exclusive tasks, higher rewards, and more daily limits.
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


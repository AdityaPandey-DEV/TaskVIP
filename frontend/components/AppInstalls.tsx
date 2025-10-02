'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import Cookies from 'js-cookie'
import { 
  Download, 
  Star, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Smartphone,
  Gamepad2,
  Users,
  Briefcase,
  Film,
  ShoppingBag,
  DollarSign,
  Heart,
  BookOpen,
  Plane,
  Package,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Coins
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface App {
  _id: string
  appId: string
  appName: string
  appPackage: string
  appIcon: string
  appDescription: string
  appCategory: string
  appRating: number
  appSize: string
  platform: string
  downloadUrl: {
    android?: string
    ios?: string
  }
  rewardCoins: number
  totalReward: number
  requiredActions: string[]
  timeRequirements: {
    installTime: number
    openTime: number
    usageDays: number
  }
  userStatus: string
  isPromoted?: boolean
}

interface InstallTask {
  _id: string
  appName: string
  appIcon: string
  appCategory: string
  rewardCoins: number
  status: string
  createdAt: string
  completionTime?: string
  expiresAt: string
  timeRemaining: number
  isExpired: boolean
}

interface Category {
  id: string
  name: string
  icon: string
  count: number
}

export default function AppInstalls() {
  const { user } = useAuth()
  const [apps, setApps] = useState<App[]>([])
  const [tasks, setTasks] = useState<InstallTask[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [activeTab, setActiveTab] = useState('browse')
  const [loading, setLoading] = useState(true)
  const [processingApp, setProcessingApp] = useState<string | null>(null)
  const [activeTask, setActiveTask] = useState<any>(null)

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = Cookies.get('token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  useEffect(() => {
    fetchApps()
    fetchTasks()
    fetchCategories()
  }, [selectedCategory])

  const fetchApps = async () => {
    try {
      const response = await apiRequest(`api/app-installs/available?category=${selectedCategory}&platform=android&limit=50`, {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success) {
        setApps(data.data)
      }
    } catch (error) {
      console.error('Error fetching apps:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await apiRequest('api/app-installs/tasks?limit=10', {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success) {
        setTasks(data.data.tasks)
        
        // Find active task
        const active = data.data.tasks.find((task: InstallTask) => 
          ['pending', 'installed', 'opened'].includes(task.status)
        )
        setActiveTask(active)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await apiRequest('api/app-installs/categories', {
        headers: getAuthHeaders()
      })
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const startInstall = async (app: App) => {
    setProcessingApp(app.appId)
    try {
      const response = await apiRequest('api/app-installs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: app.appId,
          platform: 'android'
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('App install task started!')
        
        // Open download URL
        const downloadUrl = data.data.downloadUrl
        if (downloadUrl) {
          window.open(downloadUrl, '_blank')
        }
        
        fetchApps()
        fetchTasks()
        setActiveTab('tasks')
      } else {
        toast.error(data.message || 'Failed to start app install')
      }
    } catch (error) {
      console.error('Start install error:', error)
      toast.error('Failed to start app install')
    } finally {
      setProcessingApp(null)
    }
  }

  const markInstalled = async (taskId: string) => {
    try {
      const response = await apiRequest(`api/app-installs/installed/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationData: {
            deviceId: navigator.userAgent,
            installationId: Date.now().toString()
          }
        })
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('App installation confirmed!')
        fetchTasks()
      } else {
        toast.error(data.message || 'Failed to confirm installation')
      }
    } catch (error) {
      console.error('Mark installed error:', error)
      toast.error('Failed to confirm installation')
    }
  }

  const markOpened = async (taskId: string) => {
    try {
      const response = await apiRequest(`api/app-installs/opened/${taskId}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('App opening confirmed!')
        fetchTasks()
      } else {
        toast.error(data.message || 'Failed to confirm app opening')
      }
    } catch (error) {
      console.error('Mark opened error:', error)
      toast.error('Failed to confirm app opening')
    }
  }

  const completeTask = async (taskId: string) => {
    try {
      const response = await apiRequest(`api/app-installs/complete/${taskId}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success(`Congratulations! You earned ${data.data.coinsEarned} coins!`)
        fetchTasks()
        fetchApps()
        setActiveTask(null)
      } else {
        toast.error(data.message || 'Failed to complete task')
      }
    } catch (error) {
      console.error('Complete task error:', error)
      toast.error('Failed to complete task')
    }
  }

  const cancelTask = async (taskId: string) => {
    try {
      const response = await apiRequest(`api/app-installs/cancel/${taskId}`, {
        method: 'POST'
      })
      
      const data = await response.json()
      if (data.success) {
        toast.success('Task cancelled successfully')
        fetchTasks()
        fetchApps()
        setActiveTask(null)
      } else {
        toast.error(data.message || 'Failed to cancel task')
      }
    } catch (error) {
      console.error('Cancel task error:', error)
      toast.error('Failed to cancel task')
    }
  }

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'games': return <Gamepad2 className="w-4 h-4" />
      case 'social': return <Users className="w-4 h-4" />
      case 'productivity': return <Briefcase className="w-4 h-4" />
      case 'entertainment': return <Film className="w-4 h-4" />
      case 'shopping': return <ShoppingBag className="w-4 h-4" />
      case 'finance': return <DollarSign className="w-4 h-4" />
      case 'health': return <Heart className="w-4 h-4" />
      case 'education': return <BookOpen className="w-4 h-4" />
      case 'travel': return <Plane className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'pending': return 'text-blue-600 bg-blue-50'
      case 'installed': return 'text-yellow-600 bg-yellow-50'
      case 'opened': return 'text-purple-600 bg-purple-50'
      case 'failed': case 'expired': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'installed': return <Download className="w-4 h-4" />
      case 'opened': return <Play className="w-4 h-4" />
      case 'failed': case 'expired': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return 'Expired'
    
    const hours = Math.floor(ms / (1000 * 60 * 60))
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">App Install Rewards</h2>
        <p className="text-purple-100 mb-4">
          Install apps, complete simple tasks, and earn coins instantly!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{tasks.filter(t => t.status === 'completed').length}</div>
            <div className="text-sm text-purple-100">Apps Completed</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{tasks.reduce((sum, t) => t.status === 'completed' ? sum + t.rewardCoins : sum, 0)}</div>
            <div className="text-sm text-purple-100">Coins Earned</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="text-2xl font-bold">{tasks.filter(t => ['pending', 'installed', 'opened'].includes(t.status)).length}</div>
            <div className="text-sm text-purple-100">Active Tasks</div>
          </div>
        </div>
      </div>

      {/* Active Task Alert */}
      {activeTask && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={activeTask.appIcon} alt={activeTask.appName} className="w-10 h-10 rounded-lg" />
              <div>
                <h3 className="font-semibold text-gray-900">{activeTask.appName}</h3>
                <p className="text-sm text-gray-600">
                  Status: <span className="capitalize">{activeTask.status}</span> • 
                  Expires in {formatTimeRemaining(activeTask.timeRemaining)}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              {activeTask.status === 'pending' && (
                <button
                  onClick={() => markInstalled(activeTask._id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark Installed
                </button>
              )}
              {activeTask.status === 'installed' && (
                <button
                  onClick={() => markOpened(activeTask._id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Mark Opened
                </button>
              )}
              {activeTask.status === 'opened' && (
                <button
                  onClick={() => completeTask(activeTask._id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Complete & Earn {activeTask.rewardCoins} Coins
                </button>
              )}
              <button
                onClick={() => cancelTask(activeTask._id)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('browse')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Browse Apps
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              My Tasks
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'browse' && (
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {getCategoryIcon(category.id)}
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Apps Grid */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Available Apps</h3>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded mb-4"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : apps.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {apps.map(app => (
                      <div key={app.appId} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start space-x-3 mb-3">
                          <img src={app.appIcon} alt={app.appName} className="w-16 h-16 rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate">{app.appName}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span>{app.appRating}</span>
                              </div>
                              <span>•</span>
                              <span>{app.appSize}</span>
                            </div>
                            {app.isPromoted && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                Promoted
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {app.appDescription}
                        </p>
                        
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold text-green-600">
                              {app.totalReward} coins
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            app.userStatus === 'available' 
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-50 text-gray-700'
                          }`}>
                            {app.userStatus}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-3">
                          Required: {app.requiredActions.join(', ')}
                        </div>
                        
                        <button
                          onClick={() => startInstall(app)}
                          disabled={
                            processingApp === app.appId || 
                            app.userStatus !== 'available'
                          }
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                        >
                          {processingApp === app.appId ? (
                            <>
                              <RotateCcw className="w-4 h-4 animate-spin" />
                              <span>Starting...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              <span>Install & Earn</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No apps available in this category</p>
                    <p className="text-sm">Try selecting a different category</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">My Install Tasks</h3>
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map(task => (
                    <div key={task._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img src={task.appIcon} alt={task.appName} className="w-10 h-10 rounded-lg" />
                          <div>
                            <h4 className="font-medium">{task.appName}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(task.status)}`}>
                                {getStatusIcon(task.status)}
                                <span className="capitalize">{task.status}</span>
                              </span>
                              <span>•</span>
                              <span>{task.rewardCoins} coins</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {task.status === 'completed' 
                              ? `Completed ${new Date(task.completionTime!).toLocaleDateString()}`
                              : `Expires in ${formatTimeRemaining(task.timeRemaining)}`
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No install tasks yet</p>
                  <p className="text-sm">Start installing apps to see your tasks here</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

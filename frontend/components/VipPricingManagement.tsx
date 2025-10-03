'use client'

import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'
import Cookies from 'js-cookie'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Crown,
  DollarSign,
  Users,
  Star,
  Eye,
  EyeOff
} from 'lucide-react'

interface VipPricing {
  _id: string
  level: number
  name: string
  price: number
  currency: string
  duration: number
  dailyCreditLimitMultiplier: number
  referralBonusMultiplier: number
  exclusiveOffers: boolean
  description: string
  features: string[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export default function VipPricingManagement() {
  const [pricing, setPricing] = useState<VipPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState<Partial<VipPricing>>({})

  const getAuthHeaders = () => {
    const token = Cookies.get('token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  useEffect(() => {
    fetchPricing()
  }, [])

  const fetchPricing = async () => {
    try {
      setLoading(true)
      const response = await apiRequest('api/vip-pricing', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setPricing(data.pricing || [])
      }
    } catch (error) {
      console.error('Error fetching VIP pricing:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (item: VipPricing) => {
    setEditingId(item._id)
    setFormData(item)
  }

  const handleSave = async () => {
    try {
      const response = await apiRequest(
        editingId ? `api/vip-pricing/${formData.level}` : 'api/vip-pricing',
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(formData)
        }
      )

      if (response.ok) {
        await fetchPricing()
        setEditingId(null)
        setShowCreateForm(false)
        setFormData({})
      }
    } catch (error) {
      console.error('Error saving VIP pricing:', error)
    }
  }

  const handleDelete = async (level: number) => {
    if (!confirm('Are you sure you want to delete this pricing plan?')) return

    try {
      const response = await apiRequest(`api/vip-pricing/${level}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        await fetchPricing()
      }
    } catch (error) {
      console.error('Error deleting VIP pricing:', error)
    }
  }

  const handleToggleActive = async (level: number, isActive: boolean) => {
    try {
      const response = await apiRequest(`api/vip-pricing/${level}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (response.ok) {
        await fetchPricing()
      }
    } catch (error) {
      console.error('Error toggling VIP pricing:', error)
    }
  }

  const initializeDefaults = async () => {
    try {
      const response = await apiRequest('api/vip-pricing/initialize', {
        method: 'POST',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        await fetchPricing()
      }
    } catch (error) {
      console.error('Error initializing defaults:', error)
    }
  }

  const getVipColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-gray-100 text-gray-800'
      case 1: return 'bg-orange-100 text-orange-800'
      case 2: return 'bg-gray-100 text-gray-800'
      case 3: return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading VIP pricing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">VIP Pricing Management</h3>
          <p className="text-gray-600">Manage VIP subscription plans and pricing</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={initializeDefaults}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Star className="w-4 h-4 mr-2" />
            Initialize Defaults
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Plan
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingId) && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit VIP Plan' : 'Create New VIP Plan'}
            </h4>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setEditingId(null)
                setFormData({})
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
              <input
                type="number"
                min="0"
                max="3"
                value={formData.level || ''}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                min="0"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
              <input
                type="number"
                min="1"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Daily Limit Multiplier</label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={formData.dailyCreditLimitMultiplier || ''}
                onChange={(e) => setFormData({ ...formData, dailyCreditLimitMultiplier: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral Bonus Multiplier</label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={formData.referralBonusMultiplier || ''}
                onChange={(e) => setFormData({ ...formData, referralBonusMultiplier: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.exclusiveOffers || false}
                  onChange={(e) => setFormData({ ...formData, exclusiveOffers: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Exclusive Offers</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowCreateForm(false)
                setEditingId(null)
                setFormData({})
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        </div>
      )}

      {/* Pricing Plans Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Multipliers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricing.map((plan) => (
                <tr key={plan._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Crown className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                        <div className="text-sm text-gray-500">Level {plan.level}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                    </div>
                    <div className="text-sm text-gray-500">{plan.duration} days</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      Daily: {plan.dailyCreditLimitMultiplier}x
                    </div>
                    <div className="text-sm text-gray-500">
                      Referral: {plan.referralBonusMultiplier}x
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {plan.description}
                    </div>
                    {plan.exclusiveOffers && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                        Exclusive Offers
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(plan.level, plan.isActive)}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        plan.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {plan.isActive ? (
                        <Eye className="w-3 h-3 mr-1" />
                      ) : (
                        <EyeOff className="w-3 h-3 mr-1" />
                      )}
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {plan.level !== 0 && (
                        <button
                          onClick={() => handleDelete(plan.level)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

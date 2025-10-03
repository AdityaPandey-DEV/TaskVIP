'use client'

import { useState, useEffect } from 'react'
import { apiRequest } from '@/lib/api'
import Cookies from 'js-cookie'
import { 
  User, 
  Crown, 
  ChevronRight, 
  ChevronDown, 
  Users,
  DollarSign,
  Calendar
} from 'lucide-react'

interface ReferralNode {
  id: string
  name: string
  email: string
  vipLevel: number
  vipName: string
  totalEarnings: number
  totalReferrals: number
  joinDate: string
  isActive: boolean
  children: ReferralNode[]
  level: number
}

interface ReferralTreeProps {
  userId?: string
  maxDepth?: number
}

export default function ReferralTree({ userId, maxDepth = 3 }: ReferralTreeProps) {
  const [tree, setTree] = useState<ReferralNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNode, setSelectedNode] = useState<ReferralNode | null>(null)

  const getAuthHeaders = () => {
    const token = Cookies.get('token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  useEffect(() => {
    fetchReferralTree()
  }, [userId])

  const fetchReferralTree = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`api/admin-dashboard/referral-tree${userId ? `?userId=${userId}` : ''}`, {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const data = await response.json()
        setTree(data.tree)
        // Auto-expand first level
        if (data.tree) {
          setExpandedNodes(new Set([data.tree.id]))
        }
      }
    } catch (error) {
      console.error('Error fetching referral tree:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const getVipColor = (vipLevel: number) => {
    switch (vipLevel) {
      case 0: return 'bg-gray-100 text-gray-800'
      case 1: return 'bg-orange-100 text-orange-800'
      case 2: return 'bg-gray-100 text-gray-800'
      case 3: return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getVipIcon = (vipLevel: number) => {
    if (vipLevel > 0) {
      return <Crown className="w-3 h-3" />
    }
    return <User className="w-3 h-3" />
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const renderNode = (node: ReferralNode, depth: number = 0) => {
    if (depth > maxDepth) return null

    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const isSelected = selectedNode?.id === node.id

    return (
      <div key={node.id} className="relative">
        <div 
          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
            isSelected 
              ? 'bg-blue-50 border-blue-200 shadow-md' 
              : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => {
            setSelectedNode(node)
            if (hasChildren) {
              toggleNode(node.id)
            }
          }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren && (
            <button
              className="mr-2 p-1 hover:bg-gray-100 rounded"
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(node.id)
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}

          {/* User Avatar */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
            {node.name.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{node.name}</h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVipColor(node.vipLevel)}`}>
                {getVipIcon(node.vipLevel)}
                <span className="ml-1">{node.vipName}</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">{node.email}</p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-gray-500">
                <Users className="w-3 h-3 inline mr-1" />
                {node.totalReferrals} referrals
              </span>
              <span className="text-xs text-gray-500">
                <DollarSign className="w-3 h-3 inline mr-1" />
                {formatCurrency(node.totalEarnings)}
              </span>
              <span className="text-xs text-gray-500">
                <Calendar className="w-3 h-3 inline mr-1" />
                {formatDate(node.joinDate)}
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full ${node.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-2 space-y-2">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading referral tree...</p>
        </div>
      </div>
    )
  }

  if (!tree) {
    return (
      <div className="text-center p-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Referral Data</h3>
        <p className="text-gray-600">No referral tree data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tree Visualization */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Referral Tree</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Max Depth: {maxDepth}</span>
            <button
              onClick={() => setExpandedNodes(new Set([tree.id]))}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedNodes(new Set())}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {renderNode(tree)}
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{selectedNode.name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{selectedNode.email}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">VIP Level</label>
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVipColor(selectedNode.vipLevel)}`}>
                  {getVipIcon(selectedNode.vipLevel)}
                  <span className="ml-1">{selectedNode.vipName}</span>
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Total Referrals</label>
              <p className="text-gray-900">{selectedNode.totalReferrals}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Total Earnings</label>
              <p className="text-gray-900">{formatCurrency(selectedNode.totalEarnings)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Join Date</label>
              <p className="text-gray-900">{formatDate(selectedNode.joinDate)}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">Status</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                selectedNode.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {selectedNode.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

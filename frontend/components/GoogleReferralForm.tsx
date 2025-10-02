'use client'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'
import { Gift, X } from 'lucide-react'

export function GoogleReferralForm({ googleUserData, onCancel }: {
  googleUserData: any,
  onCancel: () => void
}) {
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(false)
  const { googleCompleteRegistration } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await googleCompleteRegistration(googleUserData, referralCode || '0000')
      // Registration complete, AuthContext handles redirect
    } catch (error) {
      // Error handled by AuthContext toast
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    setLoading(true)
    try {
      await googleCompleteRegistration(googleUserData, '0000')
    } catch (error) {
      // Error handled by AuthContext toast
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <Gift className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {googleUserData.firstName}!</h2>
          <p className="text-gray-600">
            You're almost done! Enter a referral code to get a bonus, or skip to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-1">
              Referral Code (Optional)
            </label>
            <input
              type="text"
              id="referralCode"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter referral code (e.g., 0000)"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              If you don't have one, we'll use a default code for you.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            disabled={loading}
          >
            {loading ? 'Completing Registration...' : 'Complete Registration'}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            Skip & Use Default (0000)
          </button>
        </form>
      </div>
    </div>
  )
}

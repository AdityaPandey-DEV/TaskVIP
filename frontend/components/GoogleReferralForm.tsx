'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface GoogleReferralFormProps {
  googleUserData: any
  onCancel: () => void
}

export function GoogleReferralForm({ googleUserData, onCancel }: GoogleReferralFormProps) {
  const [referralCode, setReferralCode] = useState('0000')
  const [loading, setLoading] = useState(false)
  const { googleCompleteRegistration } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await googleCompleteRegistration(googleUserData, referralCode)
    } catch (error) {
      console.error('Google registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    setLoading(true)
    
    try {
      await googleCompleteRegistration(googleUserData, '0000')
    } catch (error) {
      console.error('Google registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome, {googleUserData.firstName}! 🎉
          </h2>
          <p className="text-gray-600">
            Complete your registration with a referral code to earn bonus credits!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="referralCode" className="block text-sm font-medium text-gray-700 mb-2">
              Referral Code (Optional)
            </label>
            <input
              id="referralCode"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter referral code"
              maxLength={8}
            />
            <p className="mt-2 text-sm text-gray-500">
              💡 Use <strong>0000</strong> as default if you don't have a referral code
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Completing...
                </div>
              ) : (
                'Complete Registration'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 text-sm underline disabled:opacity-50"
            >
              Skip (Use default code 0000)
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <button
              onClick={onCancel}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 text-sm disabled:opacity-50"
            >
              Cancel and try different sign-in method
            </button>
          </div>
        </div>

        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                What's a referral code?
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Referral codes help you earn bonus credits when you join TaskVIP. 
                  If you don't have one, use <strong>0000</strong> to get started!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

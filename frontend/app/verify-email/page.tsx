'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading')
  const [message, setMessage] = useState('')
  const [token, setToken] = useState('')
  const [type, setType] = useState('')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    const typeParam = searchParams.get('type')
    
    if (tokenParam && typeParam) {
      setToken(tokenParam)
      setType(typeParam)
      verifyEmail(tokenParam, typeParam)
    } else {
      setStatus('error')
      setMessage('Invalid verification link')
    }
  }, [searchParams])

  const verifyEmail = async (token: string, type: string) => {
    try {
      const response = await fetch('/api/email-verification/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, type })
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(data.message || 'Email verified successfully!')
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setStatus('error')
        setMessage(data.message || 'Email verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('Email verification failed. Please try again.')
    }
  }

  const resendVerification = async () => {
    try {
      const response = await fetch('/api/email-verification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Verification email sent successfully!')
      } else {
        alert(data.message || 'Failed to send verification email')
      }
    } catch (error) {
      console.error('Resend error:', error)
      alert('Failed to send verification email')
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-success-600 mx-auto mb-4" />
      case 'error':
      case 'expired':
        return <XCircle className="w-16 h-16 text-error-600 mx-auto mb-4" />
      default:
        return <Clock className="w-16 h-16 text-primary-600 mx-auto mb-4 animate-spin" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-success-600'
      case 'error':
      case 'expired':
        return 'text-error-600'
      default:
        return 'text-primary-600'
    }
  }

  const getStatusTitle = () => {
    switch (status) {
      case 'success':
        return 'Email Verified Successfully!'
      case 'error':
        return 'Verification Failed'
      case 'expired':
        return 'Verification Expired'
      default:
        return 'Verifying Email...'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {getStatusIcon()}
            
            <h2 className={`text-2xl font-bold ${getStatusColor()} mb-4`}>
              {getStatusTitle()}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            {status === 'loading' && (
              <div className="space-y-4">
                <div className="text-sm text-gray-500">
                  Please wait while we verify your email...
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full animate-pulse"></div>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <div className="text-sm text-success-600">
                  You will be redirected to your dashboard in a few seconds...
                </div>
                <Link href="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            )}

            {(status === 'error' || status === 'expired') && (
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  {status === 'expired' 
                    ? 'This verification link has expired. Please request a new one.'
                    : 'There was an error verifying your email. Please try again.'
                  }
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={resendVerification}
                    className="btn btn-primary"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </button>
                  <Link href="/dashboard" className="btn btn-secondary">
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Having trouble?{' '}
                <a href="/support" className="text-primary-600 hover:text-primary-500">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


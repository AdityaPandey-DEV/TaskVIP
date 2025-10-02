'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  referralCode: string
  vipLevel: number
  vipExpiry: string | null
  isVipActive: boolean
  totalCredits: number
  availableCredits: number
  kycStatus: string
  streak: number
  badges: string[]
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  googleLogin: (credential: string) => Promise<any>
  googleCompleteRegistration: (googleUserData: any, referralCode?: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  referralCode?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = Cookies.get('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        Cookies.remove('token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      Cookies.remove('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        Cookies.set('token', data.token, { expires: 7 })
        setUser(data.user)
        toast.success('Login successful!')
        router.push('/dashboard')
      } else {
        throw new Error(data.message || 'Login failed')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
      throw error
    }
  }

  const googleLogin = async (credential: string) => {
    try {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.needsReferralCode) {
          // New user needs to provide referral code
          return data // Return the data so the component can handle the referral form
        } else {
          // Existing user, complete login
          Cookies.set('token', data.token, { expires: 7 })
          setUser(data.user)
          toast.success('Google Sign-In successful!')
          router.push('/dashboard')
        }
      } else {
        throw new Error(data.message || 'Google Sign-In failed')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google Sign-In failed')
      throw error
    }
  }

  const googleCompleteRegistration = async (googleUserData: any, referralCode?: string) => {
    try {
      const response = await fetch('/api/auth/google/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          googleUserData,
          referralCode: referralCode || '0000'
        })
      })

      const data = await response.json()

      if (response.ok) {
        Cookies.set('token', data.token, { expires: 7 })
        setUser(data.user)
        toast.success('Google registration completed successfully!')
        router.push('/dashboard')
      } else {
        throw new Error(data.message || 'Google registration failed')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google registration failed')
      throw error
    }
  }

  const register = async (userData: RegisterData) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      const data = await response.json()

      if (response.ok) {
        Cookies.set('token', data.token, { expires: 7 })
        setUser(data.user)
        toast.success('Registration successful!')
        router.push('/dashboard')
      } else {
        throw new Error(data.message || 'Registration failed')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed')
      throw error
    }
  }

  const logout = () => {
    Cookies.remove('token')
    setUser(null)
    toast.success('Logged out successfully')
    router.push('/')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData })
    }
  }

  const value = {
    user,
    loading,
    login,
    googleLogin,
    googleCompleteRegistration,
    register,
    logout,
    updateUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

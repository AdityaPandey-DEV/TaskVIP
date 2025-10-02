'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { 
  PlayCircle, 
  Users, 
  Star, 
  Gift, 
  Shield, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Crown,
  Zap
} from 'lucide-react'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCredits: 0,
    completedTasks: 0
  })

  useEffect(() => {
    // Fetch public stats
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error)
  }, [])

  const features = [
    {
      icon: <PlayCircle className="w-8 h-8 text-primary-600" />,
      title: 'Watch Ads & Earn',
      description: 'Watch short video ads and earn credits instantly. Higher VIP levels unlock better rewards.'
    },
    {
      icon: <Users className="w-8 h-8 text-primary-600" />,
      title: 'Refer Friends',
      description: 'Invite friends and earn bonus credits when they complete tasks or purchase VIP.'
    },
    {
      icon: <Star className="w-8 h-8 text-primary-600" />,
      title: 'VIP Benefits',
      description: 'Upgrade to VIP for higher daily limits, better referral bonuses, and exclusive tasks.'
    },
    {
      icon: <Gift className="w-8 h-8 text-primary-600" />,
      title: 'Daily Tasks',
      description: 'Complete daily tasks including surveys, app installs, and offers to earn more credits.'
    },
    {
      icon: <Shield className="w-8 h-8 text-primary-600" />,
      title: 'Secure & Legal',
      description: '100% legal platform with secure payments and transparent earning system.'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-primary-600" />,
      title: 'Grow Your Earnings',
      description: 'Build streaks, unlock milestones, and maximize your earning potential.'
    }
  ]

  const vipPlans = [
    {
      level: 1,
      name: 'VIP 1',
      price: '₹300',
      duration: '30 days',
      features: [
        '20 ads per day',
        '₹1.5 per ad reward',
        '₹30 daily earning cap',
        '₹10 referral bonus',
        'Priority support',
        'Exclusive tasks'
      ],
      popular: false
    },
    {
      level: 2,
      name: 'VIP 2',
      price: '₹600',
      duration: '30 days',
      features: [
        '50 ads per day',
        '₹2.0 per ad reward',
        '₹100 daily earning cap',
        '₹10 referral bonus',
        'Priority support',
        'Exclusive tasks',
        'Higher reward rates'
      ],
      popular: true
    },
    {
      level: 3,
      name: 'VIP 3',
      price: '₹1,000',
      duration: '30 days',
      features: [
        '100 ads per day',
        '₹2.5 per ad reward',
        '₹250 daily earning cap',
        '₹10 referral bonus',
        'Priority support',
        'Exclusive tasks',
        'Highest reward rates',
        'Milestone bonuses',
        'VIP-only offers'
      ],
      popular: false
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (user) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-primary-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">TaskVIP</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/login')}
                className="btn btn-secondary"
              >
                Login
              </button>
              <button
                onClick={() => router.push('/register')}
                className="btn btn-primary"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Earn Credits by
              <span className="block text-yellow-300">Completing Tasks</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of users earning credits daily through watching ads, 
              completing offers, and referring friends. Upgrade to VIP for maximum rewards!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/register')}
                className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100 font-semibold"
              >
                Start Earning Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <button
                onClick={() => router.push('/#features')}
                className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-primary-600"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {stats.totalUsers.toLocaleString()}+
              </div>
              <div className="text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-success-600 mb-2">
                {stats.totalCredits.toLocaleString()}+
              </div>
              <div className="text-gray-600">Credits Earned</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-warning-600 mb-2">
                {stats.completedTasks.toLocaleString()}+
              </div>
              <div className="text-gray-600">Tasks Completed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose TaskVIP?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We provide multiple ways to earn credits with transparent, 
              secure, and rewarding opportunities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIP Plans Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Upgrade to VIP for Maximum Earnings
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose your VIP level and unlock higher daily limits, 
              better referral bonuses, and exclusive earning opportunities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {vipPlans.map((plan) => (
              <div
                key={plan.level}
                className={`card relative ${plan.popular ? 'ring-2 ring-primary-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <div className="vip-badge mb-4">{plan.name}</div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {plan.price}
                  </div>
                  <div className="text-gray-600 mb-6">{plan.duration}</div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-success-600 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => router.push('/register')}
                    className={`btn w-full ${
                      plan.popular ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    Get Started
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join TaskVIP today and start earning credits through 
            simple tasks, ads, and referrals. No experience required!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push('/register')}
              className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100 font-semibold"
            >
              <Zap className="w-5 h-5 mr-2" />
              Start Earning Now
            </button>
            <button
              onClick={() => router.push('/login')}
              className="btn btn-lg border-2 border-white text-white hover:bg-white hover:text-primary-600"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Crown className="w-6 h-6 text-primary-400 mr-2" />
                <span className="text-xl font-bold">TaskVIP</span>
              </div>
              <p className="text-gray-400">
                The ultimate platform for earning credits through tasks, 
                ads, and referrals.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">How it Works</a></li>
                <li><a href="#" className="hover:text-white">VIP Plans</a></li>
                <li><a href="#" className="hover:text-white">Referral Program</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact Us</a></li>
                <li><a href="#" className="hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Facebook</a></li>
                <li><a href="#" className="hover:text-white">Instagram</a></li>
                <li><a href="#" className="hover:text-white">Discord</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 TaskVIP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

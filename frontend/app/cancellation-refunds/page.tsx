import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cancellation & Refunds Policy - TaskVIP',
  description: 'TaskVIP cancellation and refunds policy for VIP subscriptions and coin purchases',
}

export default function CancellationRefundsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Cancellation & Refunds Policy</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. VIP Subscription Cancellation</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • You can cancel your VIP subscription at any time through your account dashboard
                </p>
                <p>
                  • Cancellation will take effect at the end of your current billing period
                </p>
                <p>
                  • You will retain VIP benefits until the subscription expires
                </p>
                <p>
                  • No partial refunds for unused subscription time
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Coin Purchase Refunds</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • Coin purchases are generally non-refundable once processed
                </p>
                <p>
                  • Refunds may be considered in cases of technical errors or unauthorized transactions
                </p>
                <p>
                  • All refund requests must be submitted within 7 days of purchase
                </p>
                <p>
                  • Refunds will be processed to the original payment method within 5-10 business days
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Withdrawal Cancellation</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • Withdrawal requests can be cancelled before processing begins
                </p>
                <p>
                  • Once processing starts, cancellation may not be possible
                </p>
                <p>
                  • Cancelled withdrawals will return coins to your account balance
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibent text-gray-800 mb-4">4. Refund Process</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>To request a refund:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Contact our support team at support@taskvip.com</li>
                  <li>Provide transaction ID and reason for refund</li>
                  <li>Allow 2-3 business days for review</li>
                  <li>Approved refunds processed within 5-10 business days</li>
                </ol>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Non-Refundable Items</h2>
              <div className="space-y-4 text-gray-700">
                <p>The following are non-refundable:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Coins earned through tasks or referrals</li>
                  <li>Promotional or bonus coins</li>
                  <li>Services already consumed or used</li>
                  <li>Account violations or policy breaches</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Dispute Resolution</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • For payment disputes, contact us first before involving payment providers
                </p>
                <p>
                  • We aim to resolve all disputes within 7 business days
                </p>
                <p>
                  • Unresolved disputes may be escalated to relevant authorities
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  For cancellations and refund requests, contact us at:
                </p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> support@taskvip.com</li>
                  <li><strong>Response Time:</strong> 24-48 hours</li>
                  <li><strong>Business Hours:</strong> Monday to Friday, 9 AM to 6 PM IST</li>
                </ul>
              </div>
            </section>

            <div className="bg-blue-50 p-6 rounded-lg mt-8">
              <p className="text-blue-800">
                <strong>Note:</strong> This policy is subject to change. Users will be notified of any significant changes via email or app notification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

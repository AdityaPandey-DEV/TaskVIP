import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms and Conditions - TaskVIP',
  description: 'TaskVIP terms and conditions for using our task completion and reward platform',
}

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms and Conditions</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  By accessing and using TaskVIP ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
                </p>
                <p>
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Service Description</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  TaskVIP is a platform that allows users to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Complete tasks to earn coins</li>
                  <li>Watch advertisements for rewards</li>
                  <li>Refer friends for bonuses</li>
                  <li>Purchase VIP subscriptions for enhanced benefits</li>
                  <li>Withdraw earnings through supported payment methods</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. User Accounts</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • Users must provide accurate and complete information when creating an account
                </p>
                <p>
                  • Users are responsible for maintaining the confidentiality of their account credentials
                </p>
                <p>
                  • One account per person is allowed
                </p>
                <p>
                  • Users must be at least 18 years old or have parental consent
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Earning and Rewards</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • Coins are earned by completing legitimate tasks and activities
                </p>
                <p>
                  • TaskVIP reserves the right to verify task completion
                </p>
                <p>
                  • Fraudulent activity will result in account suspension and forfeiture of earnings
                </p>
                <p>
                  • Minimum withdrawal amounts and processing times apply
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. VIP Subscriptions</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • VIP subscriptions provide enhanced earning rates and exclusive features
                </p>
                <p>
                  • Subscriptions are billed automatically until cancelled
                </p>
                <p>
                  • VIP benefits are active only during the subscription period
                </p>
                <p>
                  • Subscription fees are non-refundable except as outlined in our refund policy
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Prohibited Activities</h2>
              <div className="space-y-4 text-gray-700">
                <p>Users are prohibited from:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Creating multiple accounts</li>
                  <li>Using bots or automated tools</li>
                  <li>Manipulating or gaming the system</li>
                  <li>Sharing account credentials</li>
                  <li>Engaging in fraudulent activities</li>
                  <li>Violating any applicable laws or regulations</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Payments and Withdrawals</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • Payments are processed through secure third-party providers including Razorpay
                </p>
                <p>
                  • Withdrawal requests are subject to verification and processing times
                </p>
                <p>
                  • TaskVIP may charge processing fees for certain payment methods
                </p>
                <p>
                  • Users are responsible for any taxes on their earnings
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Intellectual Property</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • All content and materials on TaskVIP are owned by TaskVIP or its licensors
                </p>
                <p>
                  • Users may not copy, modify, or distribute our content without permission
                </p>
                <p>
                  • TaskVIP respects intellectual property rights and expects users to do the same
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Limitation of Liability</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • TaskVIP provides the service "as is" without warranties
                </p>
                <p>
                  • We are not liable for any indirect, incidental, or consequential damages
                </p>
                <p>
                  • Our total liability is limited to the amount paid by the user in the past 12 months
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. Termination</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • TaskVIP may terminate accounts for violation of these terms
                </p>
                <p>
                  • Users may delete their accounts at any time
                </p>
                <p>
                  • Upon termination, users forfeit any remaining coin balance
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Changes to Terms</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  • TaskVIP reserves the right to modify these terms at any time
                </p>
                <p>
                  • Users will be notified of significant changes
                </p>
                <p>
                  • Continued use constitutes acceptance of modified terms
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  For questions about these terms, contact us at:
                </p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> legal@taskvip.com</li>
                  <li><strong>Website:</strong> https://task-vip.vercel.app</li>
                  <li><strong>Address:</strong> TaskVIP Legal Department</li>
                </ul>
              </div>
            </section>

            <div className="bg-yellow-50 p-6 rounded-lg mt-8">
              <p className="text-yellow-800">
                <strong>Important:</strong> By using TaskVIP, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

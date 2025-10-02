import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - TaskVIP',
  description: 'TaskVIP privacy policy explaining how we collect, use, and protect your personal information',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Personal Information:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Name and email address (required for account creation)</li>
                  <li>Payment information (processed securely through Razorpay)</li>
                  <li>Profile information (optional)</li>
                  <li>Communication preferences</li>
                </ul>
                
                <p>
                  <strong>Usage Information:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Task completion history</li>
                  <li>Earning and withdrawal records</li>
                  <li>Login and activity logs</li>
                  <li>Device and browser information</li>
                  <li>IP address and location data</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>We use your information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and maintain our services</li>
                  <li>Process payments and withdrawals</li>
                  <li>Verify task completion and prevent fraud</li>
                  <li>Send important account notifications</li>
                  <li>Improve our platform and user experience</li>
                  <li>Comply with legal obligations</li>
                  <li>Provide customer support</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Information Sharing</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We do not sell or rent your personal information. We may share information with:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Payment Processors:</strong> Razorpay and other secure payment providers</li>
                  <li><strong>Service Providers:</strong> Third-party services that help us operate</li>
                  <li><strong>Legal Requirements:</strong> When required by law or legal process</li>
                  <li><strong>Business Transfers:</strong> In case of merger or acquisition</li>
                  <li><strong>Fraud Prevention:</strong> To protect against fraudulent activities</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Data Security</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We implement appropriate security measures to protect your information:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>SSL encryption for data transmission</li>
                  <li>Secure servers and databases</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and authentication</li>
                  <li>Payment data handled by PCI-compliant processors</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Cookies and Tracking</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Keep you logged in to your account</li>
                  <li>Remember your preferences</li>
                  <li>Analyze site usage and performance</li>
                  <li>Provide personalized content</li>
                  <li>Prevent fraud and abuse</li>
                </ul>
                <p>
                  You can control cookies through your browser settings, but some features may not work properly if disabled.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Third-Party Services</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Our platform integrates with third-party services:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Google OAuth:</strong> For secure sign-in (optional)</li>
                  <li><strong>Razorpay:</strong> For payment processing</li>
                  <li><strong>PropellerAds:</strong> For advertising revenue</li>
                  <li><strong>Analytics Services:</strong> For platform improvement</li>
                </ul>
                <p>
                  These services have their own privacy policies that govern their use of your information.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Your Rights</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  You have the right to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and data</li>
                  <li>Export your data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Restrict certain data processing</li>
                </ul>
                <p>
                  To exercise these rights, contact us at privacy@taskvip.com
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Data Retention</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We retain your information for as long as necessary to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide our services to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Prevent fraud and abuse</li>
                </ul>
                <p>
                  Account data is typically retained for 3 years after account closure, unless longer retention is required by law.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Children's Privacy</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  TaskVIP is not intended for children under 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected such information, we will take steps to delete it promptly.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">10. International Transfers</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information during such transfers.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">11. Changes to Privacy Policy</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We may update this privacy policy from time to time. We will notify you of any material changes by:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Posting the updated policy on our website</li>
                  <li>Sending email notifications for significant changes</li>
                  <li>Displaying in-app notifications</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">12. Contact Us</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  For privacy-related questions or concerns, contact us at:
                </p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> privacy@taskvip.com</li>
                  <li><strong>Data Protection Officer:</strong> dpo@taskvip.com</li>
                  <li><strong>Address:</strong> TaskVIP Privacy Team</li>
                  <li><strong>Website:</strong> https://task-vip.vercel.app</li>
                </ul>
              </div>
            </section>

            <div className="bg-blue-50 p-6 rounded-lg mt-8">
              <p className="text-blue-800">
                <strong>Your Privacy Matters:</strong> We are committed to protecting your privacy and being transparent about how we handle your information. If you have any questions or concerns, please don't hesitate to contact us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

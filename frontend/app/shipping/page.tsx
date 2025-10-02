import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shipping Policy - TaskVIP',
  description: 'TaskVIP shipping and delivery policy for digital services and rewards',
}

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>
          
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Digital Services</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  TaskVIP is a digital platform that provides online services. We do not ship physical products.
                </p>
                <p>
                  All our services are delivered digitally through our web platform:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>VIP subscription activation is immediate upon payment</li>
                  <li>Coin purchases are credited instantly to your account</li>
                  <li>Task rewards are processed automatically</li>
                  <li>Withdrawal payments are sent electronically</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Service Delivery</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  <strong>Immediate Delivery:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>VIP subscription benefits activate within minutes of payment</li>
                  <li>Purchased coins appear in your balance immediately</li>
                  <li>Task completions are verified and rewarded instantly</li>
                </ul>
                
                <p>
                  <strong>Processing Times:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Withdrawal requests: 1-3 business days</li>
                  <li>Account verification: 24-48 hours</li>
                  <li>Support responses: 24-48 hours</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Payment Processing</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  We use secure payment processors including Razorpay for all transactions:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Credit/Debit card payments: Instant processing</li>
                  <li>UPI payments: Instant processing</li>
                  <li>Net banking: 5-10 minutes processing</li>
                  <li>Digital wallets: Instant processing</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Withdrawal Delivery</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Earnings withdrawals are processed electronically:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Bank Transfer:</strong> 1-3 business days</li>
                  <li><strong>UPI:</strong> Instant to 24 hours</li>
                  <li><strong>PayPal:</strong> 1-2 business days</li>
                  <li><strong>Digital Wallets:</strong> Instant to 24 hours</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Service Availability</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  TaskVIP services are available 24/7 online:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Platform access: Available worldwide</li>
                  <li>Task completion: 24/7 availability</li>
                  <li>Payment processing: Depends on payment provider</li>
                  <li>Customer support: Business hours (9 AM - 6 PM IST)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Geographic Restrictions</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  While TaskVIP is accessible globally, some features may be restricted:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Payment methods vary by country</li>
                  <li>Withdrawal options depend on local regulations</li>
                  <li>Some tasks may be geo-restricted</li>
                  <li>Compliance with local laws is required</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Technical Requirements</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  To access TaskVIP services, you need:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Internet connection</li>
                  <li>Modern web browser (Chrome, Firefox, Safari, Edge)</li>
                  <li>Valid email address</li>
                  <li>Supported payment method for purchases</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Service Interruptions</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  In case of service interruptions:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Scheduled maintenance will be announced in advance</li>
                  <li>Emergency maintenance may cause temporary unavailability</li>
                  <li>Users will be notified of extended outages</li>
                  <li>Service credits may be provided for significant disruptions</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Contact Information</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  For questions about service delivery or technical issues:
                </p>
                <ul className="list-none space-y-2">
                  <li><strong>Email:</strong> support@taskvip.com</li>
                  <li><strong>Response Time:</strong> 24-48 hours</li>
                  <li><strong>Business Hours:</strong> Monday to Friday, 9 AM to 6 PM IST</li>
                  <li><strong>Website:</strong> https://task-vip.vercel.app</li>
                </ul>
              </div>
            </section>

            <div className="bg-green-50 p-6 rounded-lg mt-8">
              <p className="text-green-800">
                <strong>Note:</strong> Since TaskVIP provides digital services only, there are no physical shipping costs, delivery delays, or lost package issues. All services are delivered electronically through our secure platform.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const axios = require('axios');

class PaymentService {
  constructor() {
    this.razorpayConfig = {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      baseUrl: 'https://api.razorpay.com/v1'
    };
  }

  // Create Razorpay payout
  async createRazorpayPayout(amount, accountDetails) {
    try {
      const payoutData = {
        account_number: accountDetails.accountNumber,
        fund_account: {
          account_type: 'bank_account',
          bank_account: {
            name: accountDetails.accountHolderName,
            ifsc: accountDetails.ifsc,
            account_number: accountDetails.accountNumber
          }
        },
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        mode: 'IMPS',
        purpose: 'payout',
        queue_if_low_balance: true,
        reference_id: `TASKVIP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const response = await axios.post(
        `${this.razorpayConfig.baseUrl}/payouts`,
        payoutData,
        {
          auth: {
            username: this.razorpayConfig.keyId,
            password: this.razorpayConfig.keySecret
          },
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        payoutId: response.data.id,
        status: response.data.status,
        amount: response.data.amount / 100,
        referenceId: response.data.reference_id
      };
    } catch (error) {
      console.error('Razorpay payout error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.description || error.message
      };
    }
  }

  // Create PayPal payout
  async createPayPalPayout(amount, email) {
    try {
      // First, get access token
      const tokenResponse = await axios.post(
        'https://api-m.sandbox.paypal.com/v1/oauth2/token',
        'grant_type=client_credentials',
        {
          auth: {
            username: process.env.PAYPAL_CLIENT_ID,
            password: process.env.PAYPAL_CLIENT_SECRET
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Create payout
      const payoutData = {
        sender_batch_header: {
          sender_batch_id: `TASKVIP_${Date.now()}`,
          email_subject: 'TaskVIP Payment'
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: amount.toString(),
              currency: 'USD'
            },
            receiver: email,
            note: 'Payment from TaskVIP',
            sender_item_id: `TASKVIP_${Date.now()}`
          }
        ]
      };

      const response = await axios.post(
        'https://api-m.sandbox.paypal.com/v1/payments/payouts',
        payoutData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      return {
        success: true,
        payoutId: response.data.batch_header.payout_batch_id,
        status: response.data.batch_header.batch_status,
        amount: amount
      };
    } catch (error) {
      console.error('PayPal payout error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Create Stripe payout
  async createStripePayout(amount, accountDetails) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

      const transfer = await stripe.transfers.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        destination: accountDetails.stripeAccountId,
        description: 'TaskVIP payment'
      });

      return {
        success: true,
        payoutId: transfer.id,
        status: transfer.status,
        amount: amount
      };
    } catch (error) {
      console.error('Stripe payout error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process withdrawal based on user's preferred method
  async processWithdrawal(userId, amount, paymentMethod, accountDetails) {
    try {
      let result;

      switch (paymentMethod.toLowerCase()) {
        case 'razorpay':
          result = await this.createRazorpayPayout(amount, accountDetails);
          break;
        case 'paypal':
          result = await this.createPayPalPayout(amount, accountDetails.email);
          break;
        case 'stripe':
          result = await this.createStripePayout(amount, accountDetails);
          break;
        default:
          return {
            success: false,
            error: 'Unsupported payment method'
          };
      }

      return result;
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: 'Payment processing failed'
      };
    }
  }

  // Get payment method details for user's country
  getPaymentMethods(countryCode = 'IN') {
    const methods = {
      'IN': [
        {
          id: 'razorpay',
          name: 'Bank Transfer (India)',
          description: 'Direct bank transfer via IMPS/RTGS',
          processingTime: '1-3 business days',
          minAmount: 100,
          maxAmount: 100000,
          fees: '2%',
          supported: true
        }
      ],
      'US': [
        {
          id: 'paypal',
          name: 'PayPal',
          description: 'PayPal account transfer',
          processingTime: 'Instant',
          minAmount: 10,
          maxAmount: 10000,
          fees: '3%',
          supported: true
        },
        {
          id: 'stripe',
          name: 'Stripe',
          description: 'Bank account transfer',
          processingTime: '2-7 business days',
          minAmount: 10,
          maxAmount: 10000,
          fees: '2.9%',
          supported: true
        }
      ]
    };

    return methods[countryCode] || methods['US'];
  }

  // Validate account details based on payment method
  validateAccountDetails(paymentMethod, accountDetails) {
    const validations = {
      razorpay: () => {
        const required = ['accountNumber', 'ifsc', 'accountHolderName'];
        const missing = required.filter(field => !accountDetails[field]);
        return missing.length === 0 ? { valid: true } : { valid: false, missing };
      },
      paypal: () => {
        return accountDetails.email ? { valid: true } : { valid: false, missing: ['email'] };
      },
      stripe: () => {
        return accountDetails.stripeAccountId ? { valid: true } : { valid: false, missing: ['stripeAccountId'] };
      }
    };

    const validator = validations[paymentMethod.toLowerCase()];
    return validator ? validator() : { valid: false, error: 'Invalid payment method' };
  }
}

module.exports = new PaymentService();


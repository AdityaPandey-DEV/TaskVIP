const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Send email verification link
  async sendVerificationEmail(userEmail, userName, verificationType = 'signup') {
    try {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}&type=${verificationType}`;
      
      const subject = verificationType === 'signup' 
        ? 'Welcome to TaskVIP - Verify Your Email' 
        : 'TaskVIP - Email Verification Required';

      const html = this.getVerificationEmailTemplate(userName, verificationLink, verificationType);

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject,
        html
      });

      return {
        success: true,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send payment notification
  async sendPaymentNotification(userEmail, userName, amount, transactionId) {
    try {
      const subject = 'TaskVIP - Payment Processed Successfully';
      const html = this.getPaymentNotificationTemplate(userName, amount, transactionId);

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject,
        html
      });

      return { success: true };
    } catch (error) {
      console.error('Payment notification error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send referral verification email
  async sendReferralVerificationEmail(userEmail, userName, referrerName, referralCode) {
    try {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationLink = `${process.env.FRONTEND_URL}/verify-referral?token=${verificationToken}&ref=${referralCode}`;
      
      const subject = `You've been referred to TaskVIP by ${referrerName}`;
      const html = this.getReferralVerificationTemplate(userName, referrerName, verificationLink, referralCode);

      await this.transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject,
        html
      });

      return {
        success: true,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      console.error('Referral verification email error:', error);
      return { success: false, error: error.message };
    }
  }

  // Email templates
  getVerificationEmailTemplate(userName, verificationLink, type) {
    const title = type === 'signup' ? 'Welcome to TaskVIP!' : 'Email Verification Required';
    const message = type === 'signup' 
      ? 'Thank you for joining TaskVIP! Verify your email to start earning credits.'
      : 'Please verify your email to continue using TaskVIP.';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>${message}</p>
            <p>Click the button below to verify your email address:</p>
            <a href="${verificationLink}" class="button">Verify Email Address</a>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 5px;">${verificationLink}</p>
          </div>
          <div class="footer">
            <p>© 2024 TaskVIP. All rights reserved.</p>
            <p>This email was sent to ${userEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPaymentNotificationTemplate(userName, amount, transactionId) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Processed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount { font-size: 24px; font-weight: bold; color: #28a745; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Processed Successfully!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Your withdrawal request has been processed successfully.</p>
            <p><strong>Amount:</strong> <span class="amount">₹${amount}</span></p>
            <p><strong>Transaction ID:</strong> ${transactionId}</p>
            <p>The amount should reflect in your account within 1-3 business days.</p>
            <p>Thank you for using TaskVIP!</p>
          </div>
          <div class="footer">
            <p>© 2024 TaskVIP. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getReferralVerificationTemplate(userName, referrerName, verificationLink, referralCode) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>You've been referred to TaskVIP!</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #ff6b6b; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .benefits { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>You've been referred to TaskVIP!</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p><strong>${referrerName}</strong> has invited you to join TaskVIP and start earning money by watching ads!</p>
            
            <div class="benefits">
              <h3>🎁 Special Benefits for You:</h3>
              <ul>
                <li>₹5 free credit for your first ad</li>
                <li>Earn ₹1-₹2.5 per ad (based on VIP level)</li>
                <li>Refer friends and earn 10% commission forever</li>
                <li>Withdraw to bank account or PayPal</li>
              </ul>
            </div>

            <p>Click below to verify your email and claim your ₹5 bonus:</p>
            <a href="${verificationLink}" class="button">Verify Email & Claim ₹5 Bonus</a>
            
            <p><strong>Referral Code:</strong> ${referralCode}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
          </div>
          <div class="footer">
            <p>© 2024 TaskVIP. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();


# 🔑 Complete API Keys Setup Guide for TaskVIP Backend

## 📋 **Required API Keys Overview**

Your TaskVIP backend needs these API keys for full functionality:

### **🔴 Critical (Required for basic functionality):**
- **MongoDB Atlas** - Database connection
- **JWT Secret** - Authentication security
- **Gmail SMTP** - Email verification

### **🟡 Important (Required for payments):**
- **Razorpay** - Payment processing (India)

### **🟢 Optional (For monetization):**
- **PropellerAds** - Ad network
- **Adsterra** - Ad network

---

## 🗄️ **1. MongoDB Atlas (Database)**

### **Step 1: Create Free Account**
1. Go to: https://cloud.mongodb.com
2. Click **"Try Free"**
3. Sign up with Google/GitHub or email
4. Choose **"Shared"** (Free tier)

### **Step 2: Create Cluster**
1. Select **"M0 Sandbox"** (Free)
2. Choose **"AWS"** provider
3. Select closest region (e.g., Mumbai for India)
4. Name your cluster: `TaskVIP`
5. Click **"Create Cluster"**

### **Step 3: Create Database User**
1. Go to **"Database Access"** in left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `taskvip-admin`
5. Generate secure password (save it!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### **Step 4: Configure Network Access**
1. Go to **"Network Access"** in left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### **Step 5: Get Connection String**
1. Go to **"Database"** in left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **"Node.js"** and version **"4.1 or later"**
5. Copy the connection string:
   ```
   mongodb+srv://taskvip-admin:<password>@taskvip.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Add database name: `/taskvip` before the `?`

**Final format:**
```env
MONGODB_URI=mongodb+srv://taskvip-admin:yourpassword@taskvip.xxxxx.mongodb.net/taskvip?retryWrites=true&w=majority
```

---

## 🔐 **2. JWT Secret (Authentication)**

### **Generate Secure JWT Secret:**
```bash
# Option 1: Use our generator
npm run generate-env

# Option 2: Generate manually
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 3: Online generator
# Visit: https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
# Select: 256-bit, Hex
```

**Example:**
```env
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789012345678901234567890abcdef
```

---

## 📧 **3. Gmail SMTP (Email Service)**

### **Step 1: Enable 2-Factor Authentication**
1. Go to: https://myaccount.google.com/security
2. Under **"Signing in to Google"**
3. Click **"2-Step Verification"**
4. Follow setup instructions

### **Step 2: Generate App Password**
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **"Mail"**
3. Select device: **"Other (Custom name)"**
4. Enter: **"TaskVIP Backend"**
5. Click **"Generate"**
6. Copy the 16-character password (save it!)

### **Step 3: Configure Environment Variables**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

**Example:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=taskvip@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

---

## 💳 **4. Razorpay (Payment Gateway)**

### **Step 1: Create Razorpay Account**
1. Go to: https://razorpay.com
2. Click **"Sign Up"**
3. Complete business verification
4. Provide required documents (PAN, Bank details)

### **Step 2: Get Test API Keys**
1. Login to Razorpay Dashboard
2. Go to **"Settings"** → **"API Keys"**
3. Under **"Test Mode"**:
   - Click **"Generate Test Key"**
   - Copy **"Key ID"** (starts with `rzp_test_`)
   - Click **"Download Key Secret"** or copy it

### **Step 3: Configure Environment Variables**
```env
RAZORPAY_KEY_ID=rzp_test_1234567890abcd
RAZORPAY_KEY_SECRET=your_secret_key_here
```

### **Step 4: Go Live (Later)**
1. Complete KYC verification
2. Submit required documents
3. Wait for approval (2-7 days)
4. Get live keys (starts with `rzp_live_`)

---

## 📺 **5. PropellerAds (Optional - Ad Network)**

### **Step 1: Create Account**
1. Go to: https://propellerads.com
2. Click **"Advertiser Sign Up"** or **"Publisher Sign Up"**
3. Complete registration
4. Verify email and phone

### **Step 2: Get API Key**
1. Login to dashboard
2. Go to **"Tools"** → **"API"**
3. Generate API key
4. Copy the key

```env
PROPELLERADS_API_KEY=your-propellerads-api-key
```

---

## 📺 **6. Adsterra (Optional - Ad Network)**

### **Step 1: Create Account**
1. Go to: https://adsterra.com
2. Click **"Sign Up"**
3. Choose **"Publisher"** or **"Advertiser"**
4. Complete registration

### **Step 2: Get API Key**
1. Login to dashboard
2. Go to **"API"** section
3. Generate API credentials
4. Copy API key

```env
ADSTERRA_API_KEY=your-adsterra-api-key
```

---

## 🛠️ **Setting Up Environment Variables**

### **Step 1: Generate All Variables**
```bash
npm run generate-env
```

### **Step 2: Add to Render Backend**
1. Go to: https://dashboard.render.com
2. Click on your **TaskVIP** service
3. Go to **"Environment"** tab
4. Add each variable:

```env
# Critical
NODE_ENV=production
MONGODB_URI=mongodb+srv://taskvip-admin:password@cluster.mongodb.net/taskvip
JWT_SECRET=your-generated-jwt-secret
FRONTEND_URL=https://task-vip.vercel.app

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Admin
ADMIN_EMAIL=admin@taskvip.com
ADMIN_PASSWORD=your-admin-password

# Payment (Optional)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Ad Networks (Optional)
PROPELLERADS_API_KEY=your-propellerads-key
ADSTERRA_API_KEY=your-adsterra-key
```

### **Step 3: Save and Redeploy**
1. Click **"Save Changes"**
2. Your service will automatically redeploy
3. Check logs for successful connection

---

## ✅ **Testing Your Setup**

### **Test Database Connection:**
```bash
# Check backend logs in Render
# Should see: "MongoDB connected successfully"
```

### **Test Email Service:**
```bash
# Try user registration on your frontend
# Should receive verification email
```

### **Test Payment Gateway:**
```bash
# Try VIP upgrade on your frontend
# Should redirect to Razorpay payment page
```

---

## 🔒 **Security Best Practices**

### **✅ Do:**
- Use environment variables for all secrets
- Enable 2FA on all accounts
- Use test keys for development
- Regularly rotate API keys
- Monitor API usage

### **❌ Don't:**
- Hardcode API keys in source code
- Share API keys in chat/email
- Use live keys for testing
- Commit .env files to Git
- Use weak passwords

---

## 🎯 **Priority Setup Order**

### **Phase 1 (Essential):**
1. ✅ MongoDB Atlas - Database
2. ✅ JWT Secret - Authentication  
3. ✅ Gmail SMTP - Email verification

### **Phase 2 (Payments):**
4. 🟡 Razorpay - Payment processing

### **Phase 3 (Monetization):**
5. 🟢 PropellerAds - Ad revenue
6. 🟢 Adsterra - Additional ad revenue

---

## 🚀 **Quick Setup Commands**

```bash
# Generate secure environment variables
npm run generate-env

# Test backend health
npm run test-keep-alive

# Setup frontend environment
npm run setup-frontend-prod
```

---

## 📞 **Support Links**

- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Razorpay:** https://razorpay.com/docs/
- **Gmail SMTP:** https://support.google.com/accounts/answer/185833
- **PropellerAds:** https://propellerads.com/blog/
- **Adsterra:** https://adsterra.com/blog/

---

**🎉 Once you have these API keys configured, your TaskVIP platform will be fully operational with database, authentication, email verification, and payment processing!**

# 🔑 Complete API Keys Setup Guide for TaskVIP Backend

## 📋 **Required API Keys Overview**

Your TaskVIP backend needs these API keys for full functionality:

### **🔴 Critical (Required for basic functionality):**
- **MongoDB Atlas** - Database connection
- **JWT Secret** - Authentication security
- **Gmail SMTP** - Email verification
- **Google OAuth** - Social login (recommended)

### **🟡 Important (Required for payments):**
- **Razorpay** - Payment processing (India)

### **🟢 Monetization (Hybrid Reward System):**
- **CPALead** - High-value offer wall (cash payouts)
- **AdGate Media** - Survey and offer network
- **AdMob** - Premium video ads (Google)
- **Unity Ads** - Alternative video ad network
- **Adscend Media** - Additional offer network

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

## 🔐 **4. Google OAuth (Social Login)**

### **Step 1: Create Google Cloud Project**
1. Go to: https://console.cloud.google.com/
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: **"TaskVIP-OAuth"**
4. Click **"Create"**

### **Step 2: Configure OAuth Consent Screen**
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (for public app)
3. Fill in required fields:
   - **App name**: `TaskVIP`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. **Scopes**: Add `../auth/userinfo.email` and `../auth/userinfo.profile`
5. **Test users**: Add your email
6. Click **"Save and Continue"**

### **Step 3: Create OAuth Credentials**
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. **Application type**: `Web application`
4. **Name**: `TaskVIP Web Client`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://task-vip.vercel.app
   https://your-domain.com
   ```
6. **Authorized redirect URIs**: Same as above
7. Click **"Create"**
8. **Copy the Client ID** (starts with numbers, ends with `.apps.googleusercontent.com`)

### **Step 4: Configure Environment Variables**

**Backend (.env):**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

### **Step 5: Deploy Configuration**
- **Vercel**: Add `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in project settings
- **Render**: Add `GOOGLE_CLIENT_ID` in service environment

---

## 💳 **5. Razorpay (Payment Gateway)**

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

## 🎯 **5. CPALead (High-Value Offers)**

### **Step 1: Create Publisher Account**
1. Go to: https://cpalead.com
2. Click **"Publisher Sign Up"**
3. Complete application (approval required)
4. Provide website details: TaskVIP app
5. Wait for approval (1-3 days)

### **Step 2: Get API Credentials**
1. Login to publisher dashboard
2. Go to **"Tools"** → **"API"**
3. Generate API key and get your SubID
4. Copy both values

```env
CPALEAD_API_KEY=your-cpalead-api-key
CPALEAD_SUBID=your-cpalead-subid
```

### **Step 3: Setup Offer Wall**
1. Go to **"Tools"** → **"Content Lockers"**
2. Create new **"Offer Wall"**
3. Configure for mobile/web
4. Get wall URL and integration code

---

## 📋 **6. AdGate Media (Surveys & Offers)**

### **Step 1: Publisher Registration**
1. Go to: https://adgatemedia.com
2. Click **"Publishers"** → **"Sign Up"**
3. Complete detailed application
4. Provide app/website information
5. Wait for approval (2-5 days)

### **Step 2: Get API Access**
1. Login to publisher portal
2. Go to **"API"** section
3. Generate API key
4. Get your Wall ID

```env
ADGATE_API_KEY=your-adgate-api-key
ADGATE_WALL_ID=your-adgate-wall-id
```

### **Step 3: Configure Offer Wall**
1. Go to **"Offer Walls"**
2. Create new wall for your app
3. Configure reward settings
4. Set up postback URL for rewards

---

## 📱 **7. Google AdMob (Premium Video Ads)**

### **Step 1: Create AdMob Account**
1. Go to: https://admob.google.com
2. Sign in with Google account
3. Click **"Get Started"**
4. Add your app information

### **Step 2: Create App**
1. Click **"Apps"** → **"Add App"**
2. Choose **"No, it's not listed on a supported app store"**
3. Enter app name: **"TaskVIP"**
4. Select platform: **Android/iOS**
5. Click **"Add"**

### **Step 3: Create Ad Units**
1. Go to **"Ad Units"**
2. Click **"Add Ad Unit"**
3. Select **"Rewarded"** ad format
4. Name: **"TaskVIP Reward Video"**
5. Copy the Ad Unit ID

```env
ADMOB_APP_ID=ca-app-pub-1234567890123456~1234567890
ADMOB_PUBLISHER_ID=pub-1234567890123456
```

### **Step 4: Setup Payments**
1. Go to **"Payments"**
2. Add payment method (bank/PayPal)
3. Set minimum payout threshold
4. Complete tax information

---

## 🎮 **8. Unity Ads (Alternative Video Network)**

### **Step 1: Create Unity Account**
1. Go to: https://unity.com/products/unity-ads
2. Click **"Get Started"**
3. Sign up with email or Google
4. Complete developer profile

### **Step 2: Create Project**
1. Go to Unity Dashboard
2. Click **"Create Project"**
3. Enter project name: **"TaskVIP"**
4. Select **"Mobile"** platform
5. Get Game ID

### **Step 3: Configure Monetization**
1. Go to **"Monetization"**
2. Enable **"Unity Ads"**
3. Create **"Rewarded Video"** placement
4. Get API key from settings

```env
UNITY_GAME_ID=1234567
UNITY_API_KEY=your-unity-api-key
```

---

## 🌟 **9. Adscend Media (Additional Offers)**

### **Step 1: Publisher Registration**
1. Go to: https://adscendmedia.com
2. Click **"Publishers"** → **"Apply Now"**
3. Complete detailed application
4. Provide traffic source details
5. Wait for approval (3-7 days)

### **Step 2: Get API Credentials**
1. Login to publisher dashboard
2. Go to **"API"** → **"Documentation"**
3. Generate API key
4. Get your Publisher ID

```env
ADSCEND_API_KEY=your-adscend-api-key
ADSCEND_PUB_ID=your-adscend-publisher-id
```

### **Step 3: Setup Offer Integration**
1. Go to **"Offer Walls"**
2. Create new wall configuration
3. Set up postback URLs for rewards
4. Configure payout settings

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

# Google OAuth (Recommended)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Hybrid Reward System (Monetization)
CPALEAD_API_KEY=your-cpalead-api-key
CPALEAD_SUBID=your-cpalead-subid
ADGATE_API_KEY=your-adgate-api-key
ADGATE_WALL_ID=your-adgate-wall-id
ADMOB_APP_ID=ca-app-pub-your-admob-app-id
ADMOB_PUBLISHER_ID=pub-your-admob-publisher-id
UNITY_GAME_ID=your-unity-game-id
UNITY_API_KEY=your-unity-api-key
ADSCEND_API_KEY=your-adscend-api-key
ADSCEND_PUB_ID=your-adscend-publisher-id
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
4. ✅ Google OAuth - Social login

### **Phase 2 (Payments):**
5. 🟡 Razorpay - Payment processing

### **Phase 3 (Monetization):**
6. 🟢 PropellerAds - Ad revenue
7. 🟢 Adsterra - Additional ad revenue

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

## 🎯 **Priority Setup Order**

### **Phase 1: Core Functionality (Required)**
1. 🔴 **MongoDB Atlas** - Database (critical)
2. 🔴 **JWT Secret** - Authentication (critical)
3. 🔴 **Gmail SMTP** - Email verification (critical)
4. 🟡 **Google OAuth** - Social login (recommended)

### **Phase 2: Monetization (Launch)**
5. 🟢 **CPALead** - High-value offers (start here)
6. 🟢 **AdMob** - Premium video ads (stable revenue)
7. 🟡 **Razorpay** - VIP payments (India)

### **Phase 3: Scale (Growth)**
8. 🟢 **AdGate Media** - Additional offers
9. 🟢 **Unity Ads** - Alternative video network
10. 🟢 **Adscend Media** - More offer variety

---

## 📞 **Support Links**

### **Core Services:**
- **MongoDB Atlas:** https://docs.atlas.mongodb.com/
- **Google OAuth:** https://developers.google.com/identity/protocols/oauth2
- **Gmail SMTP:** https://support.google.com/accounts/answer/185833
- **Razorpay:** https://razorpay.com/docs/

### **Monetization Networks:**
- **CPALead:** https://cpalead.com/help/
- **AdGate Media:** https://adgatemedia.com/support/
- **Google AdMob:** https://support.google.com/admob/
- **Unity Ads:** https://docs.unity.com/ads/
- **Adscend Media:** https://adscendmedia.com/support/

---

**🎉 Once you have these API keys configured, your TaskVIP platform will be fully operational with:**

✅ **Core Features:** Database, authentication, email verification  
✅ **Hybrid Reward System:** AdMob + CPALead + AdGate for maximum profitability  
✅ **VIP Tiers:** Bronze/Silver/Gold with 1.2x-2.0x multipliers  
✅ **Cash Payouts:** Real money withdrawals via Paytm/UPI/PayPal  
✅ **Fraud Protection:** Daily limits, IP tracking, manual approval  

**Ready to launch your profitable reward app!** 🚀

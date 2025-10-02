# 🔑 **DETAILED API Keys Setup Guide for TaskVIP Backend**

## 📖 **Complete Step-by-Step Tutorial with Screenshots Guide**

This guide provides detailed instructions with visual descriptions to help you get all API keys for your TaskVIP backend.

---

## 🗄️ **1. MongoDB Atlas - Database Setup (FREE)**

### **What is MongoDB Atlas?**
MongoDB Atlas is a cloud database service that provides free hosting for your TaskVIP database. The free tier (M0 Sandbox) gives you 512MB storage, which is perfect for starting your platform.

### **📸 Step-by-Step Visual Guide:**

#### **Step 1: Create Account**
1. **Visit:** https://cloud.mongodb.com
2. **Look for:** Green "Try Free" button (top right)
3. **Click:** "Try Free"
4. **You'll see:** Registration form with options:
   - Sign up with Google (recommended)
   - Sign up with GitHub
   - Sign up with email
5. **Choose:** Google sign-up for fastest setup
6. **Complete:** Basic information form

#### **Step 2: Choose Deployment**
1. **You'll see:** "Deploy your database" page
2. **Look for:** Three options (Serverless, Dedicated, Shared)
3. **Select:** "Shared" (it shows "FREE" badge)
4. **You'll see:** "M0 Sandbox" option with "$0/month forever"
5. **Click:** "Create" button under M0 Sandbox

#### **Step 3: Configure Cluster**
1. **Cloud Provider:** Select "AWS" (recommended)
2. **Region:** Choose closest to your location:
   - For India: "Mumbai (ap-south-1)"
   - For US: "N. Virginia (us-east-1)"
   - For Europe: "Ireland (eu-west-1)"
3. **Cluster Name:** Change to "TaskVIP" (optional)
4. **Click:** "Create Cluster" (green button)
5. **Wait:** 1-3 minutes for cluster creation

#### **Step 4: Security Setup - Database User**
1. **You'll see:** "Security Quickstart" modal
2. **Authentication Method:** Keep "Username and Password" selected
3. **Username:** Enter `taskvip-admin`
4. **Password:** Click "Autogenerate Secure Password" 
5. **IMPORTANT:** Copy and save this password somewhere safe!
6. **Click:** "Create User"

#### **Step 5: Security Setup - Network Access**
1. **You'll see:** "Where would you like to connect from?" section
2. **Options:** "My Local Environment" or "Cloud Environment"
3. **Select:** "Cloud Environment" 
4. **You'll see:** IP Address field
5. **Click:** "Add My Current IP Address" button
6. **IMPORTANT:** Also click "Add a Different IP Address"
7. **Enter:** `0.0.0.0/0` (allows access from anywhere)
8. **Description:** "Allow all IPs for Render deployment"
9. **Click:** "Add Entry"
10. **Click:** "Finish and Close"

#### **Step 6: Get Connection String**
1. **You'll see:** Database dashboard
2. **Click:** "Connect" button (on your cluster)
3. **You'll see:** Connection modal with 3 options
4. **Select:** "Connect your application"
5. **Driver:** Select "Node.js"
6. **Version:** Select "4.1 or later"
7. **You'll see:** Connection string like:
   ```
   mongodb+srv://taskvip-admin:<password>@taskvip.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
8. **Copy:** The entire connection string
9. **Replace:** `<password>` with your actual password
10. **Add:** `/taskvip` before the `?` to specify database name

**Final Result:**
```env
MONGODB_URI=mongodb+srv://taskvip-admin:yourpassword@taskvip.xxxxx.mongodb.net/taskvip?retryWrites=true&w=majority
```

### **🔍 Troubleshooting MongoDB:**
- **"Cluster creation failed":** Try different region
- **"Connection timeout":** Check network access settings
- **"Authentication failed":** Verify username/password
- **"Database not found":** Make sure you added `/taskvip` to connection string

---

## 🔐 **2. JWT Secret - Authentication Security (FREE)**

### **What is JWT Secret?**
JWT (JSON Web Token) Secret is a cryptographic key used to sign and verify user authentication tokens. It must be long, random, and kept secret.

### **📸 Step-by-Step Generation:**

#### **Method 1: Use Our Generator (Recommended)**
1. **Open terminal** in your TaskVIP project
2. **Run command:**
   ```bash
   npm run generate-env
   ```
3. **You'll see:** Output with generated JWT_SECRET
4. **Copy:** The long hexadecimal string
5. **Example output:**
   ```
   JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef...
   ```

#### **Method 2: Generate Manually**
1. **Open terminal** anywhere
2. **Run command:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
3. **You'll see:** 128-character random string
4. **Copy:** The entire string

#### **Method 3: Online Generator**
1. **Visit:** https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
2. **Select:** "256-bit" from dropdown
3. **Format:** Select "Hex"
4. **Click:** "Generate"
5. **Copy:** The generated key

**Final Result:**
```env
JWT_SECRET=your-128-character-hex-string-here
JWT_EXPIRE=7d
```

### **🔍 JWT Security Tips:**
- **Length:** Must be at least 32 characters (64+ recommended)
- **Randomness:** Use cryptographically secure generation
- **Secrecy:** Never share or commit to Git
- **Rotation:** Change periodically for security

---

## 📧 **3. Gmail SMTP - Email Service (FREE)**

### **What is Gmail SMTP?**
Gmail SMTP allows your TaskVIP backend to send verification emails, password resets, and notifications through Gmail's secure email servers.

### **📸 Step-by-Step Visual Guide:**

#### **Step 1: Enable 2-Factor Authentication**
1. **Visit:** https://myaccount.google.com/security
2. **You'll see:** "Signing in to Google" section
3. **Look for:** "2-Step Verification" option
4. **Current status:** Probably shows "Off"
5. **Click:** "2-Step Verification"
6. **You'll see:** Setup wizard
7. **Click:** "Get Started"
8. **Follow:** Phone number verification steps
9. **Complete:** SMS or call verification
10. **Status:** Should now show "On"

#### **Step 2: Generate App Password**
1. **Visit:** https://myaccount.google.com/apppasswords
2. **You might see:** "App passwords" section
3. **If not visible:** Make sure 2FA is enabled first
4. **Click:** "Select app" dropdown
5. **Choose:** "Mail"
6. **Click:** "Select device" dropdown
7. **Choose:** "Other (Custom name)"
8. **Enter name:** "TaskVIP Backend"
9. **Click:** "Generate"
10. **You'll see:** 16-character password in yellow box
11. **IMPORTANT:** Copy this password immediately (you can't see it again!)

#### **Step 3: Test SMTP Settings**
**Settings to use:**
- **Host:** smtp.gmail.com
- **Port:** 587
- **Security:** STARTTLS
- **Username:** Your full Gmail address
- **Password:** The 16-character app password (not your regular password)

**Final Result:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
```

### **🔍 Troubleshooting Gmail SMTP:**
- **"App passwords not available":** Enable 2FA first
- **"Authentication failed":** Use app password, not regular password
- **"Connection refused":** Check port 587 and STARTTLS
- **"Less secure apps":** Not needed with app passwords

---

## 💳 **4. Razorpay - Payment Gateway (India)**

### **What is Razorpay?**
Razorpay is India's leading payment gateway that allows your TaskVIP platform to accept payments for VIP subscriptions, process withdrawals, and handle all financial transactions.

### **📸 Step-by-Step Visual Guide:**

#### **Step 1: Create Razorpay Account**
1. **Visit:** https://razorpay.com
2. **You'll see:** Homepage with "Sign Up" button
3. **Click:** "Sign Up" (top right)
4. **You'll see:** Registration form
5. **Fill in:**
   - Business email
   - Mobile number
   - Business name: "TaskVIP"
   - Business type: "Technology/Software"
6. **Click:** "Create Account"
7. **Verify:** Email and mobile number

#### **Step 2: Complete KYC (Know Your Customer)**
1. **You'll see:** Dashboard with KYC pending notice
2. **Click:** "Complete KYC" or "Activate Account"
3. **You'll need to provide:**
   - **PAN Card:** Business or personal PAN
   - **Bank Account:** Business bank account details
   - **Address Proof:** Utility bill or rent agreement
   - **Identity Proof:** Aadhaar card or passport
4. **Upload:** Clear photos/scans of documents
5. **Submit:** Application for review
6. **Wait:** 2-7 business days for approval

#### **Step 3: Get Test API Keys**
1. **Login:** to Razorpay Dashboard
2. **You'll see:** Left sidebar menu
3. **Look for:** "Settings" at bottom of sidebar
4. **Click:** "Settings"
5. **You'll see:** Settings menu
6. **Click:** "API Keys"
7. **You'll see:** Two sections: "Test Mode" and "Live Mode"
8. **In Test Mode section:**
   - **Click:** "Generate Test Key" button
   - **You'll see:** Key ID (starts with `rzp_test_`)
   - **Click:** "Download Key Secret" or copy icon
   - **IMPORTANT:** Save both Key ID and Secret securely

#### **Step 4: Test Mode vs Live Mode**
**Test Mode (Development):**
- Use for development and testing
- No real money transactions
- Keys start with `rzp_test_`
- Available immediately

**Live Mode (Production):**
- Use for real transactions
- Requires KYC approval
- Keys start with `rzp_live_`
- Available after account activation

**Final Result (Test Mode):**
```env
RAZORPAY_KEY_ID=rzp_test_1234567890abcd
RAZORPAY_KEY_SECRET=your_secret_key_here
```

### **🔍 Troubleshooting Razorpay:**
- **"KYC pending":** Complete document verification
- **"Test keys not working":** Check key format (rzp_test_)
- **"Live keys unavailable":** Wait for KYC approval
- **"Payment failed":** Use test card numbers in test mode

---

## 📺 **5. PropellerAds - Ad Network (Optional)**

### **What is PropellerAds?**
PropellerAds is a global advertising network that can help monetize your TaskVIP platform by displaying ads to users and paying you for ad views/clicks.

### **📸 Step-by-Step Visual Guide:**

#### **Step 1: Create Publisher Account**
1. **Visit:** https://propellerads.com
2. **You'll see:** Homepage with multiple options
3. **Look for:** "Publishers" section or "Earn with us"
4. **Click:** "Join as Publisher" or "Sign Up"
5. **You'll see:** Registration form
6. **Fill in:**
   - Email address
   - Password
   - Country: Your location
   - Website: Your TaskVIP frontend URL
7. **Click:** "Sign Up"

#### **Step 2: Account Verification**
1. **Check email:** for verification link
2. **Click:** verification link
3. **You'll see:** "Account verified" message
4. **Login:** to PropellerAds dashboard
5. **Complete:** profile information
6. **Add:** website details and traffic information

#### **Step 3: Get API Access**
1. **In dashboard:** look for "Tools" or "API" section
2. **Click:** "API" or "Developer Tools"
3. **You'll see:** API documentation and key generation
4. **Click:** "Generate API Key"
5. **Copy:** the generated API key
6. **Save:** securely for your backend

**Final Result:**
```env
PROPELLERADS_API_KEY=your-propellerads-api-key
```

---

## 📺 **6. Adsterra - Ad Network (Optional)**

### **What is Adsterra?**
Adsterra is another advertising network that provides additional monetization options for your TaskVIP platform with different ad formats and potentially higher payouts.

### **📸 Step-by-Step Visual Guide:**

#### **Step 1: Create Publisher Account**
1. **Visit:** https://adsterra.com
2. **You'll see:** Homepage with "Sign Up" options
3. **Look for:** "Publishers" or "Earn Money"
4. **Click:** "Sign Up as Publisher"
5. **Fill in:**
   - Email
   - Password
   - Country
   - Website URL
   - Traffic source
6. **Submit:** application

#### **Step 2: Account Approval**
1. **Wait:** for email approval (usually 24-48 hours)
2. **Check:** application status
3. **If approved:** you'll receive login credentials
4. **Login:** to Adsterra dashboard

#### **Step 3: Get API Credentials**
1. **In dashboard:** look for "API" section
2. **Click:** "API Documentation" or "API Access"
3. **Generate:** API key
4. **Copy:** credentials for your backend

**Final Result:**
```env
ADSTERRA_API_KEY=your-adsterra-api-key
```

---

## 🛠️ **Adding API Keys to Your Backend**

### **📸 Step-by-Step Render Configuration:**

#### **Step 1: Access Render Dashboard**
1. **Visit:** https://dashboard.render.com
2. **Login:** with your account
3. **You'll see:** List of your services
4. **Find:** "TaskVIP" service
5. **Click:** on the service name

#### **Step 2: Navigate to Environment Variables**
1. **You'll see:** Service dashboard
2. **Look for:** tabs at top (Overview, Events, Logs, etc.)
3. **Click:** "Environment" tab
4. **You'll see:** Environment variables section
5. **Look for:** "Add Environment Variable" button

#### **Step 3: Add Each Variable**
For each API key, repeat these steps:
1. **Click:** "Add Environment Variable"
2. **You'll see:** Two fields: "Key" and "Value"
3. **Key field:** Enter variable name (e.g., `MONGODB_URI`)
4. **Value field:** Enter the actual key/value
5. **Click:** "Add" button
6. **Repeat:** for all variables

#### **Required Variables to Add:**
```env
NODE_ENV=production
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
FRONTEND_URL=https://task-vip.vercel.app
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ADMIN_EMAIL=admin@taskvip.com
ADMIN_PASSWORD=your-secure-admin-password
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
PROPELLERADS_API_KEY=your-propellerads-key
ADSTERRA_API_KEY=your-adsterra-key
```

#### **Step 4: Save and Deploy**
1. **After adding all variables:** you'll see them listed
2. **Click:** "Save Changes" button
3. **You'll see:** "Deploying..." status
4. **Wait:** for deployment to complete (2-3 minutes)
5. **Check:** logs for "MongoDB connected successfully"

---

## ✅ **Testing Your API Keys**

### **🔍 How to Verify Everything Works:**

#### **Test 1: Backend Health Check**
```bash
# Run this command in your project
npm run test-keep-alive
```
**Expected result:** ✅ Health check successful!

#### **Test 2: Database Connection**
1. **Check Render logs:** Should see "MongoDB connected successfully"
2. **No errors:** about database connection

#### **Test 3: Email Service**
1. **Try user registration** on your frontend
2. **Check email:** for verification message
3. **Email received:** ✅ SMTP working

#### **Test 4: Payment Gateway**
1. **Try VIP upgrade** on your frontend
2. **Should redirect:** to Razorpay payment page
3. **Use test card:** 4111 1111 1111 1111

---

## 🚨 **Common Issues and Solutions**

### **MongoDB Issues:**
- **"MongoNetworkError":** Check connection string format
- **"Authentication failed":** Verify username/password
- **"Connection timeout":** Check network access (0.0.0.0/0)

### **Gmail SMTP Issues:**
- **"Invalid login":** Use app password, not regular password
- **"Connection refused":** Check port 587
- **"App password unavailable":** Enable 2FA first

### **Razorpay Issues:**
- **"Invalid API key":** Check test vs live mode
- **"KYC required":** Complete document verification
- **"Payment failed":** Use proper test card numbers

### **General Issues:**
- **"Environment variable not found":** Check spelling and case
- **"Service not restarting":** Manually redeploy in Render
- **"CORS errors":** Update FRONTEND_URL

---

## 🎯 **Setup Priority Order**

### **Phase 1: Essential (Do First)**
1. ✅ **MongoDB Atlas** - Database (15 minutes)
2. ✅ **JWT Secret** - Authentication (2 minutes)
3. ✅ **Gmail SMTP** - Email verification (10 minutes)

### **Phase 2: Payments (Do Second)**
4. 🟡 **Razorpay** - Payment processing (30 minutes + KYC wait)

### **Phase 3: Monetization (Do Later)**
5. 🟢 **PropellerAds** - Ad revenue (20 minutes + approval wait)
6. 🟢 **Adsterra** - Additional ads (20 minutes + approval wait)

---

## 🔒 **Security Checklist**

### **✅ Must Do:**
- [ ] Use environment variables for all secrets
- [ ] Enable 2FA on all accounts
- [ ] Use strong, unique passwords
- [ ] Keep API keys private (never share)
- [ ] Use test keys for development
- [ ] Add .env to .gitignore

### **❌ Never Do:**
- [ ] Hardcode API keys in source code
- [ ] Share keys in chat/email/forums
- [ ] Use live keys for testing
- [ ] Commit secrets to Git repositories
- [ ] Use weak or default passwords

---

## 🎉 **Success! Your TaskVIP Platform is Ready**

Once you complete this guide, your TaskVIP platform will have:

- 🗄️ **Database:** MongoDB Atlas for user data
- 🔐 **Authentication:** JWT for secure login
- 📧 **Email:** Gmail SMTP for verification
- 💳 **Payments:** Razorpay for VIP subscriptions
- 📺 **Revenue:** Ad networks for monetization

**Your refer & earn platform is now fully operational and ready to serve users!** 🚀

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the troubleshooting sections above
2. Verify all environment variables are set correctly
3. Check service logs for specific error messages
4. Test each component individually

**Remember:** Start with Phase 1 (MongoDB, JWT, Gmail) to get your platform working, then add payments and ads later!

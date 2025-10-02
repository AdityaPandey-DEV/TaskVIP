# 🚀 TaskVIP Production Setup Checklist

## ✅ **Completed Steps**

### **✅ 1. Backend Deployment**
- [x] Backend deployed to Render: https://taskvip.onrender.com
- [x] Health check endpoint working: `/api/health`
- [x] MongoDB warnings fixed
- [x] Deprecated connection options removed
- [x] Start command corrected: `node server.js`

### **✅ 2. Keep-Alive System**
- [x] GitHub Actions workflows created
- [x] Automated pings every 14 minutes
- [x] Multiple fallback strategies implemented
- [x] Testing tools created and verified

---

## 🔧 **Required Environment Variables**

### **In Render Dashboard → Environment:**

#### **🔴 Critical (Required for basic functionality):**
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskvip
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random-at-least-32-chars
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

#### **🟡 Important (Required for full functionality):**
```env
# Email Service (for verification emails)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# Admin Access
ADMIN_EMAIL=admin@taskvip.com
ADMIN_PASSWORD=your-secure-admin-password
```

#### **🟢 Optional (for advanced features):**
```env
# Payment Gateway (Razorpay for India)
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Ad Networks (for monetization)
PROPELLERADS_API_KEY=your-propellerads-key
ADSTERRA_API_KEY=your-adsterra-key

# Security Settings
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

---

## 📋 **Next Steps to Complete Setup**

### **Step 1: Set Environment Variables in Render**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your **TaskVIP** service
3. Go to **Environment** tab
4. Add the variables listed above (start with Critical ones)
5. Click **Save Changes**

### **Step 2: Set Up MongoDB Database**
```bash
# Option A: MongoDB Atlas (Recommended)
1. Go to https://cloud.mongodb.com
2. Create a free cluster
3. Create database user
4. Get connection string
5. Add to MONGODB_URI in Render

# Option B: Local MongoDB (Development only)
MONGODB_URI=mongodb://localhost:27017/taskvip
```

### **Step 3: Configure Email Service**
```bash
# Gmail Setup (Recommended)
1. Enable 2-factor authentication on Gmail
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use App Password (not your regular password)

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### **Step 4: Enable GitHub Actions Keep-Alive**
1. Go to your GitHub repository
2. Click **Actions** tab
3. Enable workflows if prompted
4. Workflows will start automatically every 14 minutes

### **Step 5: Test Your Deployment**
```bash
# Test health endpoint
curl https://taskvip.onrender.com/api/health

# Expected response:
{"status":"OK","timestamp":"2025-10-02T...","version":"1.0.0"}
```

---

## 🎯 **Frontend Deployment (Next)**

### **Deploy Frontend to Vercel:**
```bash
# In your frontend directory
npm run build
# Deploy to Vercel and get URL like: https://taskvip.vercel.app

# Then update FRONTEND_URL in Render:
FRONTEND_URL=https://taskvip.vercel.app
```

---

## 🔍 **Monitoring & Troubleshooting**

### **Check Deployment Status:**
- **Render Logs:** Dashboard → Your Service → Logs
- **GitHub Actions:** Repository → Actions tab
- **Health Check:** https://taskvip.onrender.com/api/health

### **Common Issues & Solutions:**

#### **🔴 "Cannot connect to MongoDB"**
```bash
Solution: Check MONGODB_URI format and database permissions
Correct format: mongodb+srv://username:password@cluster.mongodb.net/taskvip
```

#### **🔴 "JWT must be provided"**
```bash
Solution: Add JWT_SECRET environment variable
Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### **🔴 "CORS Error"**
```bash
Solution: Set correct FRONTEND_URL in Render environment
Example: FRONTEND_URL=https://your-frontend.vercel.app
```

#### **🔴 "Email sending failed"**
```bash
Solution: Check EMAIL_* variables and Gmail App Password
Enable 2FA and generate App Password in Gmail settings
```

---

## 📊 **Success Indicators**

### **✅ Backend is Ready When:**
- Health check returns 200 OK
- No errors in Render logs
- MongoDB connection successful
- Environment shows "production"

### **✅ Keep-Alive is Working When:**
- GitHub Actions show green checkmarks
- Logs show "Backend is alive!" every 14 minutes
- No cold start delays when accessing your app

### **✅ Full System is Ready When:**
- Backend API responds correctly
- Frontend connects to backend
- User registration/login works
- Email verification works
- Database operations successful

---

## 🚀 **Production URLs**

Once fully configured:
- **Backend API:** https://taskvip.onrender.com
- **Frontend:** https://your-frontend.vercel.app (to be deployed)
- **Admin Panel:** https://taskvip.onrender.com/api/admin
- **Health Check:** https://taskvip.onrender.com/api/health

---

## 🎉 **You're Almost There!**

**Current Status:** ✅ Backend deployed and keep-alive active
**Next:** Add environment variables and deploy frontend
**Result:** Full production TaskVIP platform ready for users!

---

**Need help with any step? Check the logs or test endpoints to identify specific issues.**

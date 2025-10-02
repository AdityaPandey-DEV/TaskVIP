# 🚀 TaskVIP Render Deployment Guide

## ❌ **Current Issues & Fixes**

### **Issue 1: Wrong Start Command**
**Error:** `Cannot find module '/opt/render/project/src/backend/index.js'`  
**Cause:** Render is trying to run `node index.js` but your backend uses `server.js`

**Fix:** In Render Dashboard → Settings → Build & Deploy:
```bash
# Change Start Command from:
node index.js

# To:
node server.js
```

### **Issue 2: Wrong Health Check Path**
**Current:** `/healthz`  
**Should be:** `/api/health`

**Fix:** In Render Dashboard → Settings → Health Checks:
```
Health Check Path: /api/health
```

---

## 🔧 **Complete Render Configuration**

### **1. General Settings**
```
Name: TaskVIP
Region: Oregon (US West) 
Instance Type: Free (0.1 CPU, 512 MB)
```

### **2. Repository Settings**
```
Repository: https://github.com/AdityaPandey-DEV/TaskVIP
Branch: main
Root Directory: ./backend
```

### **3. Build & Deploy Settings**
```
Build Command: npm install
Pre-Deploy Command: (leave empty)
Start Command: node server.js
Auto-Deploy: On Commit
```

### **4. Health Check Settings**
```
Health Check Path: /api/health
```

### **5. Environment Variables**
Add these in Render Dashboard → Settings → Environment:

#### **Required Variables:**
```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://your-frontend-url.vercel.app
```

#### **Database (Required):**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskvip
```

#### **JWT (Required):**
```env
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=7d
```

#### **Email (Required for verification):**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

#### **Admin (Required):**
```env
ADMIN_EMAIL=admin@taskvip.com
ADMIN_PASSWORD=your-secure-admin-password
```

#### **Optional (for full functionality):**
```env
# Payment Gateway
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Ad Networks
PROPELLERADS_API_KEY=your-propellerads-api-key
ADSTERRA_API_KEY=your-adsterra-api-key

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

---

## 📋 **Step-by-Step Deployment**

### **Step 1: Fix Current Issues**
1. Go to your Render dashboard
2. Click on your TaskVIP service
3. Go to **Settings** tab
4. Under **Build & Deploy**:
   - Change **Start Command** to: `node server.js`
5. Under **Health Checks**:
   - Change **Health Check Path** to: `/api/health`
6. Click **Save Changes**

### **Step 2: Add Environment Variables**
1. Go to **Environment** tab
2. Add the required variables listed above
3. Start with the minimum required ones:
   - `NODE_ENV=production`
   - `MONGODB_URI=your-mongodb-connection-string`
   - `JWT_SECRET=your-secret-key`
   - `FRONTEND_URL=your-frontend-url`

### **Step 3: Trigger Redeploy**
1. Go to **Deploys** tab
2. Click **Deploy Latest Commit**
3. Monitor the build logs

### **Step 4: Verify Deployment**
1. Check build logs for success
2. Visit: `https://taskvip.onrender.com/api/health`
3. Should return: `{"status":"OK","timestamp":"...","version":"1.0.0"}`

---

## 🔍 **Troubleshooting Common Issues**

### **Build Fails**
```bash
# Check these in order:
1. Start Command: node server.js
2. Root Directory: ./backend
3. Build Command: npm install
4. All required env vars are set
```

### **Health Check Fails**
```bash
# Verify:
1. Health Check Path: /api/health
2. Service is actually running
3. No errors in application logs
```

### **Database Connection Issues**
```bash
# Check:
1. MONGODB_URI is correct
2. Database allows connections from 0.0.0.0/0
3. Username/password are correct
```

### **CORS Issues**
```bash
# Make sure FRONTEND_URL matches your actual frontend URL:
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## 🎯 **Expected Build Output**

When successful, you should see:
```bash
==> Building...
==> Running 'npm install'
npm WARN deprecated...
added 234 packages...

==> Build successful 🎉
==> Deploying...
==> Running 'node server.js'
Server running on port 10000
Environment: production
MongoDB connected successfully
==> Your service is live 🎉
```

---

## 🔗 **Service URLs**

After successful deployment:
- **Backend API:** `https://taskvip.onrender.com`
- **Health Check:** `https://taskvip.onrender.com/api/health`
- **Admin Panel:** `https://taskvip.onrender.com/api/admin` (if implemented)

---

## 🚀 **Keep-Alive Integration**

Once deployed successfully:

1. **Update GitHub Secrets:**
   - Go to your GitHub repo → Settings → Secrets
   - Add: `RENDER_BACKEND_URL` = `https://taskvip.onrender.com`

2. **GitHub Actions will automatically:**
   - Ping your backend every 14 minutes
   - Keep it active 24/7
   - Prevent cold starts

---

## ✅ **Deployment Checklist**

- [ ] Start Command: `node server.js`
- [ ] Health Check Path: `/api/health`
- [ ] Root Directory: `./backend`
- [ ] Environment variables added
- [ ] MongoDB connection string set
- [ ] JWT secret configured
- [ ] Frontend URL configured
- [ ] Build successful
- [ ] Health check passing
- [ ] GitHub Actions configured with correct URL

---

**Once you make these changes, your TaskVIP backend should deploy successfully on Render! 🎉**

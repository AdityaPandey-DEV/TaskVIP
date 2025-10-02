# 🎨 TaskVIP Frontend Deployment Guide

## 📋 **Frontend Environment Variables**

Yes! The TaskVIP frontend **does need environment variables**. Here's what you need:

### **🔴 Required Environment Variable:**

```env
NEXT_PUBLIC_API_URL=https://taskvip.onrender.com/api
```

This tells the frontend where to find your backend API.

---

## 🚀 **Deployment Options**

### **Option 1: Vercel (Recommended)**

#### **Step 1: Deploy to Vercel**
```bash
# In your project root
cd frontend
npm run build  # Test build locally first

# Deploy to Vercel
npx vercel --prod
# Or connect your GitHub repo to Vercel dashboard
```

#### **Step 2: Set Environment Variables in Vercel**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://taskvip.onrender.com/api`
   - **Environment:** Production
5. Click **Save**
6. Redeploy your project

### **Option 2: Netlify**

#### **Step 1: Deploy to Netlify**
```bash
cd frontend
npm run build

# Deploy build folder to Netlify
# Or connect GitHub repo to Netlify dashboard
```

#### **Step 2: Set Environment Variables in Netlify**
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click on your site
3. Go to **Site settings** → **Environment variables**
4. Add:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://taskvip.onrender.com/api`
5. Click **Save**
6. Trigger a new deploy

---

## 🔧 **Local Development Setup**

### **Create .env.local file:**
```bash
# In frontend directory
cd frontend

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

### **For Production Testing:**
```bash
# Test with production backend
echo "NEXT_PUBLIC_API_URL=https://taskvip.onrender.com/api" > .env.local
```

---

## 📊 **How Frontend Environment Variables Work**

### **In next.config.js:**
```javascript
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  },
  // API rewrites for cleaner URLs
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/:path*`,
      },
    ];
  },
}
```

### **In Frontend Code:**
The frontend makes API calls like:
```javascript
// This becomes: https://taskvip.onrender.com/api/auth/login
fetch('/api/auth/login', {
  method: 'POST',
  // ...
})
```

---

## 🔄 **Complete Deployment Flow**

### **Step 1: Backend (Already Done ✅)**
- Backend deployed to Render: `https://taskvip.onrender.com`
- Keep-alive system active
- Environment variables configured

### **Step 2: Frontend Deployment**
```bash
# 1. Set environment variable
NEXT_PUBLIC_API_URL=https://taskvip.onrender.com/api

# 2. Deploy to Vercel/Netlify
# Your frontend will be at: https://your-app.vercel.app
```

### **Step 3: Update Backend CORS**
Update `FRONTEND_URL` in Render backend environment:
```env
FRONTEND_URL=https://your-app.vercel.app
```

---

## 🧪 **Testing the Connection**

### **Test Frontend-Backend Connection:**
```bash
# 1. Deploy frontend with correct NEXT_PUBLIC_API_URL
# 2. Visit your frontend URL
# 3. Try to register/login
# 4. Check browser network tab for API calls
# 5. Should see calls to: https://taskvip.onrender.com/api/*
```

### **Common Issues & Solutions:**

#### **🔴 CORS Error**
```
Error: Access to fetch at 'https://taskvip.onrender.com/api/auth/login' 
from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

**Solution:** Update `FRONTEND_URL` in Render backend:
```env
FRONTEND_URL=https://your-app.vercel.app
```

#### **🔴 API Not Found (404)**
```
Error: GET https://your-app.vercel.app/api/auth/login 404 (Not Found)
```

**Solution:** Check `NEXT_PUBLIC_API_URL` is set correctly:
```env
NEXT_PUBLIC_API_URL=https://taskvip.onrender.com/api
```

#### **🔴 Environment Variable Not Working**
**Solution:** Make sure variable name starts with `NEXT_PUBLIC_`:
```env
✅ NEXT_PUBLIC_API_URL=https://taskvip.onrender.com/api
❌ API_URL=https://taskvip.onrender.com/api
```

---

## 📋 **Deployment Checklist**

### **Frontend Deployment:**
- [ ] Frontend built successfully (`npm run build`)
- [ ] Deployed to Vercel/Netlify
- [ ] `NEXT_PUBLIC_API_URL` environment variable set
- [ ] Frontend accessible at public URL

### **Backend Configuration:**
- [ ] `FRONTEND_URL` updated in Render backend
- [ ] CORS configured for frontend domain
- [ ] Backend health check working

### **Integration Testing:**
- [ ] Frontend loads without errors
- [ ] API calls reach backend (check network tab)
- [ ] User registration/login works
- [ ] No CORS errors in console

---

## 🎯 **Expected URLs After Deployment**

```
Backend API: https://taskvip.onrender.com
Frontend:    https://your-app.vercel.app
Health:      https://taskvip.onrender.com/api/health
```

---

## 🚀 **Quick Deploy Commands**

### **Generate Environment Variables:**
```bash
npm run generate-env
```

### **Test Keep-Alive System:**
```bash
npm run test-keep-alive
```

### **Deploy Frontend (Vercel):**
```bash
cd frontend
npx vercel --prod
```

---

## ✅ **Success Indicators**

Your frontend deployment is successful when:
- ✅ Frontend loads at your public URL
- ✅ No console errors about API URLs
- ✅ User can register/login successfully
- ✅ Dashboard loads with data from backend
- ✅ All API calls go to `https://taskvip.onrender.com/api/*`

---

**Your TaskVIP platform will be fully operational once both backend and frontend are deployed with correct environment variables! 🎉**

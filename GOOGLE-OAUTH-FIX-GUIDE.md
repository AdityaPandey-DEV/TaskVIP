# 🔧 Google OAuth Error Fix Guide

## 🚨 **Current Issue**
- **Error**: `500 Internal Server Error` on `/api/auth/google`
- **Cause**: `GOOGLE_CLIENT_ID` environment variable not configured
- **Impact**: Google Sign-In button shows error when clicked

## ✅ **Quick Fix (Disable Google Sign-In Temporarily)**

The Google Sign-In buttons will now show a clear error message instead of crashing. Users can still register/login using email and password.

## 🔐 **Complete Fix (Enable Google OAuth)**

### **Step 1: Get Google OAuth Credentials**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: Create "TaskVIP-OAuth" or select existing
3. **Enable Google+ API**: APIs & Services → Library → Search "Google+ API" → Enable
4. **Configure OAuth Consent Screen**:
   - External user type
   - App name: "TaskVIP"
   - User support email: Your email
   - Scopes: Add `../auth/userinfo.email` and `../auth/userinfo.profile`
5. **Create OAuth 2.0 Credentials**:
   - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs
   - Application type: Web application
   - Name: "TaskVIP Web Client"
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     https://task-vip.vercel.app
     https://your-domain.com
     ```
   - **Authorized redirect URIs**: Same as above
6. **Copy Client ID**: It looks like `123456789-abc...xyz.apps.googleusercontent.com`

### **Step 2: Set Environment Variables**

#### **Backend (.env file)**
```env
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

#### **Frontend (.env.local file)**
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

### **Step 3: Deploy Configuration**

#### **Render (Backend)**
1. Go to Render dashboard → Your service
2. Environment → Add environment variable:
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: Your Google Client ID

#### **Vercel (Frontend)**
1. Go to Vercel dashboard → Your project
2. Settings → Environment Variables → Add:
   - **Name**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - **Value**: Your Google Client ID
   - **Environment**: Production, Preview, Development

### **Step 4: Test Google OAuth**

1. **Local Testing**:
   ```bash
   # Backend
   cd backend
   npm start
   
   # Frontend (new terminal)
   cd frontend
   npm run dev
   ```

2. **Visit**: http://localhost:3000/login
3. **Click**: "Continue with Google"
4. **Expected**: Google OAuth popup appears
5. **Complete**: Sign in with Google account
6. **Result**: Redirected to dashboard

## 🎯 **Current Status**

### ✅ **What Works Now**
- Email/password registration ✅
- Email/password login ✅
- All other app features ✅
- Clear error messages for Google OAuth ✅

### ⚠️ **What Needs Setup**
- Google OAuth credentials
- Environment variables
- Production deployment config

## 🚀 **Alternative: Remove Google Sign-In**

If you don't want to set up Google OAuth, you can remove the Google Sign-In buttons:

### **Remove from Login Page**
```typescript
// Remove this entire section from frontend/app/login/page.tsx
<div className="mt-6">
  <button onClick={handleGoogleSignIn}>
    Continue with Google
  </button>
</div>
```

### **Remove from Register Page**
```typescript
// Remove this entire section from frontend/app/register/page.tsx
<div className="mt-6">
  <button onClick={handleGoogleSignUp}>
    Continue with Google
  </button>
</div>
```

## 📋 **Summary**

**Current State**: Google OAuth shows error but doesn't crash the app
**Email/Password**: Works perfectly ✅
**Next Step**: Either set up Google OAuth credentials OR remove Google Sign-In buttons

The app is fully functional with email/password authentication. Google OAuth is optional! 🎉

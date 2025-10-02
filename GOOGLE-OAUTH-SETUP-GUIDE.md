# 🔐 Google OAuth Setup Guide for TaskVIP

This guide will help you set up Google Sign-In for your TaskVIP application.

## 📋 Prerequisites

- Google Cloud Console account
- TaskVIP project deployed (frontend and backend)

## 🚀 Step-by-Step Setup

### 1. **Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `TaskVIP-OAuth`
4. Click **"Create"**

### 2. **Enable Google+ API**

1. In your Google Cloud project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

### 3. **Configure OAuth Consent Screen**

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (for public app)
3. Fill in the required fields:
   - **App name**: `TaskVIP`
   - **User support email**: Your email
   - **Developer contact information**: Your email
4. Click **"Save and Continue"**
5. **Scopes**: Click **"Add or Remove Scopes"**
   - Add: `../auth/userinfo.email`
   - Add: `../auth/userinfo.profile`
6. Click **"Save and Continue"**
7. **Test users**: Add your email for testing
8. Click **"Save and Continue"**

### 4. **Create OAuth 2.0 Credentials**

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. **Application type**: `Web application`
4. **Name**: `TaskVIP Web Client`
5. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://task-vip.vercel.app
   https://your-custom-domain.com
   ```
6. **Authorized redirect URIs**:
   ```
   http://localhost:3000
   https://task-vip.vercel.app
   https://your-custom-domain.com
   ```
7. Click **"Create"**
8. **Copy the Client ID** (you'll need this for environment variables)

## 🔧 Environment Variables Setup

### **Backend (.env)**
```env
# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

### **Frontend (.env.local)**
```env
# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

## 🌐 Deployment Configuration

### **Vercel (Frontend)**
1. Go to your Vercel project dashboard
2. Go to **"Settings"** → **"Environment Variables"**
3. Add:
   - **Name**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - **Value**: Your Google Client ID
   - **Environment**: Production, Preview, Development

### **Render (Backend)**
1. Go to your Render service dashboard
2. Go to **"Environment"**
3. Add:
   - **Key**: `GOOGLE_CLIENT_ID`
   - **Value**: Your Google Client ID

## 🧪 Testing Google Sign-In

### **Local Testing:**
1. Start your backend: `npm run server`
2. Start your frontend: `npm run client`
3. Go to `http://localhost:3000/login`
4. Click **"Continue with Google"**
5. Sign in with your Google account
6. You should be redirected to the dashboard

### **Production Testing:**
1. Go to your live website
2. Click **"Continue with Google"**
3. Complete the OAuth flow
4. Verify you're logged in and redirected to dashboard

## 🔍 Troubleshooting

### **Common Issues:**

#### **"Error 400: redirect_uri_mismatch"**
- **Solution**: Make sure your domain is added to "Authorized JavaScript origins" and "Authorized redirect URIs" in Google Cloud Console

#### **"Error 403: access_denied"**
- **Solution**: Your app might not be verified. Add your email to "Test users" in OAuth consent screen

#### **"Google Sign-In not available"**
- **Solution**: Check if the Google script is loaded and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set correctly

#### **Backend "Google authentication failed"**
- **Solution**: Verify `GOOGLE_CLIENT_ID` is set in backend environment variables

### **Debug Steps:**
1. Check browser console for JavaScript errors
2. Verify environment variables are set correctly
3. Check network tab for failed API calls
4. Ensure Google Cloud project has correct domains configured

## 📱 Mobile Considerations

Google Sign-In works on mobile browsers, but for better UX:
- Ensure your website is mobile-responsive
- Test on different mobile browsers (Chrome, Safari, Firefox)
- Consider implementing deep linking for mobile apps

## 🔒 Security Best Practices

1. **Never expose Client Secret**: Only use Client ID in frontend
2. **Validate tokens**: Always verify Google tokens on the backend
3. **Use HTTPS**: Ensure your production site uses HTTPS
4. **Regular rotation**: Consider rotating OAuth credentials periodically

## 📊 Analytics & Monitoring

Track Google Sign-In usage:
- Monitor successful/failed Google logins
- Track user acquisition via Google OAuth
- Set up alerts for authentication failures

## 🎯 User Experience Tips

1. **Clear messaging**: "Continue with Google" is clearer than "Sign in with Google"
2. **Loading states**: Show loading spinners during OAuth flow
3. **Error handling**: Provide clear error messages for failed attempts
4. **Fallback**: Always provide email/password option as backup

---

## 🚀 Ready to Go!

Once you've completed this setup:
1. Users can sign in/up with Google in one click
2. No need to remember passwords
3. Faster user onboarding
4. Automatic email verification (Google emails are pre-verified)
5. Better user experience across devices

**Your TaskVIP platform now supports modern, secure Google authentication! 🎉**

*Last Updated: October 2024*

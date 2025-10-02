# 🎬 AdMob Environment Variables Setup

Based on your AdMob account screenshot, here are the environment variables you need to configure:

## 📱 **Your AdMob Details:**
- **App ID**: `ca-app-pub-1881146103066218~5156611105`
- **Rewarded Ad Unit ID**: `ca-app-pub-1881146103066218/5022532125`

## 🔧 **Environment Variables to Set:**

### **Backend (.env file):**
```env
# Google AdMob Configuration
ADMOB_APP_ID=ca-app-pub-1881146103066218~5156611105
ADMOB_PUBLISHER_ID=pub-1881146103066218
ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-1881146103066218/5022532125
```

### **Frontend (.env.local file):**
```env
# Google AdMob Configuration (Frontend)
NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-1881146103066218~5156611105
NEXT_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-1881146103066218/5022532125
```

### **Render Deployment (Environment Variables):**
In your Render dashboard, add these environment variables:
```
ADMOB_APP_ID=ca-app-pub-1881146103066218~5156611105
ADMOB_PUBLISHER_ID=pub-1881146103066218
ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-1881146103066218/5022532125
```

### **Vercel Deployment (Environment Variables):**
In your Vercel dashboard, add these environment variables:
```
NEXT_PUBLIC_ADMOB_APP_ID=ca-app-pub-1881146103066218~5156611105
NEXT_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID=ca-app-pub-1881146103066218/5022532125
```

## 🎯 **Current Status:**
- ✅ **AdMob Account**: Set up correctly
- ✅ **Ad Units Created**: Rewarded video ad unit ready
- ✅ **Mock Video Player**: Working perfectly (as shown in your screenshot)
- ❌ **Environment Variables**: Not configured yet
- ❌ **Real AdMob Integration**: Using mock player currently

## 🚀 **Next Steps:**
1. **Set up environment variables** (above)
2. **Integrate real AdMob SDK** in frontend
3. **Replace mock video player** with actual AdMob ads
4. **Test with AdMob test ads** before going live
5. **Enable real ads** once testing is complete

## 📝 **Note:**
Your current mock video player is working perfectly! The environment variables will be needed when you want to integrate real AdMob video ads instead of the mock player.

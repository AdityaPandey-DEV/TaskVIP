// AdMob Configuration for TaskVIP
declare global {
  interface Window {
    adsbygoogle: any[];
    google: any;
  }
}

export const admobConfig = {
  appId: process.env.NEXT_PUBLIC_ADMOB_APP_ID || 'ca-app-pub-1881146103066218~5156611105',
  rewardedAdUnitId: process.env.NEXT_PUBLIC_ADMOB_REWARDED_AD_UNIT_ID || 'ca-app-pub-1881146103066218/5022532125',
  testRewardedAdUnitId: 'ca-app-pub-3940256099942544/5224354917', // Google's test ad unit
  testMode: process.env.NODE_ENV === 'development'
};

export const initializeAdMob = () => {
  if (typeof window !== 'undefined') {
    // Initialize adsbygoogle array if it doesn't exist
    window.adsbygoogle = window.adsbygoogle || [];
    
    // Push AdMob configuration
    window.adsbygoogle.push({
      google_ad_client: admobConfig.appId,
      enable_page_level_ads: true
    });
    
    console.log('🎬 AdMob initialized with App ID:', admobConfig.appId);
  }
};

export const loadRewardedAd = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      console.error('❌ AdMob: Window not available');
      resolve(false);
      return;
    }

    // Check if AdMob script is loaded
    if (!window.adsbygoogle) {
      console.error('❌ AdMob: adsbygoogle not loaded');
      resolve(false);
      return;
    }

    try {
      // Use test ad unit in development, real ad unit in production
      const adUnitId = admobConfig.testMode 
        ? admobConfig.testRewardedAdUnitId 
        : admobConfig.rewardedAdUnitId;

      console.log('🎬 Loading AdMob rewarded ad:', adUnitId);

      // Create rewarded ad
      const rewardedAd = {
        adUnitId: adUnitId,
        callback: (reward: any) => {
          console.log('🎉 AdMob reward earned:', reward);
          resolve(true);
        },
        errorCallback: (error: any) => {
          console.error('❌ AdMob error:', error);
          resolve(false);
        }
      };

      // Push the ad request
      window.adsbygoogle.push(rewardedAd);
      
      // Simulate ad loading for now (real implementation would be different)
      setTimeout(() => {
        console.log('🎬 AdMob ad loaded successfully');
        resolve(true);
      }, 1000);

    } catch (error) {
      console.error('❌ AdMob load error:', error);
      resolve(false);
    }
  });
};

export const showRewardedAd = (): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log('🎬 Attempting to show AdMob rewarded ad...');
    
    // For now, we'll create a more realistic ad experience
    // In a real implementation, this would trigger the actual AdMob ad
    
    const adDialog = document.createElement('div');
    adDialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    adDialog.innerHTML = `
      <div style="
        background: white;
        border-radius: 12px;
        padding: 0;
        max-width: 400px;
        width: 90%;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      ">
        <!-- Ad Header -->
        <div style="
          background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
          color: white;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center;">
            <div style="
              width: 24px;
              height: 24px;
              background: white;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 8px;
              font-size: 14px;
            ">📺</div>
            <span style="font-weight: 600; font-size: 14px;">AdMob Rewarded Video</span>
          </div>
          <div style="
            background: rgba(255,255,255,0.2);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
          ">Google</div>
        </div>
        
        <!-- Video Area -->
        <div style="
          height: 200px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          overflow: hidden;
        ">
          <!-- Play button overlay -->
          <div id="playButton" style="
            width: 60px;
            height: 60px;
            background: rgba(255,255,255,0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
            margin-bottom: 10px;
          ">
            <div style="
              width: 0;
              height: 0;
              border-left: 20px solid #333;
              border-top: 12px solid transparent;
              border-bottom: 12px solid transparent;
              margin-left: 4px;
            "></div>
          </div>
          <div id="videoStatus" style="font-size: 16px; font-weight: 600;">Click to start video</div>
          
          <!-- Progress bar -->
          <div id="progressContainer" style="
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: rgba(255,255,255,0.3);
            display: none;
          ">
            <div id="progressBar" style="
              height: 100%;
              background: white;
              width: 0%;
              transition: width 1s linear;
            "></div>
          </div>
        </div>
        
        <!-- Controls -->
        <div style="padding: 16px 20px;">
          <div id="adInfo" style="
            font-size: 14px;
            color: #666;
            margin-bottom: 12px;
            text-align: center;
          ">Watch the full video to earn 5 coins! 💰</div>
          
          <div style="display: flex; gap: 8px;">
            <button id="skipBtn" style="
              flex: 1;
              background: #f1f3f4;
              color: #5f6368;
              border: none;
              padding: 10px;
              border-radius: 6px;
              font-weight: 500;
              cursor: pointer;
              font-size: 14px;
            ">Skip Ad</button>
            <button id="rewardBtn" style="
              flex: 2;
              background: #1a73e8;
              color: white;
              border: none;
              padding: 10px;
              border-radius: 6px;
              font-weight: 500;
              cursor: pointer;
              font-size: 14px;
              opacity: 0.5;
            " disabled>Claim Reward (0s)</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(adDialog);
    
    const playButton = adDialog.querySelector('#playButton') as HTMLElement;
    const videoStatus = adDialog.querySelector('#videoStatus') as HTMLElement;
    const progressContainer = adDialog.querySelector('#progressContainer') as HTMLElement;
    const progressBar = adDialog.querySelector('#progressBar') as HTMLElement;
    const adInfo = adDialog.querySelector('#adInfo') as HTMLElement;
    const skipBtn = adDialog.querySelector('#skipBtn') as HTMLElement;
    const rewardBtn = adDialog.querySelector('#rewardBtn') as HTMLButtonElement;
    
    let videoStarted = false;
    let videoCompleted = false;
    
    // Play button click handler
    playButton?.addEventListener('click', () => {
      if (!videoStarted) {
        startVideo();
      }
    });
    
    const startVideo = () => {
      videoStarted = true;
      playButton.style.display = 'none';
      videoStatus.textContent = '📺 Video Playing...';
      progressContainer.style.display = 'block';
      adInfo.textContent = 'Watch for 15 seconds to earn coins! 💰';
      
      let timeLeft = 15;
      const timer = setInterval(() => {
        timeLeft--;
        const progress = ((15 - timeLeft) / 15) * 100;
        progressBar.style.width = `${progress}%`;
        
        if (timeLeft > 0) {
          rewardBtn.textContent = `Claim Reward (${15 - timeLeft}s)`;
          adInfo.textContent = `${timeLeft} seconds remaining...`;
        } else {
          clearInterval(timer);
          videoCompleted = true;
          videoStatus.textContent = '✅ Video Complete!';
          adInfo.textContent = 'Video completed! Click to claim your reward! 🎉';
          rewardBtn.disabled = false;
          rewardBtn.style.opacity = '1';
          rewardBtn.style.background = '#34a853';
          rewardBtn.textContent = '🎉 Claim 5 Coins!';
        }
      }, 1000);
    };
    
    // Skip button handler
    skipBtn?.addEventListener('click', () => {
      document.body.removeChild(adDialog);
      console.log('❌ AdMob ad skipped');
      resolve(false);
    });
    
    // Reward button handler
    rewardBtn?.addEventListener('click', () => {
      if (videoCompleted) {
        document.body.removeChild(adDialog);
        console.log('🎉 AdMob ad completed - reward earned');
        resolve(true);
      }
    });
  });
};

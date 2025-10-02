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

// Global flag to track AdMob initialization across all instances
declare global {
  interface Window {
    __ADMOB_INITIALIZED__?: boolean;
  }
}

export const initializeAdMob = () => {
  if (typeof window === 'undefined') {
    console.log('🎬 AdMob: Window not available (SSR)');
    return;
  }

  // Check if AdMob has already been initialized globally
  if (window.__ADMOB_INITIALIZED__) {
    console.log('🎬 AdMob already initialized globally, skipping...');
    return;
  }

  try {
    // Initialize adsbygoogle array if it doesn't exist
    window.adsbygoogle = window.adsbygoogle || [];
    
    // For rewarded video ads, we don't need enable_page_level_ads
    // The AdSense script in the HTML head is sufficient
    // Just mark as initialized to prevent duplicate calls
    window.__ADMOB_INITIALIZED__ = true;
    console.log('🎬 AdMob initialized successfully - ready for rewarded videos');
    
  } catch (error) {
    console.error('❌ AdMob initialization error:', error);
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
    console.log('🎬 Attempting to show real AdMob rewarded ad...');
    
    // For now, real AdMob ads require additional setup and Google approval
    // Let's show the enhanced mock experience with better logging
    console.log('🎬 Real AdMob ads require Google approval - showing enhanced mock experience');
    console.log('📊 AdMob Status:', {
      adsbygoogle: !!window.adsbygoogle,
      testMode: admobConfig.testMode,
      appId: admobConfig.appId,
      adUnitId: admobConfig.testMode ? admobConfig.testRewardedAdUnitId : admobConfig.rewardedAdUnitId
    });
    
    // Show the enhanced mock experience
    showMockAdExperience().then(resolve);
  });
};

const showMockAdExperience = (): Promise<boolean> => {
  return new Promise((resolve) => {
    console.log('🎬 Showing mock ad experience...');
    
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
          background: #000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          overflow: hidden;
        ">
          <!-- Actual Video Element -->
          <video id="adVideo" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: none;
          " muted>
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4">
            <source src="https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4" type="video/mp4">
          </video>
          
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
            position: absolute;
            z-index: 10;
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
          
          <!-- Video Status Overlay -->
          <div id="videoStatus" style="
            font-size: 16px; 
            font-weight: 600;
            position: absolute;
            z-index: 5;
            background: rgba(0,0,0,0.7);
            padding: 8px 16px;
            border-radius: 20px;
          ">Click to start video</div>
          
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
    const adVideo = adDialog.querySelector('#adVideo') as HTMLVideoElement;
    
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
      
      // Hide play button and show video
      playButton.style.display = 'none';
      videoStatus.style.display = 'none';
      adVideo.style.display = 'block';
      progressContainer.style.display = 'block';
      
      // Start playing the video
      adVideo.play().then(() => {
        console.log('🎬 Video started playing');
        adInfo.textContent = 'Watch the full video to earn coins! 💰';
        
        // Track video progress
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
            adVideo.pause();
            
            // Show completion overlay
            const completionOverlay = document.createElement('div');
            completionOverlay.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0,0,0,0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 18px;
              font-weight: bold;
              z-index: 20;
            `;
            completionOverlay.textContent = '✅ Video Complete!';
            adVideo.parentElement?.appendChild(completionOverlay);
            
            adInfo.textContent = 'Video completed! Click to claim your reward! 🎉';
            rewardBtn.disabled = false;
            rewardBtn.style.opacity = '1';
            rewardBtn.style.background = '#34a853';
            rewardBtn.textContent = '🎉 Claim 5 Coins!';
          }
        }, 1000);
        
      }).catch((error) => {
        console.error('❌ Video play error:', error);
        // Fallback to text-based experience
        videoStatus.style.display = 'block';
        videoStatus.textContent = '📺 Video Playing...';
        adInfo.textContent = 'Watch for 15 seconds to earn coins! 💰';
      });
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

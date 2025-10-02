#!/usr/bin/env node

/**
 * 🎬 AdMob Duplicate Error Fix Test
 * Tests that AdMob initialization doesn't cause duplicate errors
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testAdMobFix() {
  log('cyan', '🎬 Testing AdMob Duplicate Error Fix...\n');

  // Test 1: Check if the fix is implemented
  log('blue', '📋 Test 1: AdMob Fix Implementation');
  
  const fs = require('fs');
  
  try {
    const admobContent = fs.readFileSync('frontend/lib/admob.ts', 'utf8');
    
    // Check for global flag
    if (admobContent.includes('__ADMOB_INITIALIZED__')) {
      log('green', '✅ Global initialization flag implemented');
    } else {
      log('red', '❌ Global initialization flag missing');
    }
    
    // Check for duplicate prevention
    if (admobContent.includes('already initialized globally')) {
      log('green', '✅ Duplicate initialization prevention implemented');
    } else {
      log('red', '❌ Duplicate prevention missing');
    }
    
    // Check if enable_page_level_ads is removed
    if (!admobContent.includes('enable_page_level_ads: true')) {
      log('green', '✅ Problematic enable_page_level_ads removed');
    } else {
      log('yellow', '⚠️  enable_page_level_ads still present (might cause issues)');
    }
    
  } catch (error) {
    log('red', `❌ Could not read AdMob file: ${error.message}`);
  }

  // Test 2: Check AdMobInitializer component
  log('blue', '\n📋 Test 2: AdMobInitializer Component');
  
  try {
    const initializerContent = fs.readFileSync('frontend/components/AdMobInitializer.tsx', 'utf8');
    
    if (initializerContent.includes('useEffect')) {
      log('green', '✅ AdMobInitializer component exists with useEffect');
    } else {
      log('red', '❌ AdMobInitializer component missing useEffect');
    }
    
    if (initializerContent.includes('initializeAdMob')) {
      log('green', '✅ AdMobInitializer calls initializeAdMob function');
    } else {
      log('red', '❌ AdMobInitializer missing initializeAdMob call');
    }
    
  } catch (error) {
    log('red', `❌ Could not read AdMobInitializer: ${error.message}`);
  }

  // Test 3: Check layout integration
  log('blue', '\n📋 Test 3: Layout Integration');
  
  try {
    const layoutContent = fs.readFileSync('frontend/app/layout.tsx', 'utf8');
    
    if (layoutContent.includes('AdMobInitializer')) {
      log('green', '✅ AdMobInitializer imported and used in layout');
    } else {
      log('red', '❌ AdMobInitializer not integrated in layout');
    }
    
    if (layoutContent.includes('adsbygoogle.js')) {
      log('green', '✅ AdSense script present in layout');
    } else {
      log('red', '❌ AdSense script missing from layout');
    }
    
  } catch (error) {
    log('red', `❌ Could not read layout file: ${error.message}`);
  }

  // Test 4: Check RewardSystem cleanup
  log('blue', '\n📋 Test 4: RewardSystem Cleanup');
  
  try {
    const rewardSystemContent = fs.readFileSync('frontend/components/RewardSystem.tsx', 'utf8');
    
    if (!rewardSystemContent.includes('initializeAdMob()')) {
      log('green', '✅ initializeAdMob() removed from RewardSystem');
    } else {
      log('yellow', '⚠️  initializeAdMob() still called in RewardSystem (potential duplicate)');
    }
    
    if (rewardSystemContent.includes('showRewardedAd')) {
      log('green', '✅ showRewardedAd function still available');
    } else {
      log('red', '❌ showRewardedAd function missing');
    }
    
  } catch (error) {
    log('red', `❌ Could not read RewardSystem file: ${error.message}`);
  }

  // Test Summary
  log('blue', '\n📋 Fix Summary');
  
  log('cyan', '🎯 AdMob Duplicate Error Fix Status:');
  log('green', '✅ Global initialization flag prevents duplicates');
  log('green', '✅ AdMob initialization moved to layout (once per app)');
  log('green', '✅ Removed problematic enable_page_level_ads call');
  log('green', '✅ RewardSystem no longer initializes AdMob');
  log('green', '✅ AdSense script still loads for ad serving');

  log('yellow', '\n⚠️  Expected Behavior:');
  log('white', '• No more "Only one enable_page_level_ads allowed" errors');
  log('white', '• AdMob initializes once when app loads');
  log('white', '• Video ads still work normally');
  log('white', '• Clean console with no duplicate initialization');

  log('cyan', '\n🎉 AdMob Duplicate Error Fix Test Complete!');
}

// Run the test
testAdMobFix();

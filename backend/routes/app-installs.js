const express = require('express');
const AppInstall = require('../models/AppInstall');
const AppDatabase = require('../models/AppDatabase');
const User = require('../models/User');
const { MultiLevelReferral } = require('../models/MultiLevelReferral');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get available apps for installation
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { platform = 'android', category = 'all', limit = 20, country = 'US' } = req.query;
    
    // Get apps user hasn't completed recently
    const recentCompletedApps = await AppInstall.find({
      userId,
      status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).distinct('appId');
    
    // Get available apps from database
    const availableApps = await AppDatabase.find({
      status: 'active',
      platform: { $in: [platform, 'both'] },
      appId: { $nin: recentCompletedApps },
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() },
      ...(category !== 'all' && { appCategory: category })
    })
    .sort({ isPromoted: -1, priority: -1, rewardCoins: -1 })
    .limit(parseInt(limit));
    
    // Check for pending installs for each app
    const pendingInstalls = await AppInstall.find({
      userId,
      status: { $in: ['pending', 'installed', 'opened'] }
    }).select('appId status');
    
    const pendingMap = {};
    pendingInstalls.forEach(install => {
      pendingMap[install.appId] = install.status;
    });
    
    // Add pending status to apps
    const appsWithStatus = availableApps.map(app => ({
      ...app.toObject(),
      userStatus: pendingMap[app.appId] || 'available',
      totalReward: app.rewardCoins + (app.promotionBonus || 0)
    }));
    
    res.json({
      success: true,
      data: appsWithStatus,
      count: appsWithStatus.length
    });
  } catch (error) {
    console.error('Get available apps error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get available apps',
      error: error.message
    });
  }
});

// Get promoted apps
router.get('/promoted', authenticateToken, async (req, res) => {
  try {
    const { platform = 'android', limit = 10 } = req.query;
    
    const promotedApps = await AppDatabase.getPromotedApps(platform, parseInt(limit));
    
    res.json({
      success: true,
      data: promotedApps
    });
  } catch (error) {
    console.error('Get promoted apps error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get promoted apps',
      error: error.message
    });
  }
});

// Start app installation task
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { appId, platform = 'android' } = req.body;
    
    if (!appId) {
      return res.status(400).json({
        success: false,
        message: 'App ID is required'
      });
    }
    
    // Get app details from database
    const appData = await AppDatabase.findOne({ 
      appId, 
      status: 'active',
      platform: { $in: [platform, 'both'] }
    });
    
    if (!appData) {
      return res.status(404).json({
        success: false,
        message: 'App not found or not available'
      });
    }
    
    // Check if user already has a pending/active task for this app
    const existingTask = await AppInstall.findOne({
      userId,
      appId,
      status: { $in: ['pending', 'installed', 'opened'] }
    });
    
    if (existingTask) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active task for this app',
        data: existingTask
      });
    }
    
    // Check if user completed this app recently (24 hours cooldown)
    const recentCompletion = await AppInstall.findOne({
      userId,
      appId,
      status: 'completed',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (recentCompletion) {
      return res.status(400).json({
        success: false,
        message: 'You have already completed this app recently. Please wait 24 hours.'
      });
    }
    
    // Create install task
    const installTask = await AppInstall.create({
      userId,
      appId: appData.appId,
      appName: appData.appName,
      appPackage: appData.appPackage,
      appIcon: appData.appIcon,
      appDescription: appData.appDescription,
      appCategory: appData.appCategory,
      appRating: appData.appRating,
      appSize: appData.appSize,
      platform: appData.platform,
      downloadUrl: appData.downloadUrl,
      rewardCoins: appData.rewardCoins + (appData.promotionBonus || 0),
      requiredActions: appData.requiredActions,
      timeRequirements: appData.timeRequirements,
      installStartTime: new Date(),
      metadata: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        sessionId: req.sessionID
      }
    });
    
    // Update app install count
    await AppDatabase.findByIdAndUpdate(appData._id, {
      $inc: { totalInstalls: 1 }
    });
    
    res.json({
      success: true,
      message: 'App installation task started',
      data: {
        taskId: installTask._id,
        appName: installTask.appName,
        appIcon: installTask.appIcon,
        rewardCoins: installTask.rewardCoins,
        downloadUrl: installTask.downloadUrl[platform] || installTask.downloadUrl.android,
        requiredActions: installTask.requiredActions,
        timeRequirements: installTask.timeRequirements,
        expiresAt: installTask.expiresAt
      }
    });
  } catch (error) {
    console.error('Start app install error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start app installation',
      error: error.message
    });
  }
});

// Mark app as installed
router.post('/installed/:taskId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    const { verificationData = {} } = req.body;
    
    const installTask = await AppInstall.findOne({
      _id: taskId,
      userId,
      status: 'pending'
    });
    
    if (!installTask) {
      return res.status(404).json({
        success: false,
        message: 'Install task not found or already processed'
      });
    }
    
    if (installTask.isExpired) {
      await installTask.markFailed('Task expired');
      return res.status(400).json({
        success: false,
        message: 'Install task has expired'
      });
    }
    
    // Mark as installed
    await installTask.markInstalled({
      deviceId: verificationData.deviceId || 'unknown',
      installationId: verificationData.installationId || Date.now().toString(),
      packageVerified: true,
      networkProvider: 'internal'
    });
    
    res.json({
      success: true,
      message: 'App installation confirmed',
      data: {
        status: installTask.status,
        nextStep: 'open_app',
        timeRemaining: installTask.timeRemaining
      }
    });
  } catch (error) {
    console.error('Mark installed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark app as installed',
      error: error.message
    });
  }
});

// Mark app as opened
router.post('/opened/:taskId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    
    const installTask = await AppInstall.findOne({
      _id: taskId,
      userId,
      status: 'installed'
    });
    
    if (!installTask) {
      return res.status(404).json({
        success: false,
        message: 'Install task not found or not in installed state'
      });
    }
    
    if (installTask.isExpired) {
      await installTask.markFailed('Task expired');
      return res.status(400).json({
        success: false,
        message: 'Install task has expired'
      });
    }
    
    // Mark as opened
    await installTask.markOpened();
    
    res.json({
      success: true,
      message: 'App opening confirmed',
      data: {
        status: installTask.status,
        nextStep: 'complete_task',
        timeRemaining: installTask.timeRemaining
      }
    });
  } catch (error) {
    console.error('Mark opened error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark app as opened',
      error: error.message
    });
  }
});

// Complete app installation task
router.post('/complete/:taskId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    
    const installTask = await AppInstall.findOne({
      _id: taskId,
      userId,
      status: 'opened'
    });
    
    if (!installTask) {
      return res.status(404).json({
        success: false,
        message: 'Install task not found or not ready for completion'
      });
    }
    
    if (installTask.isExpired) {
      await installTask.markFailed('Task expired');
      return res.status(400).json({
        success: false,
        message: 'Install task has expired'
      });
    }
    
    // Mark as completed and award coins
    await installTask.markCompleted();
    
    // Update app database stats
    const appData = await AppDatabase.findOne({ appId: installTask.appId });
    if (appData) {
      await appData.incrementSuccessfulInstalls();
    }
    
    // Process referral commissions (small percentage for app installs)
    try {
      await MultiLevelReferral.processCommissions(
        userId,
        Math.round(installTask.rewardCoins * 0.1), // 10% of reward coins for commission calculation
        'app_install',
        installTask._id.toString(),
        {
          appName: installTask.appName,
          appId: installTask.appId,
          rewardCoins: installTask.rewardCoins
        }
      );
    } catch (commissionError) {
      console.error('Error processing app install commissions:', commissionError);
    }
    
    // Get updated user balance
    const user = await User.findById(userId).select('coinBalance');
    
    res.json({
      success: true,
      message: 'App installation completed successfully!',
      data: {
        coinsEarned: installTask.rewardCoins,
        newBalance: user.coinBalance,
        appName: installTask.appName,
        completedAt: installTask.completionTime
      }
    });
  } catch (error) {
    console.error('Complete app install error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete app installation',
      error: error.message
    });
  }
});

// Get user's install tasks
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'all', page = 1, limit = 20 } = req.query;
    
    const skip = (page - 1) * limit;
    const matchQuery = { userId };
    
    if (status !== 'all') {
      matchQuery.status = status;
    }
    
    const tasks = await AppInstall.find(matchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('appName appIcon appCategory rewardCoins status createdAt completionTime expiresAt timeRemaining');
    
    const total = await AppInstall.countDocuments(matchQuery);
    
    // Add virtual fields
    const tasksWithVirtuals = tasks.map(task => ({
      ...task.toObject(),
      timeRemaining: task.timeRemaining,
      isExpired: task.isExpired
    }));
    
    res.json({
      success: true,
      data: {
        tasks: tasksWithVirtuals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get install tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get install tasks',
      error: error.message
    });
  }
});

// Get install statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const stats = await AppInstall.getInstallStats(userId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get install stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get install statistics',
      error: error.message
    });
  }
});

// Cancel install task
router.post('/cancel/:taskId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taskId } = req.params;
    
    const installTask = await AppInstall.findOne({
      _id: taskId,
      userId,
      status: { $in: ['pending', 'installed', 'opened'] }
    });
    
    if (!installTask) {
      return res.status(404).json({
        success: false,
        message: 'Install task not found or cannot be cancelled'
      });
    }
    
    await installTask.markFailed('Cancelled by user');
    
    res.json({
      success: true,
      message: 'Install task cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel install task error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel install task',
      error: error.message
    });
  }
});

// Admin: Seed sample apps
router.post('/admin/seed-apps', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const count = await AppDatabase.seedSampleApps();
    
    res.json({
      success: true,
      message: `Successfully seeded ${count} sample apps`
    });
  } catch (error) {
    console.error('Seed apps error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed sample apps',
      error: error.message
    });
  }
});

// Admin: Cleanup expired tasks
router.post('/admin/cleanup-expired', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const result = await AppInstall.cleanupExpiredTasks();
    
    res.json({
      success: true,
      message: `Cleaned up ${result.modifiedCount} expired tasks`
    });
  } catch (error) {
    console.error('Cleanup expired tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup expired tasks',
      error: error.message
    });
  }
});

// Get app categories
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = [
      { id: 'all', name: 'All Apps', icon: '📱' },
      { id: 'games', name: 'Games', icon: '🎮' },
      { id: 'social', name: 'Social', icon: '👥' },
      { id: 'productivity', name: 'Productivity', icon: '📊' },
      { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
      { id: 'shopping', name: 'Shopping', icon: '🛒' },
      { id: 'finance', name: 'Finance', icon: '💰' },
      { id: 'health', name: 'Health', icon: '🏥' },
      { id: 'education', name: 'Education', icon: '📚' },
      { id: 'travel', name: 'Travel', icon: '✈️' },
      { id: 'other', name: 'Other', icon: '📦' }
    ];
    
    // Get app counts per category
    const categoryCounts = await AppDatabase.aggregate([
      {
        $match: {
          status: 'active',
          validFrom: { $lte: new Date() },
          validUntil: { $gte: new Date() }
        }
      },
      {
        $group: {
          _id: '$appCategory',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const countMap = {};
    categoryCounts.forEach(item => {
      countMap[item._id] = item.count;
    });
    
    const categoriesWithCounts = categories.map(category => ({
      ...category,
      count: category.id === 'all' 
        ? Object.values(countMap).reduce((sum, count) => sum + count, 0)
        : countMap[category.id] || 0
    }));
    
    res.json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

module.exports = router;

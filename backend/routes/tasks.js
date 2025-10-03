const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Credit = require('../models/Credit');
const User = require('../models/User');
const { authenticateToken, requireVip } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/tasks/daily
// @desc    Get daily tasks for user
// @access  Private
router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    
    // Get or create daily tasks
    let dailyTasks = await Task.getDailyTasks(userId, today);
    
    if (dailyTasks.length === 0) {
      dailyTasks = await Task.createDailyTasks(userId);
    }
    
    // Get user's daily credit status
    const user = await User.findById(userId);
    const dailyLimit = user.getDailyCreditLimit();
    const dailyCreditsEarned = user.dailyCreditsEarned;
    const hasReachedDailyLimit = user.hasReachedDailyLimit();
    
    res.json({
      tasks: dailyTasks.map(task => ({
        id: task._id,
        type: task.type,
        title: task.title,
        description: task.description,
        reward: task.reward,
        status: task.status,
        adNetwork: task.adNetwork,
        expiresAt: task.expiresAt,
        isExpired: task.isExpired,
        metadata: task.metadata
      })),
      dailyStatus: {
        limit: dailyLimit,
        earned: dailyCreditsEarned,
        remaining: dailyLimit - dailyCreditsEarned,
        hasReachedLimit: hasReachedDailyLimit
      }
    });

  } catch (error) {
    console.error('Get daily tasks error:', error);
    res.status(500).json({ message: 'Failed to get daily tasks' });
  }
});

// @route   POST /api/tasks/start
// @desc    Start a task
// @access  Private
router.post('/start', authenticateToken, [
  body('taskId').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { taskId } = req.body;
    const userId = req.user._id;

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task belongs to user
    if (task.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if task is already started or completed
    if (task.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Task already started or completed',
        currentStatus: task.status
      });
    }

    // Check if task is expired
    if (task.isExpired) {
      return res.status(400).json({ message: 'Task has expired' });
    }

    // Update task status to in_progress
    task.status = 'in_progress';
    task.startedAt = new Date();
    await task.save();

    // Return task details and any required URLs
    res.json({
      message: 'Task started successfully',
      task: {
        id: task._id,
        title: task.title,
        description: task.description,
        reward: task.reward,
        status: task.status,
        adUrl: task.metadata?.adUrl,
        instructions: task.metadata?.instructions
      }
    });

  } catch (error) {
    console.error('Start task error:', error);
    res.status(500).json({ message: 'Failed to start task' });
  }
});

// @route   POST /api/tasks/complete
// @desc    Complete a task
// @access  Private
router.post('/complete', authenticateToken, [
  body('taskId').isMongoId(),
  body('completionData').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { taskId, completionData } = req.body;
    const userId = req.user._id;

    // Find task
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is already completed
    if (task.status === 'completed' || task.status === 'verified') {
      return res.status(400).json({ message: 'Task already completed' });
    }

    // Check if task is expired
    if (task.isExpired) {
      return res.status(400).json({ message: 'Task has expired' });
    }

    // Check daily limits
    const user = await User.findById(userId);
    await user.updateUserType(); // Update user type based on current status
    
    if (user.hasReachedDailyAdsLimit()) {
      return res.status(400).json({ 
        message: 'Daily ads limit reached',
        dailyAdsLimit: user.getDailyAdsLimit(),
        adsWatched: user.dailyAdsWatched
      });
    }

    if (user.hasReachedDailyEarningLimit()) {
      return res.status(400).json({ 
        message: 'Daily earning limit reached',
        maxDailyEarning: user.getMaxDailyEarning(),
        earned: user.dailyCreditsEarned
      });
    }

    // Mark task as completed
    await task.markCompleted({
      ...completionData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceId: req.headers['x-device-id'] || 'unknown'
    });

    // Calculate reward based on user type and per-ad rate
    const perAdReward = user.getPerAdReward();
    const creditAmount = perAdReward;

    // Create credit entry
    const credit = new Credit({
      userId,
      amount: creditAmount,
      type: 'task_completion',
      source: task.type,
      description: `Completed task: ${task.title}`,
      status: 'vested',
      vestingSchedule: {
        immediate: creditAmount
      },
      vestingProgress: {
        immediate: creditAmount
      },
      isVested: true,
      vestedAt: new Date(),
      relatedTask: task._id,
      metadata: {
        adNetwork: task.adNetwork,
        offerId: task.networkData.offerId,
        completionTime: new Date(),
        verificationData: completionData,
        userType: user.userType,
        perAdReward: perAdReward
      }
    });

    await credit.save();

    // Update task with credit reference
    task.creditId = credit._id;
    task.creditAwarded = creditAmount;
    await task.save();

    // Update user's daily stats
    user.dailyAdsWatched += 1;
    user.dailyCreditsEarned += creditAmount;
    user.totalCredits += creditAmount;
    user.coinBalance += creditAmount;
    
    // Update activity stats (streak, days active)
    user.updateActivityStats();
    
    // Update daily progress percentage
    const dailyLimit = user.getDailyCreditLimit();
    user.dailyProgress = Math.min((user.dailyCreditsEarned / dailyLimit) * 100, 100);
    
    // Update withdrawable credits (only if user has earned enough)
    if (user.totalCredits >= 100) {
      user.withdrawableCredits = user.coinBalance;
    }
    
    await user.save();

    res.json({
      message: 'Task completed successfully',
      task: {
        id: task._id,
        title: task.title,
        reward: creditAmount,
        status: task.status
      },
      credit: {
        id: credit._id,
        amount: creditAmount,
        immediateCredits: creditAmount,
        userType: user.userType,
        perAdReward: perAdReward
      },
      user: {
        totalCredits: user.totalCredits,
        availableCredits: user.coinBalance,
        withdrawableCredits: user.withdrawableCredits,
        dailyCreditsEarned: user.dailyCreditsEarned,
        dailyAdsWatched: user.dailyAdsWatched,
        userType: user.userType,
        dailyAdsLimit: user.getDailyAdsLimit(),
        maxDailyEarning: user.getMaxDailyEarning()
      }
    });

  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: 'Task completion failed' });
  }
});

// @route   POST /api/tasks/verify
// @desc    Verify task completion (for ad networks)
// @access  Private
router.post('/verify', authenticateToken, [
  body('taskId').isMongoId(),
  body('verificationData').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { taskId, verificationData } = req.body;
    const userId = req.user._id;

    // Find task
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is completed
    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Task not completed yet' });
    }

    // Mark task as verified
    await task.markVerified(verificationData);

    // Process credit vesting
    const credit = await Credit.findById(task.creditId);
    if (credit) {
      const vestedAmount = credit.processVesting();
      await credit.save();

      // Update user credits with newly vested amount
      const user = await User.findById(userId);
      user.totalCredits += vestedAmount;
      user.coinBalance += vestedAmount;
      await user.save();
    }

    res.json({
      message: 'Task verified successfully',
      task: {
        id: task._id,
        title: task.title,
        status: task.status,
        verifiedAt: task.verificationStatus.verifiedAt
      }
    });

  } catch (error) {
    console.error('Verify task error:', error);
    res.status(500).json({ message: 'Task verification failed' });
  }
});

// @route   GET /api/tasks/history
// @desc    Get user's task history
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const skip = (page - 1) * limit;
    const userId = req.user._id;

    const query = { userId };
    if (type) query.type = type;
    if (status) query.status = status;

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks: tasks.map(task => ({
        id: task._id,
        type: task.type,
        title: task.title,
        description: task.description,
        reward: task.reward,
        status: task.status,
        creditAwarded: task.creditAwarded,
        completedAt: task.completionData?.completedAt,
        verifiedAt: task.verificationStatus?.verifiedAt,
        createdAt: task.createdAt
      })),
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get task history error:', error);
    res.status(500).json({ message: 'Failed to get task history' });
  }
});

// @route   GET /api/tasks/stats
// @desc    Get user's task statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Task.getTaskStats(userId, start, end);

    res.json({
      period: { start, end },
      stats
    });

  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ message: 'Failed to get task statistics' });
  }
});

// @route   GET /api/tasks/offers
// @desc    Get available offers from ad networks
// @access  Private
router.get('/offers', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Mock offers - in production, this would fetch from real ad networks
    const offers = [
      {
        id: 'offer_1',
        title: 'Complete Survey - Mobile Games',
        description: 'Take a 5-minute survey about mobile gaming preferences',
        reward: 15,
        type: 'survey_completion',
        adNetwork: 'adgate',
        estimatedTime: 5,
        requirements: ['age_18_plus'],
        category: 'surveys'
      },
      {
        id: 'offer_2',
        title: 'Install App - Shopping',
        description: 'Download and open the shopping app',
        reward: 25,
        type: 'app_install',
        adNetwork: 'adscend',
        estimatedTime: 3,
        requirements: ['android_ios'],
        category: 'app_installs'
      },
      {
        id: 'offer_3',
        title: 'Watch Video - Tech Review',
        description: 'Watch a 2-minute tech review video',
        reward: 8,
        type: 'ad_watch',
        adNetwork: 'propellerads',
        estimatedTime: 2,
        requirements: ['stable_internet'],
        category: 'videos'
      }
    ];

    // Filter offers based on user's VIP level
    const filteredOffers = offers.filter(offer => {
      if (user.vipLevel === 0 && offer.reward > 20) return false;
      if (user.vipLevel === 1 && offer.reward > 50) return false;
      return true;
    });

    res.json({
      offers: filteredOffers,
      userVipLevel: user.vipLevel,
      dailyLimit: user.getDailyCreditLimit(),
      dailyCreditsEarned: user.dailyCreditsEarned
    });

  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'Failed to get offers' });
  }
});

// @route   POST /api/tasks/start-offer
// @desc    Start an offer task
// @access  Private
router.post('/start-offer', authenticateToken, [
  body('offerId').notEmpty(),
  body('adNetwork').isIn(['adgate', 'adscend', 'propellerads', 'adsterra'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { offerId, adNetwork } = req.body;
    const userId = req.user._id;

    // Check daily limit
    const user = await User.findById(userId);
    if (user.hasReachedDailyLimit()) {
      return res.status(400).json({ 
        message: 'Daily credit limit reached' 
      });
    }

    // Create task for the offer
    const task = new Task({
      userId,
      type: 'offer_completion',
      title: `Complete Offer: ${offerId}`,
      description: `Complete the offer from ${adNetwork}`,
      reward: 25, // This would be fetched from the ad network
      adNetwork,
      networkData: {
        offerId,
        campaignId: `campaign_${Date.now()}`,
        transactionId: `txn_${Date.now()}`,
        verificationUrl: `https://${adNetwork}.com/verify`,
        callbackUrl: `${process.env.BACKEND_URL}/api/ads/callback/${adNetwork}`
      },
      metadata: {
        category: 'offers',
        difficulty: 'medium',
        estimatedTime: 10,
        requirements: ['offer_completion'],
        tags: ['offers', 'partners']
      }
    });

    await task.save();

    res.json({
      message: 'Offer task started',
      task: {
        id: task._id,
        title: task.title,
        reward: task.reward,
        adNetwork: task.adNetwork,
        networkData: task.networkData
      }
    });

  } catch (error) {
    console.error('Start offer error:', error);
    res.status(500).json({ message: 'Failed to start offer' });
  }
});

module.exports = router;

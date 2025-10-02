const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Coin = require('../models/Coin');
const Offer = require('../models/Offer');
const OfferCompletion = require('../models/OfferCompletion');

const router = express.Router();

// @route   GET /api/rewards/tasks
// @desc    Get available reward tasks for user
// @access  Private
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get today's date for daily limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get user's completions today
    const todayCompletions = await OfferCompletion.find({
      userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Define available tasks based on VIP level and daily limits
    const baseTasks = [
      {
        id: 'admob_video_1',
        type: 'admob_video',
        title: 'Watch Rewarded Video',
        description: 'Watch a short video ad to earn coins',
        coinReward: 5,
        vipMultiplier: getVipMultiplier(user.vipLevel),
        dailyLimit: user.vipLevel >= 1 ? 20 : 10,
        estimatedTime: '30 seconds',
        difficulty: 'easy'
      },
      {
        id: 'cpalead_offer_1',
        type: 'cpalead_offer',
        title: 'Complete App Install',
        description: 'Install and try a new app for 2 minutes',
        coinReward: 150,
        vipMultiplier: getVipMultiplier(user.vipLevel),
        dailyLimit: user.vipLevel >= 2 ? 8 : 5,
        estimatedTime: '3-5 minutes',
        difficulty: 'medium'
      },
      {
        id: 'adgate_survey_1',
        type: 'adgate_survey',
        title: 'Quick Survey',
        description: 'Answer a short survey about your preferences',
        coinReward: 75,
        vipMultiplier: getVipMultiplier(user.vipLevel),
        dailyLimit: user.vipLevel >= 3 ? 10 : 6,
        estimatedTime: '2-3 minutes',
        difficulty: 'easy'
      },
      {
        id: 'daily_bonus',
        type: 'daily_bonus',
        title: 'Daily Check-in Bonus',
        description: 'Claim your daily login bonus',
        coinReward: 25,
        vipMultiplier: getVipMultiplier(user.vipLevel),
        dailyLimit: 1,
        estimatedTime: '1 second',
        difficulty: 'easy'
      }
    ];

    // Calculate completions for each task today
    const tasksWithProgress = baseTasks.map(task => {
      const completedToday = todayCompletions.filter(
        completion => completion.metadata?.taskType === task.type
      ).length;

      return {
        ...task,
        completedToday,
        isAvailable: completedToday < task.dailyLimit,
        actualReward: Math.round(task.coinReward * task.vipMultiplier)
      };
    });

    res.json({
      tasks: tasksWithProgress,
      vipLevel: user.vipLevel,
      vipMultiplier: getVipMultiplier(user.vipLevel)
    });

  } catch (error) {
    console.error('Error fetching reward tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/rewards/complete/:taskId
// @desc    Complete a reward task
// @access  Private
router.post('/complete/:taskId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { taskId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get today's date for daily limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check daily limits
    const todayCompletions = await OfferCompletion.find({
      userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    // Define task details (same as above, could be refactored)
    const taskDefinitions = {
      'admob_video_1': {
        type: 'admob_video',
        coinReward: 5,
        dailyLimit: user.vipLevel >= 1 ? 20 : 10,
        title: 'Watch Rewarded Video'
      },
      'cpalead_offer_1': {
        type: 'cpalead_offer',
        coinReward: 150,
        dailyLimit: user.vipLevel >= 2 ? 8 : 5,
        title: 'Complete App Install'
      },
      'adgate_survey_1': {
        type: 'adgate_survey',
        coinReward: 75,
        dailyLimit: user.vipLevel >= 3 ? 10 : 6,
        title: 'Quick Survey'
      },
      'daily_bonus': {
        type: 'daily_bonus',
        coinReward: 25,
        dailyLimit: 1,
        title: 'Daily Check-in Bonus'
      }
    };

    const taskDef = taskDefinitions[taskId];
    if (!taskDef) {
      return res.status(400).json({ message: 'Invalid task ID' });
    }

    // Check if user has reached daily limit for this task type
    const taskCompletions = todayCompletions.filter(
      completion => completion.metadata?.taskType === taskDef.type
    );

    if (taskCompletions.length >= taskDef.dailyLimit) {
      return res.status(400).json({ message: 'Daily limit reached for this task' });
    }

    // Check daily coin limit
    const todayCoins = await Coin.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: today, $lt: tomorrow },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const dailyEarned = todayCoins[0]?.total || 0;
    const dailyLimit = getDailyLimit(user.vipLevel);
    
    if (dailyEarned >= dailyLimit) {
      return res.status(400).json({ message: 'Daily earning limit reached' });
    }

    // Calculate actual reward with VIP multiplier
    const vipMultiplier = getVipMultiplier(user.vipLevel);
    const actualReward = Math.round(taskDef.coinReward * vipMultiplier);

    // Create offer completion record
    const completion = new OfferCompletion({
      userId,
      offerId: null, // For system tasks
      status: 'completed',
      rewardCoins: actualReward,
      completionTime: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceInfo: {
        platform: 'web',
        source: 'reward_system'
      },
      fraudScore: 0, // System tasks are trusted
      metadata: {
        taskId,
        taskType: taskDef.type,
        taskTitle: taskDef.title,
        vipMultiplier,
        baseReward: taskDef.coinReward
      }
    });

    await completion.save();

    // Create coin transaction
    const coinTransaction = new Coin({
      userId,
      amount: actualReward,
      type: getTransactionType(taskDef.type),
      source: taskDef.type,
      status: 'completed',
      description: `Completed: ${taskDef.title}`,
      externalTransactionId: completion._id.toString(),
      metadata: {
        taskId,
        taskType: taskDef.type,
        vipLevel: user.vipLevel,
        vipMultiplier,
        completionId: completion._id
      }
    });

    await coinTransaction.save();

    // Update user stats
    await User.findByIdAndUpdate(userId, {
      $inc: {
        totalCredits: actualReward,
        availableCredits: actualReward
      },
      lastActivity: new Date()
    });

    res.json({
      success: true,
      coinsEarned: actualReward,
      taskCompleted: taskDef.title,
      vipMultiplier,
      newBalance: (user.availableCredits || 0) + actualReward
    });

  } catch (error) {
    console.error('Error completing reward task:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function getVipMultiplier(vipLevel) {
  switch (vipLevel) {
    case 1: return 1.2;
    case 2: return 1.5;
    case 3: return 2.0;
    default: return 1.0;
  }
}

function getDailyLimit(vipLevel) {
  switch (vipLevel) {
    case 1: return 1500;
    case 2: return 2500;
    case 3: return 5000;
    default: return 1000;
  }
}

function getTransactionType(taskType) {
  switch (taskType) {
    case 'admob_video': return 'earned_admob_video';
    case 'cpalead_offer': return 'earned_cpalead_offer';
    case 'adgate_survey': return 'earned_adgate_offer';
    case 'daily_bonus': return 'earned_daily_bonus';
    default: return 'earned_other';
  }
}

module.exports = router;

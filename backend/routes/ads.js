const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Credit = require('../models/Credit');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/ads/networks
// @desc    Get available ad networks
// @access  Private
router.get('/networks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Mock ad networks - in production, this would fetch from real APIs
    const networks = [
      {
        id: 'propellerads',
        name: 'PropellerAds',
        description: 'High-quality video and display ads',
        types: ['video', 'display', 'native'],
        minReward: 5,
        maxReward: 50,
        estimatedTime: '2-5 minutes',
        requirements: ['stable_internet', 'age_18_plus'],
        isActive: true,
        icon: 'play-circle'
      },
      {
        id: 'adsterra',
        name: 'Adsterra',
        description: 'Premium video and banner ads',
        types: ['video', 'banner', 'popup'],
        minReward: 3,
        maxReward: 30,
        estimatedTime: '1-3 minutes',
        requirements: ['stable_internet'],
        isActive: true,
        icon: 'tv'
      },
      {
        id: 'adgate',
        name: 'AdGate Media',
        description: 'Surveys and app installs',
        types: ['survey', 'app_install', 'offer'],
        minReward: 10,
        maxReward: 100,
        estimatedTime: '5-15 minutes',
        requirements: ['age_18_plus', 'android_ios'],
        isActive: true,
        icon: 'clipboard-list'
      },
      {
        id: 'adscend',
        name: 'Adscend Media',
        description: 'Offers and surveys',
        types: ['offer', 'survey', 'app_install'],
        minReward: 8,
        maxReward: 80,
        estimatedTime: '3-10 minutes',
        requirements: ['age_18_plus'],
        isActive: true,
        icon: 'gift'
      }
    ];

    // Filter networks based on user's VIP level
    const filteredNetworks = networks.filter(network => {
      if (user.vipLevel === 0 && network.maxReward > 20) return false;
      if (user.vipLevel === 1 && network.maxReward > 50) return false;
      return true;
    });

    res.json({
      networks: filteredNetworks,
      userVipLevel: user.vipLevel,
      dailyLimit: user.getDailyCreditLimit(),
      dailyCreditsEarned: user.dailyCreditsEarned
    });

  } catch (error) {
    console.error('Get ad networks error:', error);
    res.status(500).json({ message: 'Failed to get ad networks' });
  }
});

// @route   GET /api/ads/offers/:networkId
// @desc    Get offers from specific ad network
// @access  Private
router.get('/offers/:networkId', authenticateToken, async (req, res) => {
  try {
    const { networkId } = req.params;
    const userId = req.user._id;

    // Check if network is valid
    const validNetworks = ['propellerads', 'adsterra', 'adgate', 'adscend'];
    if (!validNetworks.includes(networkId)) {
      return res.status(400).json({ message: 'Invalid ad network' });
    }

    // Mock offers - in production, this would fetch from real ad network APIs
    const mockOffers = {
      propellerads: [
        {
          id: 'prop_1',
          title: 'Watch Tech Review Video',
          description: 'Watch a 2-minute tech review video',
          reward: 8,
          type: 'video',
          estimatedTime: 2,
          requirements: ['stable_internet'],
          category: 'technology'
        },
        {
          id: 'prop_2',
          title: 'Gaming App Ad',
          description: 'Watch a gaming app advertisement',
          reward: 5,
          type: 'video',
          estimatedTime: 1,
          requirements: ['stable_internet'],
          category: 'gaming'
        }
      ],
      adsterra: [
        {
          id: 'adsterra_1',
          title: 'Fashion Brand Video',
          description: 'Watch a fashion brand advertisement',
          reward: 6,
          type: 'video',
          estimatedTime: 2,
          requirements: ['stable_internet'],
          category: 'fashion'
        },
        {
          id: 'adsterra_2',
          title: 'Food Delivery Banner',
          description: 'View food delivery banner ad',
          reward: 3,
          type: 'banner',
          estimatedTime: 1,
          requirements: ['stable_internet'],
          category: 'food'
        }
      ],
      adgate: [
        {
          id: 'adgate_1',
          title: 'Mobile Gaming Survey',
          description: 'Complete a 5-minute survey about mobile gaming',
          reward: 25,
          type: 'survey',
          estimatedTime: 5,
          requirements: ['age_18_plus'],
          category: 'gaming'
        },
        {
          id: 'adgate_2',
          title: 'Shopping App Install',
          description: 'Install and open the shopping app',
          reward: 30,
          type: 'app_install',
          estimatedTime: 3,
          requirements: ['android_ios'],
          category: 'shopping'
        }
      ],
      adscend: [
        {
          id: 'adscend_1',
          title: 'Lifestyle Survey',
          description: 'Complete a lifestyle preferences survey',
          reward: 20,
          type: 'survey',
          estimatedTime: 4,
          requirements: ['age_18_plus'],
          category: 'lifestyle'
        },
        {
          id: 'adscend_2',
          title: 'Finance App Offer',
          description: 'Sign up for a finance app offer',
          reward: 50,
          type: 'offer',
          estimatedTime: 8,
          requirements: ['age_18_plus', 'kyc_verified'],
          category: 'finance'
        }
      ]
    };

    const offers = mockOffers[networkId] || [];

    res.json({
      networkId,
      offers,
      totalOffers: offers.length
    });

  } catch (error) {
    console.error('Get ad network offers error:', error);
    res.status(500).json({ message: 'Failed to get ad network offers' });
  }
});

// @route   POST /api/ads/start/:networkId/:offerId
// @desc    Start an ad/offer task
// @access  Private
router.post('/start/:networkId/:offerId', authenticateToken, async (req, res) => {
  try {
    const { networkId, offerId } = req.params;
    const userId = req.user._id;

    // Check if network is valid
    const validNetworks = ['propellerads', 'adsterra', 'adgate', 'adscend'];
    if (!validNetworks.includes(networkId)) {
      return res.status(400).json({ message: 'Invalid ad network' });
    }

    // Check daily limit
    const user = await User.findById(userId);
    if (user.hasReachedDailyLimit()) {
      return res.status(400).json({ 
        message: 'Daily credit limit reached',
        dailyLimit: user.getDailyCreditLimit(),
        earned: user.dailyCreditsEarned
      });
    }

    // Create task for the ad/offer
    const task = new Task({
      userId,
      type: networkId === 'adgate' || networkId === 'adscend' ? 'offer_completion' : 'ad_watch',
      title: `Complete ${networkId} offer: ${offerId}`,
      description: `Complete the offer from ${networkId}`,
      reward: 10, // This would be fetched from the ad network
      adNetwork: networkId,
      networkData: {
        offerId,
        campaignId: `campaign_${Date.now()}`,
        transactionId: `txn_${Date.now()}`,
        verificationUrl: `https://${networkId}.com/verify`,
        callbackUrl: `${process.env.BACKEND_URL}/api/ads/callback/${networkId}`
      },
      metadata: {
        category: 'advertising',
        difficulty: 'easy',
        estimatedTime: 3,
        requirements: ['stable_internet'],
        tags: ['ads', 'offers', networkId]
      }
    });

    await task.save();

    res.json({
      message: 'Ad/offer task started',
      task: {
        id: task._id,
        title: task.title,
        reward: task.reward,
        adNetwork: task.adNetwork,
        networkData: task.networkData,
        expiresAt: task.expiresAt
      }
    });

  } catch (error) {
    console.error('Start ad/offer error:', error);
    res.status(500).json({ message: 'Failed to start ad/offer' });
  }
});

// @route   POST /api/ads/callback/:networkId
// @desc    Handle ad network callbacks
// @access  Public
router.post('/callback/:networkId', async (req, res) => {
  try {
    const { networkId } = req.params;
    const callbackData = req.body;

    // Validate callback signature (in production)
    // const isValidSignature = validateCallbackSignature(networkId, callbackData);
    // if (!isValidSignature) {
    //   return res.status(400).json({ message: 'Invalid callback signature' });
    // }

    // Find the task
    const task = await Task.findOne({
      'networkData.transactionId': callbackData.transaction_id,
      adNetwork: networkId
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is already completed
    if (task.status === 'verified') {
      return res.json({ message: 'Task already verified' });
    }

    // Mark task as verified
    await task.markVerified(callbackData);

    // Process credit vesting
    const credit = await Credit.findById(task.creditId);
    if (credit) {
      const vestedAmount = credit.processVesting();
      await credit.save();

      // Update user credits with newly vested amount
      const user = await User.findById(task.userId);
      user.totalCredits += vestedAmount;
      user.availableCredits += vestedAmount;
      await user.save();
    }

    res.json({ message: 'Callback processed successfully' });

  } catch (error) {
    console.error('Ad network callback error:', error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
});

// @route   GET /api/ads/verify/:taskId
// @desc    Verify ad completion
// @access  Private
router.get('/verify/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;

    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is completed
    if (task.status !== 'completed') {
      return res.status(400).json({ message: 'Task not completed yet' });
    }

    // Mock verification - in production, this would call the ad network's verification API
    const verificationResult = {
      isVerified: true,
      verificationData: {
        network: task.adNetwork,
        offerId: task.networkData.offerId,
        transactionId: task.networkData.transactionId,
        verifiedAt: new Date(),
        reward: task.reward
      }
    };

    if (verificationResult.isVerified) {
      await task.markVerified(verificationResult.verificationData);

      // Process credit vesting
      const credit = await Credit.findById(task.creditId);
      if (credit) {
        const vestedAmount = credit.processVesting();
        await credit.save();

        // Update user credits
        const user = await User.findById(userId);
        user.totalCredits += vestedAmount;
        user.availableCredits += vestedAmount;
        await user.save();
      }
    }

    res.json({
      message: 'Ad verification completed',
      task: {
        id: task._id,
        title: task.title,
        status: task.status,
        verifiedAt: task.verificationStatus?.verifiedAt
      },
      verification: verificationResult
    });

  } catch (error) {
    console.error('Verify ad completion error:', error);
    res.status(500).json({ message: 'Ad verification failed' });
  }
});

// @route   GET /api/ads/statistics
// @desc    Get ad statistics for user
// @access  Private
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user._id;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get ad completion statistics
    const adStats = await Task.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: { $in: ['ad_watch', 'offer_completion'] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: '$adNetwork',
          totalTasks: { $sum: 1 },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          verifiedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'verified'] }, 1, 0] }
          },
          totalRewards: { $sum: '$reward' },
          totalCreditsEarned: { $sum: '$creditAwarded' }
        }
      },
      { $sort: { totalRewards: -1 } }
    ]);

    // Get daily ad earnings
    const dailyEarnings = await Task.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: { $in: ['ad_watch', 'offer_completion'] },
          status: 'verified',
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalEarnings: { $sum: '$creditAwarded' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      period: { start, end },
      adStats,
      dailyEarnings
    });

  } catch (error) {
    console.error('Get ad statistics error:', error);
    res.status(500).json({ message: 'Failed to get ad statistics' });
  }
});

module.exports = router;

const express = require('express');
const { body, validationResult } = require('express-validator');
const Offer = require('../models/Offer');
const OfferCompletion = require('../models/OfferCompletion');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/offers
// @desc    Get available offers for user
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, type, limit = 20, page = 1 } = req.query;
    
    const filters = {
      category,
      type,
      limit: parseInt(limit)
    };
    
    const offers = await Offer.getOffersForUser(req.user._id, filters);
    
    // Get user's progress on these offers
    const offerIds = offers.map(offer => offer._id);
    const userProgress = await OfferCompletion.find({
      userId: req.user._id,
      offerId: { $in: offerIds }
    }).select('offerId status createdAt');
    
    const offersWithProgress = offers.map(offer => {
      const progress = userProgress.find(p => p.offerId.equals(offer._id));
      return {
        ...offer.toObject(),
        userProgress: progress ? {
          status: progress.status,
          startedAt: progress.createdAt
        } : null
      };
    });
    
    res.json({
      offers: offersWithProgress,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: offers.length
      }
    });
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'Failed to get offers' });
  }
});

// @route   GET /api/offers/trending
// @desc    Get trending offers
// @access  Private
router.get('/trending', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const trendingOffers = await Offer.getTrendingOffers(parseInt(limit));
    
    res.json({
      offers: trendingOffers
    });
  } catch (error) {
    console.error('Get trending offers error:', error);
    res.status(500).json({ message: 'Failed to get trending offers' });
  }
});

// @route   GET /api/offers/categories
// @desc    Get offer categories with counts
// @access  Private
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await Offer.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          avgReward: { $avg: { $avg: ['$coinReward.min', '$coinReward.max'] } },
          types: { $addToSet: '$type' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      categories: categories.map(cat => ({
        name: cat._id,
        count: cat.count,
        avgReward: Math.round(cat.avgReward),
        types: cat.types
      }))
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Failed to get categories' });
  }
});

// @route   POST /api/offers/:offerId/start
// @desc    Start an offer
// @access  Private
router.post('/:offerId/start', authenticateToken, async (req, res) => {
  try {
    const { offerId } = req.params;
    
    const completion = await OfferCompletion.startOffer(
      req.user._id,
      offerId,
      {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deviceId: req.headers['x-device-id'] || 'unknown',
        referrer: req.get('Referer')
      }
    );
    
    const offer = await Offer.findById(offerId);
    
    res.json({
      message: 'Offer started successfully',
      completion: {
        id: completion._id,
        clickId: completion.clickId,
        startedAt: completion.conversionData.startedAt
      },
      offer: {
        id: offer._id,
        title: offer.title,
        clickUrl: offer.clickUrl,
        estimatedTime: offer.estimatedTime,
        coinReward: offer.coinReward
      }
    });
  } catch (error) {
    console.error('Start offer error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/offers/complete
// @desc    Complete an offer (webhook from ad networks)
// @access  Public (but with verification)
router.post('/complete', [
  body('clickId').notEmpty().trim(),
  body('coinsEarned').isInt({ min: 1, max: 1000 }),
  body('externalTransactionId').optional().trim(),
  body('network').isIn(['admob', 'cpalead', 'adgate', 'adscend', 'ayetstudios', 'offertoro'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { clickId, coinsEarned, externalTransactionId, network } = req.body;
    
    // Find completion by clickId
    const completion = await OfferCompletion.findOne({ clickId });
    if (!completion) {
      return res.status(404).json({ message: 'Completion not found' });
    }
    
    // Verify network matches
    if (completion.network !== network) {
      return res.status(400).json({ message: 'Network mismatch' });
    }
    
    const updatedCompletion = await OfferCompletion.completeOffer(
      completion._id,
      coinsEarned,
      externalTransactionId
    );
    
    res.json({
      message: 'Offer completed successfully',
      completion: {
        id: updatedCompletion._id,
        status: updatedCompletion.status,
        coinsEarned: updatedCompletion.coinsEarned,
        fraudScore: updatedCompletion.fraudCheck.score
      }
    });
  } catch (error) {
    console.error('Complete offer error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/offers/my-completions
// @desc    Get user's offer completions
// @access  Private
router.get('/my-completions', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    
    const query = { userId: req.user._id };
    if (status) query.status = status;
    
    const completions = await OfferCompletion.find(query)
      .populate('offerId', 'title type coinReward imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await OfferCompletion.countDocuments(query);
    
    res.json({
      completions: completions.map(completion => ({
        id: completion._id,
        offer: {
          title: completion.offerId.title,
          type: completion.offerId.type,
          imageUrl: completion.offerId.imageUrl
        },
        status: completion.status,
        coinsEarned: completion.coinsEarned,
        startedAt: completion.conversionData.startedAt,
        completedAt: completion.conversionData.completedAt,
        rating: completion.rating
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get completions error:', error);
    res.status(500).json({ message: 'Failed to get completions' });
  }
});

// @route   POST /api/offers/:completionId/rate
// @desc    Rate a completed offer
// @access  Private
router.post('/:completionId/rate', authenticateToken, [
  body('rating').isInt({ min: 1, max: 5 }),
  body('feedback').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { completionId } = req.params;
    const { rating, feedback } = req.body;
    
    const completion = await OfferCompletion.findOne({
      _id: completionId,
      userId: req.user._id,
      status: 'completed'
    });
    
    if (!completion) {
      return res.status(404).json({ message: 'Completion not found or not completed' });
    }
    
    completion.rating = rating;
    if (feedback) completion.feedback = feedback;
    await completion.save();
    
    res.json({
      message: 'Rating submitted successfully',
      rating,
      feedback
    });
  } catch (error) {
    console.error('Rate offer error:', error);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

module.exports = router;

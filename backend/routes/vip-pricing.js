const express = require('express');
const { body, validationResult } = require('express-validator');
const VipPricing = require('../models/VipPricing');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/admin/vip-pricing
// @desc    Get all VIP pricing plans
// @access  Admin
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const pricing = await VipPricing.find().sort({ sortOrder: 1, level: 1 });
    
    res.json({
      success: true,
      pricing
    });
  } catch (error) {
    console.error('Get VIP pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VIP pricing'
    });
  }
});

// @route   GET /api/admin/vip-pricing/:level
// @desc    Get specific VIP pricing plan
// @access  Admin
router.get('/:level', authenticateAdmin, async (req, res) => {
  try {
    const { level } = req.params;
    const pricing = await VipPricing.findOne({ level: parseInt(level) });
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'VIP pricing plan not found'
      });
    }
    
    res.json({
      success: true,
      pricing
    });
  } catch (error) {
    console.error('Get VIP pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VIP pricing'
    });
  }
});

// @route   POST /api/admin/vip-pricing
// @desc    Create new VIP pricing plan
// @access  Admin
router.post('/', authenticateAdmin, [
  body('level').isInt({ min: 0, max: 3 }).withMessage('Invalid VIP level'),
  body('name').notEmpty().withMessage('Name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  body('dailyCreditLimitMultiplier').isFloat({ min: 1 }).withMessage('Daily credit limit multiplier must be at least 1'),
  body('referralBonusMultiplier').isFloat({ min: 1 }).withMessage('Referral bonus multiplier must be at least 1'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      level,
      name,
      price,
      currency = 'INR',
      duration = 30,
      dailyCreditLimitMultiplier,
      referralBonusMultiplier,
      exclusiveOffers = false,
      description,
      features = [],
      isActive = true,
      sortOrder = level
    } = req.body;

    // Check if level already exists
    const existingPricing = await VipPricing.findOne({ level });
    if (existingPricing) {
      return res.status(400).json({
        success: false,
        message: 'VIP pricing plan for this level already exists'
      });
    }

    const pricing = new VipPricing({
      level,
      name,
      price,
      currency,
      duration,
      dailyCreditLimitMultiplier,
      referralBonusMultiplier,
      exclusiveOffers,
      description,
      features,
      isActive,
      sortOrder,
      createdBy: req.user.id,
      lastUpdatedBy: req.user.id
    });

    await pricing.save();

    res.status(201).json({
      success: true,
      message: 'VIP pricing plan created successfully',
      pricing
    });
  } catch (error) {
    console.error('Create VIP pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create VIP pricing plan'
    });
  }
});

// @route   PUT /api/admin/vip-pricing/:level
// @desc    Update VIP pricing plan
// @access  Admin
router.put('/:level', authenticateAdmin, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  body('dailyCreditLimitMultiplier').optional().isFloat({ min: 1 }).withMessage('Daily credit limit multiplier must be at least 1'),
  body('referralBonusMultiplier').optional().isFloat({ min: 1 }).withMessage('Referral bonus multiplier must be at least 1'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { level } = req.params;
    const updateData = {
      ...req.body,
      lastUpdatedBy: req.user.id
    };

    const pricing = await VipPricing.findOneAndUpdate(
      { level: parseInt(level) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'VIP pricing plan not found'
      });
    }

    res.json({
      success: true,
      message: 'VIP pricing plan updated successfully',
      pricing
    });
  } catch (error) {
    console.error('Update VIP pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update VIP pricing plan'
    });
  }
});

// @route   DELETE /api/admin/vip-pricing/:level
// @desc    Delete VIP pricing plan
// @access  Admin
router.delete('/:level', authenticateAdmin, async (req, res) => {
  try {
    const { level } = req.params;
    
    // Don't allow deleting level 0 (Free plan)
    if (parseInt(level) === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete Free plan'
      });
    }

    const pricing = await VipPricing.findOneAndDelete({ level: parseInt(level) });

    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'VIP pricing plan not found'
      });
    }

    res.json({
      success: true,
      message: 'VIP pricing plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete VIP pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete VIP pricing plan'
    });
  }
});

// @route   POST /api/admin/vip-pricing/initialize
// @desc    Initialize default VIP pricing
// @access  Admin
router.post('/initialize', authenticateAdmin, async (req, res) => {
  try {
    const pricing = await VipPricing.initializeDefaultPricing(req.user.id);
    
    res.json({
      success: true,
      message: 'Default VIP pricing initialized successfully',
      pricing
    });
  } catch (error) {
    console.error('Initialize VIP pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize VIP pricing'
    });
  }
});

// @route   PUT /api/admin/vip-pricing/:level/toggle
// @desc    Toggle VIP pricing plan active status
// @access  Admin
router.put('/:level/toggle', authenticateAdmin, async (req, res) => {
  try {
    const { level } = req.params;
    
    // Don't allow deactivating level 0 (Free plan)
    if (parseInt(level) === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate Free plan'
      });
    }

    const pricing = await VipPricing.findOne({ level: parseInt(level) });
    
    if (!pricing) {
      return res.status(404).json({
        success: false,
        message: 'VIP pricing plan not found'
      });
    }

    pricing.isActive = !pricing.isActive;
    pricing.lastUpdatedBy = req.user.id;
    await pricing.save();

    res.json({
      success: true,
      message: `VIP pricing plan ${pricing.isActive ? 'activated' : 'deactivated'} successfully`,
      pricing
    });
  } catch (error) {
    console.error('Toggle VIP pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle VIP pricing plan'
    });
  }
});

module.exports = router;

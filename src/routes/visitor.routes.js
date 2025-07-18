const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, checkRole } = require('../middleware/auth.middleware');
const Visitor = require('../models/visitor.model');
const User = require('../models/user.model');
const { generateQRCode, validateQRCode } = require('../utils/qrcode.utils');
const { sendEmail } = require('../utils/email.utils');

/**
 * @swagger
 * /api/visitors:
 *   post:
 *     summary: Create a new visitor record
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Visitor'
 *     responses:
 *       201:
 *         description: Visitor record created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, checkRole(['visitor', 'admin']), [
  body('purpose').notEmpty().withMessage('Purpose is required'),
  body('visitDate').isISO8601().withMessage('Valid visit date is required'),
  body('expectedDuration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
  body('company').optional().trim(),
  body('notes').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const visitorData = {
      user: req.user._id,
      ...req.body
    };

    // Generate QR code
    const qrResult = await generateQRCode(req.user._id, req.body.visitDate);
    if (!qrResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error generating QR code'
      });
    }

    visitorData.qrCode = qrResult.qrData;
    visitorData.qrCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const visitor = new Visitor(visitorData);
    await visitor.save();

    // Send QR code email
    if (req.user.notificationPreferences?.email) {
      await sendEmail(
        req.user.email,
        'visitorQRCode',
        {
          visitorName: `${req.user.firstName} ${req.user.lastName}`,
          qrCodeUrl: qrResult.qrCodeUrl
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Visitor record created successfully',
      data: visitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating visitor record',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/visitors:
 *   get:
 *     summary: Get all visitor records (admin only)
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all visitor records
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', auth, checkRole(['admin']), async (req, res) => {
  try {
    const visits = await Visitor.find()
      .sort({ visitDate: -1 })
      .populate('user', 'firstName lastName email')
      .populate('host', 'firstName lastName email');

    res.json({
      success: true,
      data: visits
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching visitor records',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/visitors/check-in:
 *   post:
 *     summary: Check in a visitor using QR code
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *             properties:
 *               qrCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-in successful
 *       400:
 *         description: Invalid QR code
 *       401:
 *         description: Unauthorized
 */
router.post('/check-in', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { qrCode } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({
        success: false,
        message: 'QR code is required'
      });
    }

    const validationResult = validateQRCode(qrCode);

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message
      });
    }

    let visitor = await Visitor.findOne({
      user: validationResult.data.visitorId,
      status: 'scheduled'
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor record not found'
      });
    }

    visitor.status = 'checked-in';
    visitor.checkInTime = new Date();
    await visitor.save();

    // Generate new QR code for check-out
    const qrResult = await generateQRCode(visitor.user, visitor.visitDate);
    if (qrResult.success) {
      visitor.qrCode = qrResult.qrData;
      visitor.qrCodeExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await visitor.save();

      // Send new QR code email
      const userDoc = await User.findById(visitor.user);
      if (userDoc && userDoc.notificationPreferences?.email) {
        await sendEmail(
          userDoc.email,
          'visitorQRCode',
          {
            visitorName: `${userDoc.firstName} ${userDoc.lastName}`,
            qrCodeUrl: qrResult.qrCodeUrl
          }
        );
      }
    }

    // Populate user and host fields for the response
    visitor = await Visitor.findById(visitor._id)
      .populate('user', 'firstName lastName email phone photo')
      .populate('host', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Visitor checked in successfully',
      data: visitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking in visitor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/visitors/check-out:
 *   post:
 *     summary: Check out a visitor using QR code
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *             properties:
 *               qrCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-out successful
 *       400:
 *         description: Invalid QR code
 *       401:
 *         description: Unauthorized
 */
router.post('/check-out/:qrCode', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { qrCode } = req.params;
    const validationResult = validateQRCode(qrCode);

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        message: validationResult.message
      });
    }

    const visitor = await Visitor.findOne({
      user: validationResult.data.visitorId,
      status: 'checked-in'
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor record not found or not checked in'
      });
    }

    visitor.status = 'checked-out';
    visitor.checkOutTime = new Date();
    await visitor.save();

    res.json({
      success: true,
      message: 'Visitor checked out successfully',
      data: visitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking out visitor',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/visitors/scan:
 *   post:
 *     summary: Get visitor details from QR code (admin only)
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qrCode
 *             properties:
 *               qrCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visitor details retrieved successfully
 *       400:
 *         description: Invalid QR code
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Visitor record not found
 */
router.post('/scan', auth, checkRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { qrCode } = req.body;
    if (!qrCode) {
      return res.status(400).json({ success: false, message: 'QR code is required' });
    }
    const validationResult = validateQRCode(qrCode);
    if (!validationResult.valid) {
      return res.status(400).json({ success: false, message: validationResult.message });
    }
    const { visitorId, visitDate } = validationResult.data;
    // Find the visit by visitorId and visitDate
    const visit = await Visitor.findOne({
      user: visitorId,
      visitDate: new Date(visitDate)
    })
      .populate('user', 'firstName lastName email phone')
      .populate('host', 'firstName lastName email');
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visitor record not found' });
    }
    res.json({
      success: true,
      data: visit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching visitor details', error: error.message });
  }
});

/**
 * @swagger
 * /api/visitors/preferences:
 *   patch:
 *     summary: Update visitor preferences
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notifications:
 *                 type: object
 *                 properties:
 *                   email:
 *                     type: boolean
 *                   sms:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch('/preferences', auth, checkRole(['visitor']), async (req, res) => {
  try {
    const { notificationPreferences } = req.body;
    
    const visitor = await Visitor.findOne({ user: req.user._id });
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Visitor record not found'
      });
    }

    visitor.notificationPreferences = {
      ...visitor.notificationPreferences,
      ...notificationPreferences
    };

    await visitor.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: visitor.notificationPreferences
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/visitors/my-visits:
 *   get:
 *     summary: Get visitor's visit details including QR codes
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of visitor's visits with QR codes
 *       401:
 *         description: Unauthorized
 */
router.get('/my-visits', auth, checkRole(['visitor']), async (req, res) => {
  try {
    const visits = await Visitor.find({ user: req.user._id })
      .sort({ visitDate: -1 })
      .select('visitDate status qrCode qrCodeExpiry purpose expectedDuration company notes checkInTime checkOutTime')
      .populate('host', 'firstName lastName email');

    // Filter and format the visits
    const formattedVisits = visits.map(visit => ({
      ...visit.toObject(),
      isUpcoming: visit.visitDate > new Date() && visit.status === 'scheduled',
      isActive: visit.status === 'checked-in',
      isCompleted: visit.status === 'checked-out'
    }));

    res.json({
      success: true,
      data: {
        upcomingVisits: formattedVisits.filter(v => v.isUpcoming),
        activeVisits: formattedVisits.filter(v => v.isActive),
        completedVisits: formattedVisits.filter(v => v.isCompleted)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching visitor details',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/visitors/summary:
 *   get:
 *     summary: Get visitor summary
 *     description: Retrieve a summary of visitor activities and statistics
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visitor summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVisitors:
 *                       type: number
 *                       example: 100
 *                     activeVisitors:
 *                       type: number
 *                       example: 50
 *                     pendingVisitors:
 *                       type: number
 *                       example: 20
 *                     checkedOutVisitors:
 *                       type: number
 *                       example: 30
 *                     upcomingVisits:
 *                       type: number
 *                       example: 10
 *                     completedVisits:
 *                       type: number
 *                       example: 30
 *                     totalVisits:
 *                       type: number
 *                       example: 40
 *                     qrCodeStats:
 *                       type: object
 *                       properties:
 *                         validQRCodes:
 *                           type: number
 *                           example: 50
 *                         expiredQRCodes:
 *                           type: number
 *                           example: 10
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/summary', auth, async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const activeVisitors = await Visitor.countDocuments({ status: 'checked-in' });
    const pendingVisitors = await Visitor.countDocuments({ status: 'pending' });
    const checkedOutVisitors = await Visitor.countDocuments({ status: 'checked-out' });
    const upcomingVisits = await Visitor.countDocuments({ status: 'scheduled', visitDate: { $gt: new Date() } });
    const completedVisits = await Visitor.countDocuments({ status: 'checked-out' });
    const totalVisits = totalVisitors;

    // Get QR code statistics
    const validQRCodes = await Visitor.countDocuments({
      qrCodeExpiry: { $gt: new Date() }
    });

    res.json({
      success: true,
      data: {
        totalVisitors,
        activeVisitors,
        pendingVisitors,
        checkedOutVisitors,
        upcomingVisits,
        completedVisits,
        totalVisits,
        qrCodeStats: {
          validQRCodes,
          expiredQRCodes: totalVisitors - validQRCodes
        }
      }
    });
  } catch (error) {
    console.error('Error fetching visitor summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 
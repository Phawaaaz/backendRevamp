const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, checkRole } = require('../middleware/auth.middleware');
const Visitor = require('../models/visitor.model');
const Admin = require('../models/admin.model');
const User = require('../models/user.model');
const { sendEmail } = require('../utils/email.utils');
const bcrypt = require('bcryptjs');

/**
 * @swagger
 * /api/admin/visitors:
 *   get:
 *     summary: Get all visitors with filtering and pagination
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, checked-in, checked-out]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in visitor details
 *     responses:
 *       200:
 *         description: List of visitors with pagination
 *       401:
 *         description: Unauthorized
 */
router.get('/visitors', auth, checkRole(['admin']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) query.visitDate.$gte = new Date(startDate);
      if (endDate) query.visitDate.$lte = new Date(endDate);
    }
    if (search) {
      query.$or = [
        { 'user.firstName': { $regex: search, $options: 'i' } },
        { 'user.lastName': { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } }
      ];
    }

    const visitors = await Visitor.find(query)
      .populate('user', 'firstName lastName email phone')
      .populate('host', 'firstName lastName email')
      .sort({ visitDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Visitor.countDocuments(query);

    res.json({
      success: true,
      data: {
        visitors,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching visitors:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get visitor analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *     responses:
 *       200:
 *         description: Analytics data
 *       401:
 *         description: Unauthorized
 */
router.get('/analytics', auth, checkRole(['admin']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.visitDate = {};
      if (startDate) query.visitDate.$gte = new Date(startDate);
      if (endDate) query.visitDate.$lte = new Date(endDate);
    }

    // Total visitors
    const totalVisitors = await Visitor.countDocuments(query);

    // Most common visit purposes
    const purposes = await Visitor.aggregate([
      { $match: query },
      { $group: { _id: '$purpose', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Average daily visitors
    const dailyVisitors = await Visitor.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$visitDate' } },
          count: { $sum: 1 }
        }
      },
      { $group: { _id: null, avg: { $avg: '$count' } } }
    ]);

    // Visits by hour
    const visitsByHour = await Visitor.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $hour: '$visitDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Status breakdown
    const statusBreakdown = await Visitor.aggregate([
      { $match: query },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalVisitors,
        topPurposes: purposes,
        averageDailyVisitors: dailyVisitors[0]?.avg || 0,
        visitsByHour,
        statusBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/admin/settings:
 *   patch:
 *     summary: Update admin settings
 *     tags: [Admin]
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
 *                   dailyReport:
 *                     type: boolean
 *               systemSettings:
 *                 type: object
 *                 properties:
 *                   autoCheckout:
 *                     type: boolean
 *                   maxVisitDuration:
 *                     type: number
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch('/settings', auth, checkRole(['admin']), async (req, res) => {
  try {
    const {
      notificationSettings,
      systemSettings
    } = req.body;

    const admin = await Admin.findOne({ user: req.user._id });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin record not found'
      });
    }

    if (notificationSettings) {
      admin.notificationSettings = {
        ...admin.notificationSettings,
        ...notificationSettings
      };
    }

    if (systemSettings) {
      admin.systemSettings = {
        ...admin.systemSettings,
        ...systemSettings
      };
    }

    await admin.save();

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: admin
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/admin/register-admin:
 *   post:
 *     summary: Register a new admin user (requires admin or higher privileges)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - department
 *               - title
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               department:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
router.post('/register-admin', [
  auth,
  checkRole(['admin', 'super-admin', 'developer']),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('title').notEmpty().withMessage('Title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, firstName, lastName, department, title } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'admin',
      department,
      title
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        title: user.title
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin details for dashboard
 *     description: Retrieve admin details including user information
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin details retrieved successfully
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
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     email:
 *                       type: string
 *                       example: "admin.user@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "Admin"
 *                     lastName:
 *                       type: string
 *                       example: "User"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     photo:
 *                       type: string
 *                       example: "admin-avatar.png"
 *                     department:
 *                       type: string
 *                       example: "IT"
 *                     title:
 *                       type: string
 *                       example: "System Administrator"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Server error
 */
router.get('/dashboard', auth, checkRole(['admin']), async (req, res) => {
  try {
    const admin = await Admin.findOne({ user: req.user.userId }).populate('user', 'email firstName lastName phone photo');
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }
    res.json({
      success: true,
      data: {
        _id: admin._id,
        email: admin.user.email,
        firstName: admin.user.firstName,
        lastName: admin.user.lastName,
        role: admin.user.role,
        phone: admin.user.phone,
        photo: admin.user.photo,
        department: admin.department,
        title: admin.title
      }
    });
  } catch (error) {
    console.error('Error fetching admin details for dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/admin/summary:
 *   get:
 *     summary: Get admin summary
 *     description: Retrieve a summary of admin activities and statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin summary retrieved successfully
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/summary', auth, checkRole(['admin']), async (req, res) => {
  try {
    const totalVisitors = await Visitor.countDocuments();
    const activeVisitors = await Visitor.countDocuments({ status: 'checked-in' });
    const pendingVisitors = await Visitor.countDocuments({ status: 'pending' });
    const checkedOutVisitors = await Visitor.countDocuments({ status: 'checked-out' });

    res.json({
      success: true,
      data: {
        totalVisitors,
        activeVisitors,
        pendingVisitors,
        checkedOutVisitors
      }
    });
  } catch (error) {
    console.error('Error fetching admin summary:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 
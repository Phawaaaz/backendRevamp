const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { auth, isSuperAdmin } = require('../middleware/auth.middleware');
const User = require('../models/user.model');
const Admin = require('../models/admin.model');

/**
 * @swagger
 * /api/super-admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Unauthorized
 */
router.get('/users', auth, isSuperAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/promote/{userId}:
 *   post:
 *     summary: Promote a user to admin role
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to promote
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department
 *               - title
 *             properties:
 *               department:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: User promoted successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/promote/:userId', auth, isSuperAdmin, [
  body('department').notEmpty().withMessage('Department is required'),
  body('title').notEmpty().withMessage('Title is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { userId } = req.params;
    const { department, title } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.role = 'admin';
    await user.save();

    // Create or update admin record
    let admin = await Admin.findOne({ user: userId });
    if (!admin) {
      admin = new Admin({
        user: userId,
        department,
        title
      });
    } else {
      admin.department = department;
      admin.title = title;
    }

    await admin.save();

    res.json({
      success: true,
      message: 'User promoted successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        admin: {
          department: admin.department,
          title: admin.title
        }
      }
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/demote/{userId}:
 *   post:
 *     summary: Demote an admin to user role
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the admin to demote
 *     responses:
 *       200:
 *         description: Admin demoted successfully
 *       400:
 *         description: Cannot demote super admin
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post('/demote/:userId', auth, isSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot demote super admin'
      });
    }

    user.role = 'visitor';
    await user.save();

    // Remove admin record
    await Admin.findOneAndDelete({ user: userId });

    res.json({
      success: true,
      message: 'Admin demoted successfully',
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error demoting admin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete super admin
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.delete('/users/:userId', auth, isSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete super admin'
      });
    }

    // Remove admin record if exists
    await Admin.findOneAndDelete({ user: userId });

    // Delete user
    await user.remove();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

/**
 * @swagger
 * /api/super-admin/system-settings:
 *   patch:
 *     summary: Update system-wide settings
 *     tags: [Super Admin]
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
 *                   workingHours:
 *                     type: object
 *                     properties:
 *                       start:
 *                         type: string
 *                       end:
 *                         type: string
 *     responses:
 *       200:
 *         description: System settings updated successfully
 *       401:
 *         description: Unauthorized
 */
router.patch('/system-settings', auth, isSuperAdmin, async (req, res) => {
  try {
    const { notifications, systemSettings } = req.body;

    // Update all admin records with new settings
    await Admin.updateMany({}, {
      $set: {
        notifications,
        systemSettings
      }
    });

    res.json({
      success: true,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 
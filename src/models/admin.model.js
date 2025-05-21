const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  notificationSettings: {
    newVisitorAlerts: {
      type: Boolean,
      default: true
    },
    dailyReports: {
      type: Boolean,
      default: true
    },
    checkInAlerts: {
      type: Boolean,
      default: true
    },
    securityAlerts: {
      type: Boolean,
      default: true
    }
  },
  systemSettings: {
    dataRetentionDays: {
      type: Number,
      default: 90
    },
    autoCheckoutHours: {
      type: Number,
      default: 8
    },
    defaultDashboardView: {
      type: String,
      enum: ['calendar', 'list', 'analytics'],
      default: 'calendar'
    },
    systemEmailRecipients: [{
      type: String,
      trim: true
    }]
  },
  permissions: {
    canManageAdmins: {
      type: Boolean,
      default: false
    },
    canViewAnalytics: {
      type: Boolean,
      default: true
    },
    canManageSettings: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin; 
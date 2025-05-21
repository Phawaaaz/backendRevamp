const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  visitDate: {
    type: Date,
    required: true
  },
  expectedDuration: {
    type: Number, // in minutes
    default: 60
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  qrCode: {
    type: String
  },
  qrCodeExpiry: {
    type: Date
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: ['scheduled', 'checked-in', 'checked-out', 'cancelled'],
    default: 'scheduled'
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
visitorSchema.index({ visitDate: 1, status: 1 });
visitorSchema.index({ qrCode: 1 });

const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor; 
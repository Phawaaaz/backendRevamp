const QRCode = require('qrcode');
const crypto = require('crypto');

// Generate a unique QR code data
const generateQRData = (visitorId, visitDate) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  return JSON.stringify({
    visitorId,
    visitDate,
    timestamp,
    hash: crypto
      .createHash('sha256')
      .update(`${visitorId}${visitDate}${timestamp}${randomString}`)
      .digest('hex')
  });
};

// Generate QR code image
const generateQRCode = async (visitorId, visitDate) => {
  try {
    const qrData = generateQRData(visitorId, visitDate);
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    
    return {
      success: true,
      qrCodeUrl,
      qrData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Validate QR code data
const validateQRCode = (qrData) => {
  try {
    const data = JSON.parse(qrData);
    const { visitorId, visitDate, timestamp, hash } = data;

    // Check if QR code is expired (24 hours)
    const now = Date.now();
    const qrAge = now - timestamp;
    if (qrAge > 24 * 60 * 60 * 1000) {
      return {
        valid: false,
        message: 'QR code has expired'
      };
    }

    // Verify hash
    const expectedHash = crypto
      .createHash('sha256')
      .update(`${visitorId}${visitDate}${timestamp}`)
      .digest('hex');

    if (hash !== expectedHash) {
      return {
        valid: false,
        message: 'Invalid QR code'
      };
    }

    return {
      valid: true,
      data: {
        visitorId,
        visitDate,
        timestamp
      }
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Invalid QR code format'
    };
  }
};

module.exports = {
  generateQRCode,
  validateQRCode
}; 
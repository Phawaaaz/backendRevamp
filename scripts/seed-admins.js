const mongoose = require('mongoose');
require('dotenv').config();

// Import the seeding function
const { seedAdmins, listAdmins } = require('../src/utils/seedAdmins');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    await connectDB();
    
    // Check command line arguments
    const command = process.argv[2];
    
    switch (command) {
      case 'seed':
        await seedAdmins();
        break;
      case 'list':
        await listAdmins();
        break;
      default:
        console.log('Usage: node scripts/seed-admins.js [seed|list]');
        console.log('  seed - Create default admin users');
        console.log('  list - List all existing admin users');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

main(); 
const User = require('../models/user.model');

const checkAndCreateSuperAdmin = async () => {
  try {
    // Check if super admin exists
    const existingSuperAdmin = await User.findOne({ email: 'superadmin@vms.com' });
    
    if (!existingSuperAdmin) {
      console.log('🔍 Super admin not found. Creating...');
      
      // Create super admin user
      const superAdmin = new User({
        email: 'superadmin@vms.com',
        password: 'superadmin123',
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+1234567894',
        isActive: true
      });

      await superAdmin.save();
      console.log('✅ Super admin created successfully');
      console.log('📧 Email: superadmin@vms.com');
      console.log('🔑 Password: superadmin123');
      console.log('👤 Role: super_admin');
    } else {
      console.log('ℹ️  Super admin already exists');
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking/creating super admin:', error.message);
    return false;
  }
};

module.exports = checkAndCreateSuperAdmin; 
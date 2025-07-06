const User = require('../models/user.model');
const Admin = require('../models/admin.model');
require('dotenv').config();

// Admin users configuration
const adminUsers = [
  {
    email: 'phawaaz@dev.com',
    password: 'qwerty',
    role: 'admin',
    firstName: 'Phawaaz',
    lastName: 'Akinola',
    phone: '09012183194',
    department: 'IT',
    title: 'System Administrator',
    isActive: true
  },
  {
    email: 'admin@vms.com',
    password: 'admin123',
    role: 'admin',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    department: 'Security',
    title: 'Security Manager',
    isActive: true
  },
  {
    email: 'reception@vms.com',
    password: 'reception123',
    role: 'admin',
    firstName: 'Selim',
    lastName: 'Akinola',
    phone: '09012183194',
    department: 'Reception',
    title: 'Reception Manager',
    isActive: true
  },
  {
    email: 'hr@vms.com',
    password: 'hr123',
    role: 'admin',
    firstName: 'Abdul',
    lastName: 'Misbau',
    phone: '+1234567892',
    department: 'Human Resources',
    title: 'HR Manager',
    isActive: true
  },
  {
    email: 'facilities@vms.com',
    password: 'facilities123',
    role: 'admin',
    firstName: 'Frank',
    lastName: 'Micheal',
    phone: '+1234567893',
    department: 'Developer',
    title: 'Code Manager',
    isActive: true
  },
  {
    email: 'superadmin@vms.com',
    password: 'superadmin123',
    role: 'super_admin',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '+1234567894',
    department: 'System',
    title: 'System Administrator',
    isActive: true
  }
];

const seedAdmins = async () => {
  try {
    console.log('🌱 Starting admin user seeding...\n');

    for (const adminData of adminUsers) {
      // Check if admin already exists
      const existingUser = await User.findOne({ email: adminData.email });
      
      if (!existingUser) {
        // Create user
        const user = new User({
          email: adminData.email,
          password: adminData.password,
          role: adminData.role,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          phone: adminData.phone,
          isActive: adminData.isActive
        });

        await user.save();

        // Create admin profile if role is admin
        if (adminData.role === 'admin') {
          const admin = new Admin({
            user: user._id,
            department: adminData.department,
            title: adminData.title
          });

          await admin.save();
        }

        console.log(`✅ Created ${adminData.role}: ${adminData.email}`);
        console.log(`   📧 Email: ${adminData.email}`);
        console.log(`   🔑 Password: ${adminData.password}`);
        console.log(`   👤 Name: ${adminData.firstName} ${adminData.lastName}`);
        console.log(`   🏢 Department: ${adminData.department}`);
        console.log(`   📋 Title: ${adminData.title}`);
        console.log('   ──────────────────────────────────────');
      } else {
        console.log(`ℹ️  ${adminData.role} already exists: ${adminData.email}`);
      }
    }

    console.log('🎉 Admin seeding completed!');
    console.log('\n📋 Available Admin Accounts:');
    console.log('─────────────────────────────────────────────');
    adminUsers.forEach(admin => {
      console.log(`${admin.role.toUpperCase()}:`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Password: ${admin.password}`);
      console.log(`  Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`  Department: ${admin.department}`);
      console.log(`  Title: ${admin.title}`);
      console.log('  ──────────────────────────────────────');
    });

  } catch (error) {
    console.error('❌ Error creating admin users:', error.message);
  }
};

// Function to add a single admin
const addAdmin = async (adminData) => {
  try {
    const existingUser = await User.findOne({ email: adminData.email });
    
    if (existingUser) {
      console.log(`❌ Admin with email ${adminData.email} already exists`);
      return false;
    }

    const user = new User({
      email: adminData.email,
      password: adminData.password,
      role: adminData.role || 'admin',
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      phone: adminData.phone,
      isActive: adminData.isActive !== false
    });

    await user.save();

    if (adminData.role === 'admin' || !adminData.role) {
      const admin = new Admin({
        user: user._id,
        department: adminData.department,
        title: adminData.title
      });

      await admin.save();
    }

    console.log(`✅ Successfully created admin: ${adminData.email}`);
    return true;
  } catch (error) {
    console.error('❌ Error adding admin:', error.message);
    return false;
  }
};

// Function to list all admins
const listAdmins = async () => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } })
      .populate('admin', 'department title')
      .select('-password');

    console.log('\n📋 Current Admin Users:');
    console.log('─────────────────────────────────────────────');
    
    admins.forEach(admin => {
      console.log(`${admin.role.toUpperCase()}:`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Name: ${admin.firstName} ${admin.lastName}`);
      console.log(`  Phone: ${admin.phone}`);
      if (admin.admin) {
        console.log(`  Department: ${admin.admin.department}`);
        console.log(`  Title: ${admin.admin.title}`);
      }
      console.log(`  Active: ${admin.isActive ? 'Yes' : 'No'}`);
      console.log('  ──────────────────────────────────────');
    });

    return admins;
  } catch (error) {
    console.error('❌ Error listing admins:', error.message);
    return [];
  }
};

module.exports = {
  seedAdmins,
  addAdmin,
  listAdmins,
  adminUsers
}; 
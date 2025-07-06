const User = require('../models/user.model');
const Admin = require('../models/admin.model');

const createDefaultAdmin = async () => {
  try {
    // Array of admin users to seed
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
        firstName: 'Sarah',
        lastName: 'Johnson',
        phone: '+1234567891',
        department: 'Reception',
        title: 'Reception Manager',
        isActive: true
      },
      {
        email: 'hr@vms.com',
        password: 'hr123',
        role: 'admin',
        firstName: 'Michael',
        lastName: 'Brown',
        phone: '+1234567892',
        department: 'Human Resources',
        title: 'HR Manager',
        isActive: true
      },
      {
        email: 'facilities@vms.com',
        password: 'facilities123',
        role: 'admin',
        firstName: 'Emily',
        lastName: 'Davis',
        phone: '+1234567893',
        department: 'Facilities',
        title: 'Facilities Manager',
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

    console.log('🌱 Starting admin user seeding...');

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
    console.error('❌ Error creating default admin users:', error.message);
  }
};

module.exports = createDefaultAdmin; 
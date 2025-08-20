const mongoose = require('mongoose');
const { User, Pastor, Sermon, Event, Blog, PrayerRequest } = require('../models');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data (be careful in production!)
    await User.deleteMany({});
    await Pastor.deleteMany({});
    await Sermon.deleteMany({});
    await Event.deleteMany({});
    await Blog.deleteMany({});
    await PrayerRequest.deleteMany({});

    console.log('Cleared existing data');

    // Create sample pastor
    const samplePastor = await Pastor.create({
      email: 'pastor@church.com',
      name: 'Pastor John Smith',
      title: 'Pastor',
      bio: 'Senior Pastor with 15 years of ministry experience',
      adminLevel: 'super_admin',
      permissions: {
        manageUsers: true,
        manageBothBranches: true,
        manageContent: true,
        manageSermons: true,
        createAdmins: true
      }
    });

    console.log('✅ Created sample pastor');

    // Create sample users
    const sampleUsers = await User.create([
      {
        email: 'user1@example.com',
        name: 'John Doe',
        bio: 'Active church member',
        branch: 'branch1',
        approvalStatus: 'approved',
        approvedBy: samplePastor._id,
        approvedAt: new Date()
      },
      {
        email: 'user2@example.com',
        name: 'Jane Smith',
        bio: 'Youth ministry volunteer',
        branch: 'branch2',
        approvalStatus: 'approved',
        approvedBy: samplePastor._id,
        approvedAt: new Date()
      },
      {
        email: 'pending@example.com',
        name: 'Pending User',
        bio: 'Awaiting approval',
        branch: 'branch1',
        approvalStatus: 'pending'
      }
    ]);

    console.log('✅ Created sample users');

    // Create sample sermons
    await Sermon.create([
      {
        title: 'Faith in Times of Trial',
        description: 'A sermon about maintaining faith during difficult times',
        category: 'Faith',
        videoURL: 'https://example.com/sermon1.mp4',
        duration: 2400, // 40 minutes
        uploadedBy: samplePastor._id,
        tags: ['faith', 'trials', 'hope']
      },
      {
        title: 'Love Your Neighbor',
        description: 'Understanding what it means to love our neighbors as ourselves',
        category: 'Love',
        videoURL: 'https://example.com/sermon2.mp4',
        duration: 1800, // 30 minutes
        uploadedBy: samplePastor._id,
        tags: ['love', 'community', 'service']
      }
    ]);

    console.log('✅ Created sample sermons');

    // Create sample events
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // One week from now

    await Event.create([
      {
        title: 'Sunday Service',
        description: 'Weekly Sunday worship service',
        eventDate: futureDate,
        location: 'Main Sanctuary',
        branch: 'both',
        createdBy: samplePastor._id,
        creatorType: 'Pastor'
      },
      {
        title: 'Youth Group Meeting',
        description: 'Monthly youth group gathering',
        eventDate: new Date(futureDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days after Sunday
        location: 'Youth Hall',
        branch: 'branch1',
        createdBy: sampleUsers[0]._id,
        creatorType: 'User'
      }
    ]);

    console.log('✅ Created sample events');

    // Create sample blog posts
    await Blog.create([
      {
        title: 'Welcome to Our Church Family',
        content: '<p>We are delighted to welcome you to our church family. This is a place where faith grows, community thrives, and lives are transformed...</p>',
        excerpt: 'A warm welcome message to new members of our church community.',
        author: samplePastor._id,
        status: 'published',
        tags: ['welcome', 'community', 'family']
      }
    ]);

    console.log('✅ Created sample blog posts');

    // Create sample prayer requests
    await PrayerRequest.create([
      {
        title: 'Healing Prayer',
        description: 'Please pray for my grandmother who is in the hospital',
        submittedBy: sampleUsers[0]._id,
        submitterBranch: 'branch1',
        submitterName: sampleUsers.name,
        priority: 'high'
      },
      {
        title: 'Job Search',
        description: 'Seeking prayers for guidance in finding new employment',
        submittedBy: null,
        submitterBranch: 'branch2',
        submitterName: 'Anonymous',
        isAnonymous: true
      }
    ]);

    console.log('✅ Created sample prayer requests');
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;

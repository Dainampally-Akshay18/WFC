const mongoose = require('mongoose');

// Database connection optimization
const optimizeConnection = () => {
  // Connection pool settings
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection pool ready');
  });

  // Monitor slow queries
  mongoose.set('debug', (coll, method, query, doc) => {
    const startTime = Date.now();
    
    const originalExec = mongoose.Query.prototype.exec;
    mongoose.Query.prototype.exec = function() {
      const result = originalExec.apply(this);
      
      result.then(() => {
        const duration = Date.now() - startTime;
        if (duration > 100) {
          console.warn(`Slow query: ${coll}.${method}() took ${duration}ms`);
          console.warn(`Query: ${JSON.stringify(query)}`);
        }
      });
      
      return result;
    };
  });
};

// Index creation for performance
const createIndexes = async () => {
  const collections = mongoose.connection.collections;
  
  try {
    // User indexes
    if (collections.users) {
      await collections.users.createIndex({ email: 1 }, { unique: true });
      await collections.users.createIndex({ branch: 1, approvalStatus: 1 });
      await collections.users.createIndex({ firebaseUID: 1 }, { sparse: true });
      await collections.users.createIndex({ lastLogin: -1 });
    }

    // Sermon indexes
    if (collections.sermons) {
      await collections.sermons.createIndex({ category: 1, isActive: 1 });
      await collections.sermons.createIndex({ views: -1 });
      await collections.sermons.createIndex({ uploadedBy: 1 });
      await collections.sermons.createIndex({ tags: 1 });
      await collections.sermons.createIndex({ createdAt: -1 });
    }

    // Event indexes
    if (collections.events) {
      await collections.events.createIndex({ branch: 1, isActive: 1 });
      await collections.events.createIndex({ eventDate: 1 });
      await collections.events.createIndex({ createdBy: 1 });
      await collections.events.createIndex({ crossBranchRequested: 1, crossBranchApproved: 1 });
    }

    // Blog indexes
    if (collections.blogs) {
      await collections.blogs.createIndex({ status: 1, publishDate: -1 });
      await collections.blogs.createIndex({ author: 1 });
      await collections.blogs.createIndex({ tags: 1 });
      await collections.blogs.createIndex({ views: -1 });
    }

    // Prayer request indexes
    if (collections.prayers) {
      await collections.prayers.createIndex({ status: 1, isVisible: 1 });
      await collections.prayers.createIndex({ submitterBranch: 1 });
      await collections.prayers.createIndex({ submittedBy: 1 });
      await collections.prayers.createIndex({ createdAt: -1 });
    }

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
  }
};

module.exports = {
  optimizeConnection,
  createIndexes
};

const mongoose = require('mongoose');

const prayerRequestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Prayer request title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Prayer request description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return !this.isAnonymous;
    }
  },
  submitterBranch: {
    type: String,
    enum: {
      values: ['branch1', 'branch2'],
      message: 'Branch must be either branch1 or branch2'
    },
    required: [true, 'Submitter branch is required']
  },
  submitterName: {
    type: String,
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  prayerCount: {
    type: Number,
    default: 0,
    min: [0, 'Prayer count cannot be negative']
  },
  prayedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    prayedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: {
      values: ['active', 'answered', 'archived'],
      message: 'Status must be active, answered, or archived'
    },
    default: 'active'
  },
  answeredDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Answer description cannot exceed 500 characters']
  },
  answeredAt: {
    type: Date
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'normal', 'high', 'urgent'],
      message: 'Priority must be low, normal, high, or urgent'
    },
    default: 'normal'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
prayerRequestSchema.index({ status: 1, isVisible: 1 });
prayerRequestSchema.index({ submittedBy: 1 });
prayerRequestSchema.index({ submitterBranch: 1 });
prayerRequestSchema.index({ createdAt: -1 });
prayerRequestSchema.index({ prayerCount: -1 });

// Virtual for display name
prayerRequestSchema.virtual('displayName').get(function() {
  if (this.isAnonymous) {
    return 'Anonymous';
  }
  return this.submitterName || 'Member';
});

// Virtual for days since submission
prayerRequestSchema.virtual('daysOld').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Instance method to add prayer
prayerRequestSchema.methods.addPrayer = function(userId) {
  const alreadyPrayed = this.prayedBy.some(
    prayer => prayer.user.toString() === userId.toString()
  );
  
  if (!alreadyPrayed) {
    this.prayedBy.push({ user: userId });
    this.prayerCount += 1;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Instance method to mark as answered
prayerRequestSchema.methods.markAsAnswered = function(description) {
  this.status = 'answered';
  this.answeredDescription = description;
  this.answeredAt = new Date();
  return this.save();
};

// Static method to find active requests
prayerRequestSchema.statics.findActive = function() {
  return this.find({ status: 'active', isVisible: true })
    .sort({ createdAt: -1 })
    .populate('submittedBy', 'name');
};

// Static method to find by branch
prayerRequestSchema.statics.findByBranch = function(branch) {
  return this.find({ 
    submitterBranch: branch, 
    status: 'active', 
    isVisible: true 
  })
  .sort({ createdAt: -1 })
  .populate('submittedBy', 'name');
};

// Static method to find recent answered prayers
prayerRequestSchema.statics.findRecentAnswered = function(limit = 10) {
  return this.find({ status: 'answered', isVisible: true })
    .sort({ answeredAt: -1 })
    .limit(limit)
    .populate('submittedBy', 'name');
};

module.exports = mongoose.model('PrayerRequest', prayerRequestSchema);

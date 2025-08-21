const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values during development
    index: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      'Please provide a valid email address'
    ]
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  profilePicture: {
    type: String, // Azure Blob Storage URL
    default: ''
  },
  branch: {
    type: String,
    enum: {
      values: ['branch1', 'branch2'],
      message: 'Branch must be either branch1 or branch2'
    },
    required: [false, 'Branch selection is required'],
    default: null
  },
  approvalStatus: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Invalid approval status'
    },
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Rejection reason cannot exceed 200 characters']
  },
  branchSelectedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pastor'
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ branch: 1, approvalStatus: 1 });
userSchema.index({ approvalStatus: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for user full info
userSchema.virtual('approvalInfo').get(function() {
  return {
    status: this.approvalStatus,
    approvedAt: this.approvedAt,
    rejectionReason: this.rejectionReason
  };
});

// Pre-save middleware
userSchema.pre('save', function(next) {
  // Set approval timestamp when status changes to approved
  if (this.isModified('approvalStatus') && this.approvalStatus === 'approved') {
    this.approvedAt = new Date();
  }
  next();
});

// Instance method to check if user is approved
userSchema.methods.isApproved = function() {
  return this.approvalStatus === 'approved';
};

// Static method to find users by branch
userSchema.statics.findByBranch = function(branch) {
  return this.find({ branch, approvalStatus: 'approved', isActive: true });
};

// Static method to find pending users
userSchema.statics.findPending = function() {
  return this.find({ approvalStatus: 'pending', isActive: true });
};

module.exports = mongoose.model('User', userSchema);

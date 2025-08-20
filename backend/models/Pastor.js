const mongoose = require('mongoose');

const pastorSchema = new mongoose.Schema({
  firebaseUID: {
    type: String,
    unique: true,
    sparse: true,
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
  title: {
    type: String,
    enum: {
      values: ['Pastor', 'Associate Pastor', 'Admin'],
      message: 'Invalid title'
    },
    default: 'Pastor'
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    default: ''
  },
  profilePicture: {
    type: String, // Azure Blob Storage URL
    default: ''
  },
  adminLevel: {
    type: String,
    enum: {
      values: ['pastor', 'super_admin'],
      message: 'Invalid admin level'
    },
    default: 'pastor'
  },
  permissions: {
    manageUsers: {
      type: Boolean,
      default: true
    },
    manageBothBranches: {
      type: Boolean,
      default: true
    },
    manageContent: {
      type: Boolean,
      default: true
    },
    manageSermons: {
      type: Boolean,
      default: true
    },
    createAdmins: {
      type: Boolean,
      default: false
    }
  },
  lastLogin: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pastor'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
pastorSchema.index({ email: 1 });
pastorSchema.index({ adminLevel: 1 });
pastorSchema.index({ isActive: 1 });

// Virtual for full permissions
pastorSchema.virtual('allPermissions').get(function() {
  return Object.keys(this.permissions).filter(key => this.permissions[key]);
});

// Instance method to check specific permission
pastorSchema.methods.hasPermission = function(permission) {
  return this.permissions[permission] === true;
};

// Instance method to check if super admin
pastorSchema.methods.isSuperAdmin = function() {
  return this.adminLevel === 'super_admin';
};

// Static method to find active pastors
pastorSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('Pastor', pastorSchema);

const mongoose = require('mongoose');

const sermonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Sermon title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Sermon description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Sermon category is required'],
    trim: true,
    minlength: [2, 'Category must be at least 2 characters long'],
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  videoURL: {
    type: String, // Azure Blob Storage URL
    required: [true, 'Video URL is required'],
    trim: true
  },
  thumbnailURL: {
    type: String, // Azure Blob Storage URL for thumbnail
    default: ''
  },
  duration: {
    type: Number, // Duration in seconds
    min: [1, 'Duration must be at least 1 second'],
    default: 0
  },
  fileSize: {
    type: Number, // File size in bytes
    min: [0, 'File size cannot be negative'],
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pastor',
    required: [true, 'Uploader information is required']
  },
  downloadable: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Each tag cannot exceed 30 characters']
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
sermonSchema.index({ category: 1, isActive: 1 });
sermonSchema.index({ uploadedBy: 1 });
sermonSchema.index({ createdAt: -1 });
sermonSchema.index({ views: -1 });
sermonSchema.index({ tags: 1 });

// Virtual for formatted duration
sermonSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '0:00';
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Virtual for formatted file size
sermonSchema.virtual('formattedFileSize').get(function() {
  if (!this.fileSize) return '0 MB';
  const mb = (this.fileSize / (1024 * 1024)).toFixed(2);
  return `${mb} MB`;
});

// Instance method to increment views
sermonSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Static method to find by category
sermonSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).populate('uploadedBy', 'name title');
};

// Static method to get all categories
sermonSchema.statics.getCategories = function() {
  return this.distinct('category', { isActive: true });
};

// Static method to get popular sermons
sermonSchema.statics.getPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ views: -1 })
    .limit(limit)
    .populate('uploadedBy', 'name title');
};

module.exports = mongoose.model('Sermon', sermonSchema);

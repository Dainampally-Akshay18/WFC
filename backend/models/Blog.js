const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Blog title is required'],
    trim: true,
    minlength: [5, 'Title must be at least 5 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String, // Rich text content
    required: [true, 'Blog content is required'],
    minlength: [50, 'Content must be at least 50 characters long']
  },
  excerpt: {
    type: String,
    required: [true, 'Blog excerpt is required'],
    trim: true,
    minlength: [20, 'Excerpt must be at least 20 characters long'],
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pastor',
    required: [true, 'Author information is required']
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: {
      values: ['draft', 'published'],
      message: 'Status must be either draft or published'
    },
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Each tag cannot exceed 30 characters']
  }],
  featuredImage: {
    type: String, // Azure Blob Storage URL
    default: ''
  },
  views: {
    type: Number,
    default: 0,
    min: [0, 'Views cannot be negative']
  },
  readTime: {
    type: Number, // Estimated read time in minutes
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
blogSchema.index({ status: 1, publishDate: -1 });
blogSchema.index({ author: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ views: -1 });

// Virtual for URL slug
blogSchema.virtual('slug').get(function() {
  return this.title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
});

// Pre-save middleware to calculate read time
blogSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / wordsPerMinute);
  }
  next();
});

// Instance method to increment views
blogSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Instance method to publish blog
blogSchema.methods.publish = function() {
  this.status = 'published';
  this.publishDate = new Date();
  return this.save();
};

// Static method to find published blogs
blogSchema.statics.findPublished = function() {
  return this.find({ status: 'published' })
    .sort({ publishDate: -1 })
    .populate('author', 'name title');
};

// Static method to find by author
blogSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId })
    .sort({ createdAt: -1 })
    .populate('author', 'name title');
};

// Static method to search blogs
blogSchema.statics.search = function(searchTerm) {
  return this.find({
    status: 'published',
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { excerpt: { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  }).populate('author', 'name title');
};

module.exports = mongoose.model('Blog', blogSchema);

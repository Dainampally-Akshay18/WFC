const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters long'],
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    minlength: [10, 'Description must be at least 10 characters long'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  eventDate: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(endDate) {
        return !endDate || endDate > this.eventDate;
      },
      message: 'End date must be after start date'
    }
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  branch: {
    type: String,
    enum: {
      values: ['branch1', 'branch2', 'both'],
      message: 'Branch must be branch1, branch2, or both'
    },
    required: [true, 'Branch specification is required']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'creatorType',
    required: [true, 'Creator information is required']
  },
  creatorType: {
    type: String,
    enum: ['User', 'Pastor'],
    required: [true, 'Creator type is required']
  },
  crossBranchRequested: {
    type: Boolean,
    default: false
  },
  crossBranchApproved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pastor'
  },
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  maxAttendees: {
    type: Number,
    min: [1, 'Maximum attendees must be at least 1']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
eventSchema.index({ branch: 1, isActive: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ crossBranchRequested: 1, crossBranchApproved: 1 });

// Virtual for event status
eventSchema.virtual('status').get(function() {
  const now = new Date();
  if (this.eventDate < now) return 'past';
  if (this.eventDate > now) return 'upcoming';
  return 'ongoing';
});

// Virtual for attendee count
eventSchema.virtual('attendeeCount').get(function() {
  return this.attendees ? this.attendees.length : 0;
});

// Virtual for available spots
eventSchema.virtual('availableSpots').get(function() {
  if (!this.maxAttendees) return null;
  return this.maxAttendees - this.attendeeCount;
});

// Instance method to register attendee
eventSchema.methods.registerAttendee = function(userId) {
  if (this.maxAttendees && this.attendeeCount >= this.maxAttendees) {
    throw new Error('Event is full');
  }
  
  const alreadyRegistered = this.attendees.some(
    attendee => attendee.user.toString() === userId.toString()
  );
  
  if (alreadyRegistered) {
    throw new Error('User already registered for this event');
  }
  
  this.attendees.push({ user: userId });
  return this.save();
};

// Static method to find by branch
eventSchema.statics.findByBranch = function(branch) {
  const query = branch === 'both' 
    ? { $or: [{ branch: 'both' }, { branch: branch, crossBranchApproved: true }] }
    : { $or: [{ branch: branch }, { branch: 'both' }, { branch: { $ne: branch }, crossBranchApproved: true }] };
  
  return this.find({ ...query, isActive: true })
    .populate('createdBy')
    .populate('approvedBy', 'name title')
    .sort({ eventDate: 1 });
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function(limit = 10) {
  return this.find({ 
    eventDate: { $gt: new Date() }, 
    isActive: true 
  })
  .sort({ eventDate: 1 })
  .limit(limit)
  .populate('createdBy');
};

module.exports = mongoose.model('Event', eventSchema);

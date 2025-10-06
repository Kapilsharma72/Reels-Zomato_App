const mongoose = require('mongoose');

const videoSubmissionSchema = new mongoose.Schema({
  // Food Partner who submitted the video
  foodPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodPartner',
    required: true
  },
  
  // Editor assigned to the project (optional initially)
  editor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Project details
  projectTitle: {
    type: String,
    required: true,
    trim: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  // Video file information
  videoFile: {
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    }
  },
  
  // Instructions for the editor
  instructions: {
    type: String,
    required: true,
    trim: true
  },
  
  // Additional requirements
  requirements: [{
    type: String,
    trim: true
  }],
  
  // Project timeline
  deadline: {
    type: Date,
    required: true
  },
  
  // Budget/Price
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['submitted', 'assigned', 'in_progress', 'review', 'completed', 'rejected'],
    default: 'submitted'
  },
  
  // Progress tracking
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Editor's work
  editedVideo: {
    filename: String,
    originalName: String,
    fileSize: Number,
    mimeType: String,
    filePath: String,
    uploadedAt: Date
  },
  
  // Communication
  messages: [{
    sender: {
      type: String,
      enum: ['foodPartner', 'editor'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // History tracking for status changes and important events
  history: [{
    action: {
      type: String,
      required: true,
      enum: ['submitted', 'assigned', 'in_progress', 'review', 'completed', 'rejected', 'edited_video_uploaded', 'message_sent', 'rating_given']
    },
    description: {
      type: String,
      required: true
    },
    performedBy: {
      type: String,
      enum: ['foodPartner', 'editor', 'system'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  
  // Rating and feedback
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  
  feedback: {
    type: String,
    trim: true,
    default: null
  },
  
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  
  assignedAt: {
    type: Date,
    default: null
  },
  
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for efficient queries
videoSubmissionSchema.index({ foodPartner: 1, status: 1 });
videoSubmissionSchema.index({ editor: 1, status: 1 });
videoSubmissionSchema.index({ status: 1, submittedAt: -1 });

// Virtual for formatted deadline
videoSubmissionSchema.virtual('formattedDeadline').get(function() {
  return this.deadline.toLocaleDateString();
});

// Virtual for time remaining
videoSubmissionSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const diff = this.deadline - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? `${days} days` : 'Overdue';
});

// Method to update status
videoSubmissionSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  if (newStatus === 'assigned' && !this.assignedAt) {
    this.assignedAt = new Date();
  } else if (newStatus === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Method to add message
videoSubmissionSchema.methods.addMessage = function(sender, message) {
  this.messages.push({
    sender,
    message,
    timestamp: new Date()
  });
  return this.save();
};

// Method to update progress
videoSubmissionSchema.methods.updateProgress = function(progress) {
  this.progress = Math.max(0, Math.min(100, progress));
  return this.save();
};

// Method to add history entry
videoSubmissionSchema.methods.addHistoryEntry = function(action, description, performedBy, metadata = {}) {
  this.history.push({
    action,
    description,
    performedBy,
    timestamp: new Date(),
    metadata
  });
  return this.save();
};

// Method to get formatted history
videoSubmissionSchema.methods.getFormattedHistory = function() {
  return this.history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

module.exports = mongoose.model('VideoSubmission', videoSubmissionSchema);

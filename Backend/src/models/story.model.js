const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        maxlength: 200
    },
    price: {
        type: Number,
        min: 0
    },
    video: {
        type: String,
        required: true
    },
    music: {
        name: String,
        artist: String,
        duration: String,
        genre: String
    },
    musicVolume: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    duration: {
        type: Number,
        min: 15,
        max: 60,
        default: 15
    },
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodPartner',
        required: true
    },
    views: {
        type: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            viewedAt: {
                type: Date,
                default: Date.now
            }
        }],
        default: []
    },
    expiresAt: {
        type: Date,
        default: function() {
            // Stories expire after 24 hours
            return new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
    }
}, {
    timestamps: true
});

// Index for better query performance
storySchema.index({ foodPartner: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion
storySchema.index({ createdAt: -1 });

// Virtual for view count
storySchema.virtual('viewCount').get(function() {
    return this.views ? this.views.length : 0;
});

// Ensure virtual fields are serialized
storySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Story', storySchema);

const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    dishName: {
        type: String,
        required: true,
    },
    video: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0
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
    foodPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodPartner",
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    views: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for better query performance
foodSchema.index({ foodPartner: 1, createdAt: -1 });
foodSchema.index({ createdAt: -1 });

const foodModel = mongoose.model("food",foodSchema);

module.exports = foodModel;
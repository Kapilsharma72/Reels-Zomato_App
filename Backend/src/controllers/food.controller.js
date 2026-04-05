const foodModel = require('../models/food.model');
const FoodPartnerModel = require('../models/foodPartner.model');
const storageService = require('../services/storage.service');
const { v4:uuid } = require('uuid');
async function createFood(req, res) {
    try {
        if (!req.foodPartner || !req.foodPartner._id) {
            return res.status(400).json({
                message: "Food partner information is missing."
            });
        }

        let videoUrl = null;
        if (req.file) {
            const fileUploadResult = await storageService.uploadFile(req.file.buffer, uuid());
            videoUrl = fileUploadResult.url;
        }

        const foodItem = await foodModel.create({
            dishName: req.body.dishName,
            description: req.body.description,
            price: req.body.price,
            video: videoUrl,
            music: req.body.music || null,
            musicVolume: req.body.musicVolume || 50,
            foodPartner: req.foodPartner._id
        });

        res.status(201).json({
            message: "Reel created successfully",
            food: foodItem
        });
    } catch (error) {
        console.error("Error creating reel:", error);
        res.status(500).json({
            message: "Failed to create reel",
            error: error.message
        });
    }
}
async function getFoodItem(req, res) {
    try {
        const foodItems = await foodModel.find({ isAvailable: { $ne: false } })
            .populate('foodPartner', 'businessName name')
            .select('dishName description price video music musicVolume foodPartner likes comments category isAvailable createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Reels fetched successfully",
            foodItems: foodItems
        });
    } catch (error) {
        console.error("Error fetching reels:", error);
        res.status(500).json({
            message: "Failed to fetch reels",
            error: error.message
        });
    }
}

async function getReelsByFoodPartner(req, res) {
    try {
        if (!req.foodPartner || !req.foodPartner._id) {
            return res.status(400).json({
                message: "Food partner information is missing."
            });
        }

        const reels = await foodModel.find({ foodPartner: req.foodPartner._id })
            .select('dishName description price video music musicVolume createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Reels fetched successfully",
            reels: reels
        });
    } catch (error) {
        console.error("Error fetching reels:", error);
        res.status(500).json({
            message: "Failed to fetch reels",
            error: error.message
        });
    }
}

async function toggleLike(req, res) {
    try {
        const { foodId } = req.params;
        const userId = req.user._id;
        const food = await foodModel.findById(foodId);
        if (!food) return res.status(404).json({ message: 'Food item not found' });
        const alreadyLiked = food.likes.includes(userId);
        if (alreadyLiked) {
            food.likes.pull(userId);
        } else {
            food.likes.push(userId);
        }
        await food.save();
        res.json({ liked: !alreadyLiked, likeCount: food.likes.length });
    } catch (error) {
        console.error('Error toggling like:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function addComment(req, res) {
    try {
        const { foodId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;
        if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text is required' });
        const food = await foodModel.findByIdAndUpdate(
            foodId,
            { $push: { comments: { user: userId, text: text.trim(), createdAt: new Date() } } },
            { new: true }
        ).populate('comments.user', 'fullName');
        if (!food) return res.status(404).json({ message: 'Food item not found' });
        const newComment = food.comments[food.comments.length - 1];
        res.status(201).json({ comment: newComment });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getComments(req, res) {
    try {
        const { foodId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const food = await foodModel.findById(foodId).populate('comments.user', 'fullName');
        if (!food) return res.status(404).json({ message: 'Food item not found' });
        const total = food.comments.length;
        const start = (page - 1) * limit;
        const comments = food.comments.slice(start, start + limit);
        res.json({ comments, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    createFood,
    getFoodItem,
    getReelsByFoodPartner,
    toggleLike,
    addComment,
    getComments
}
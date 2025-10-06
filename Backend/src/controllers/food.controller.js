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
        const foodItems = await foodModel.find({})
            .populate('foodPartner', 'businessName name')
            .select('dishName description price video music musicVolume foodPartner createdAt')
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

module.exports = {
    createFood,
    getFoodItem,
    getReelsByFoodPartner
}
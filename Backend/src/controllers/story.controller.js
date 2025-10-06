const StoryModel = require('../models/story.model');
const storageService = require('../services/storage.service');
const { v4: uuid } = require('uuid');

async function createStory(req, res) {
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

        const story = await StoryModel.create({
            description: req.body.description,
            price: req.body.price || null,
            video: videoUrl,
            music: req.body.music || null,
            musicVolume: req.body.musicVolume || 50,
            duration: req.body.duration || 15,
            foodPartner: req.foodPartner._id,
            views: [] // Initialize empty views array
        });

        res.status(201).json({
            message: "Story created successfully",
            story: story
        });
    } catch (error) {
        console.error("Error creating story:", error);
        res.status(500).json({
            message: "Failed to create story",
            error: error.message
        });
    }
}

async function getStories(req, res) {
    try {
        const stories = await StoryModel.find({})
            .populate('foodPartner', 'businessName name')
            .select('description price video music musicVolume duration foodPartner createdAt views')
            .sort({ createdAt: -1 });

        // Ensure views array is properly initialized for each story
        const storiesWithViews = stories.map(story => {
            if (!story.views) {
                story.views = [];
            }
            return story;
        });

        res.status(200).json({
            message: "Stories fetched successfully",
            stories: storiesWithViews
        });
    } catch (error) {
        console.error("Error fetching stories:", error);
        res.status(500).json({
            message: "Failed to fetch stories",
            error: error.message
        });
    }
}

async function getStoriesByFoodPartner(req, res) {
    try {
        if (!req.foodPartner || !req.foodPartner._id) {
            return res.status(400).json({
                message: "Food partner information is missing."
            });
        }

        const stories = await StoryModel.find({ foodPartner: req.foodPartner._id })
            .select('description price video music musicVolume duration createdAt views')
            .sort({ createdAt: -1 });

        // Ensure views array is properly initialized for each story
        const storiesWithViews = stories.map(story => {
            if (!story.views) {
                story.views = [];
            }
            return story;
        });

        res.status(200).json({
            message: "Stories fetched successfully",
            stories: storiesWithViews
        });
    } catch (error) {
        console.error("Error fetching stories:", error);
        res.status(500).json({
            message: "Failed to fetch stories",
            error: error.message
        });
    }
}

async function markStoryAsViewed(req, res) {
    try {
        const { storyId } = req.params;
        const userId = req.user ? req.user._id : null; // For anonymous users, we'll use IP or session

        // Find the story
        const story = await StoryModel.findById(storyId);
        if (!story) {
            return res.status(404).json({
                message: "Story not found"
            });
        }

        // Check if user has already viewed this story
        const hasViewed = story.views.some(view => 
            userId ? view.user.toString() === userId.toString() : false
        );

        if (!hasViewed && userId) {
            // Add view record
            story.views.push({
                user: userId,
                viewedAt: new Date()
            });
            await story.save();
        }

        res.status(200).json({
            message: "Story marked as viewed",
            story: story
        });
    } catch (error) {
        console.error("Error marking story as viewed:", error);
        res.status(500).json({
            message: "Failed to mark story as viewed",
            error: error.message
        });
    }
}

module.exports = {
    createStory,
    getStories,
    getStoriesByFoodPartner,
    markStoryAsViewed
};

const PostModel = require('../models/post.model');
const storageService = require('../services/storage.service');
const { v4: uuid } = require('uuid');

async function createPost(req, res) {
    try {
        if (!req.foodPartner || !req.foodPartner._id) {
            return res.status(400).json({
                message: "Food partner information is missing."
            });
        }

        // Handle multiple image uploads
        const imageUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const fileUploadResult = await storageService.uploadFile(file.buffer, uuid());
                imageUrls.push(fileUploadResult.url);
            }
        }

        const post = await PostModel.create({
            description: req.body.description,
            images: imageUrls,
            foodPartner: req.foodPartner._id
        });

        res.status(201).json({
            message: "Post created successfully",
            post: post
        });
    } catch (error) {
        console.error("Error creating post:", error);
        res.status(500).json({
            message: "Failed to create post",
            error: error.message
        });
    }
}

async function getPosts(req, res) {
    try {
        const posts = await PostModel.find({})
            .populate('foodPartner', 'businessName name')
            .select('description images foodPartner createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Posts fetched successfully",
            posts: posts
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({
            message: "Failed to fetch posts",
            error: error.message
        });
    }
}

async function getPostsByFoodPartner(req, res) {
    try {
        if (!req.foodPartner || !req.foodPartner._id) {
            return res.status(400).json({
                message: "Food partner information is missing."
            });
        }

        const posts = await PostModel.find({ foodPartner: req.foodPartner._id })
            .select('description images createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Posts fetched successfully",
            posts: posts
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({
            message: "Failed to fetch posts",
            error: error.message
        });
    }
}

module.exports = {
    createPost,
    getPosts,
    getPostsByFoodPartner
};

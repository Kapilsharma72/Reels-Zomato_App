const PostModel = require('../models/post.model');
const storageService = require('../services/storage.service');
const { v4: uuid } = require('uuid');
const UserModel = require('../models/user.model');

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

async function togglePostLike(req, res) {
    try {
        const { postId } = req.params;
        const userId = req.user._id;
        const post = await PostModel.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        const alreadyLiked = post.likes.includes(userId);
        if (alreadyLiked) {
            post.likes.pull(userId);
        } else {
            post.likes.push(userId);
        }
        await post.save();
        res.json({ liked: !alreadyLiked, likeCount: post.likes.length });
    } catch (error) {
        console.error('Error toggling post like:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function addPostComment(req, res) {
    try {
        const { postId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;
        if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text is required' });
        const post = await PostModel.findByIdAndUpdate(
            postId,
            { $push: { comments: { user: userId, text: text.trim(), createdAt: new Date() } } },
            { new: true }
        ).populate('comments.user', 'fullName');
        if (!post) return res.status(404).json({ message: 'Post not found' });
        const newComment = post.comments[post.comments.length - 1];
        res.status(201).json({ comment: newComment });
    } catch (error) {
        console.error('Error adding post comment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    createPost,
    getPosts,
    getPostsByFoodPartner,
    togglePostLike,
    addPostComment
};

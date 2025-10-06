const express = require('express');
const postController = require('../controllers/post.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const router = express.Router();
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10 // Maximum 10 files
    }
});

// Create a new post
router.post('/',
    authMiddleware.authFoodPartnerMiddleware,
    upload.array('images', 10), // Allow up to 10 images
    postController.createPost
);

// Get all posts (public)
router.get('/',
    postController.getPosts
);

// Get posts by specific food partner
router.get('/my-posts',
    authMiddleware.authFoodPartnerMiddleware,
    postController.getPostsByFoodPartner
);

module.exports = router;

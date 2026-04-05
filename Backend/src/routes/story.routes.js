const express = require('express');
const storyController = require('../controllers/story.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const router = express.Router();
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 200 * 1024 * 1024 // 200MB limit for video files
    }
});

// Create a new story
router.post('/',
    authMiddleware.authFoodPartnerMiddleware,
    upload.single('video'),
    storyController.createStory
);

// Get all stories (public)
router.get('/',
    storyController.getStories
);

// Get stories by specific food partner
router.get('/my-stories',
    authMiddleware.authFoodPartnerMiddleware,
    storyController.getStoriesByFoodPartner
);

// Mark story as viewed
router.post('/:storyId/view',
    storyController.markStoryAsViewed
);

module.exports = router;

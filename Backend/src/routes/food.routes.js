const express = require('express');
const foodController = require('../controllers/food.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const router = express.Router();
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB limit for video files
    }
});

// Create a new reel
router.post('/',
    authMiddleware.authFoodPartnerMiddleware,
    upload.single("video"),
    foodController.createFood
);

// Get all reels (public)
router.get('/',
    foodController.getFoodItem
);

// Get reels by specific food partner
router.get('/my-reels',
    authMiddleware.authFoodPartnerMiddleware,
    foodController.getReelsByFoodPartner
);

module.exports = router;

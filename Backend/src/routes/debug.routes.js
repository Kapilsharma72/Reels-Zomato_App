const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Debug endpoints — only mounted when NODE_ENV === 'development'
router.get('/food-partners', authController.getAllFoodPartners);
router.get('/food-partners/:id', authController.debugFoodPartnerById);
router.post('/food-partners/create-test', authController.createTestFoodPartner);

module.exports = router;

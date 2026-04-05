const express = require('express');
const router = express.Router();
const { getTrendingFood, getTrendingRestaurants, getTrendingStreetFood } = require('../controllers/trending.controller');

router.get('/food', getTrendingFood);
router.get('/restaurants', getTrendingRestaurants);
router.get('/street-food', getTrendingStreetFood);

module.exports = router;

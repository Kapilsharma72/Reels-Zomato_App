const foodModel = require('../models/food.model');
const FoodPartnerModel = require('../models/foodPartner.model');
const orderModel = require('../models/order.model');

// Haversine distance in km between two lat/lng points
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const WEEK_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const MAX_DISTANCE_KM = 50; // show results within 50 km

// ── 1. Trending food items ────────────────────────────────────────────────────
async function getTrendingFood(req, res) {
  try {
    const { lat, lng, limit = 10 } = req.query;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasLocation = !isNaN(userLat) && !isNaN(userLng);

    const items = await foodModel
      .find({ isAvailable: { $ne: false }, createdAt: { $gte: WEEK_AGO() } })
      .populate('foodPartner', 'businessName name logo lat lng address')
      .select('dishName description price video music foodPartner likes comments views category createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Score = likes*3 + comments*2 + views
    let scored = items.map((item) => ({
      ...item,
      score: (item.likes?.length || 0) * 3 + (item.comments?.length || 0) * 2 + (item.views || 0),
      distance: hasLocation && item.foodPartner?.lat && item.foodPartner?.lng
        ? haversineDistance(userLat, userLng, item.foodPartner.lat, item.foodPartner.lng)
        : null,
    }));

    if (hasLocation) {
      scored = scored.filter((i) => i.distance === null || i.distance <= MAX_DISTANCE_KM);
    }

    scored.sort((a, b) => b.score - a.score);

    res.json({ success: true, items: scored.slice(0, parseInt(limit)) });
  } catch (err) {
    console.error('getTrendingFood error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch trending food' });
  }
}

// ── 2. Trending restaurants ───────────────────────────────────────────────────
async function getTrendingRestaurants(req, res) {
  try {
    const { lat, lng, limit = 10 } = req.query;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasLocation = !isNaN(userLat) && !isNaN(userLng);

    // Aggregate likes + comments from food items this week per partner
    const foodAgg = await foodModel.aggregate([
      { $match: { createdAt: { $gte: WEEK_AGO() } } },
      {
        $group: {
          _id: '$foodPartner',
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          totalComments: { $sum: { $size: { $ifNull: ['$comments', []] } } },
          totalViews: { $sum: { $ifNull: ['$views', 0] } },
          reelCount: { $sum: 1 },
        },
      },
    ]);

    const scoreMap = {};
    foodAgg.forEach((r) => {
      scoreMap[r._id.toString()] = r.totalLikes * 3 + r.totalComments * 2 + r.totalViews + r.reelCount * 5;
    });

    const partners = await FoodPartnerModel.find({})
      .select('businessName name logo address lat lng rating ratingCount slogan')
      .lean();

    let scored = partners.map((p) => ({
      ...p,
      score: scoreMap[p._id.toString()] || 0,
      distance: hasLocation && p.lat && p.lng
        ? haversineDistance(userLat, userLng, p.lat, p.lng)
        : null,
    }));

    if (hasLocation) {
      scored = scored.filter((p) => p.distance === null || p.distance <= MAX_DISTANCE_KM);
    }

    scored.sort((a, b) => b.score - a.score);

    res.json({ success: true, restaurants: scored.slice(0, parseInt(limit)) });
  } catch (err) {
    console.error('getTrendingRestaurants error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch trending restaurants' });
  }
}

// ── 3. Trending street food ───────────────────────────────────────────────────
async function getTrendingStreetFood(req, res) {
  try {
    const { lat, lng, limit = 10 } = req.query;
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const hasLocation = !isNaN(userLat) && !isNaN(userLng);

    const items = await foodModel
      .find({
        isAvailable: { $ne: false },
        createdAt: { $gte: WEEK_AGO() },
        category: { $in: ['street_food', 'street food', 'streetfood', 'snacks', 'chaat'] },
      })
      .populate('foodPartner', 'businessName name logo lat lng address')
      .select('dishName description price video music foodPartner likes comments views category createdAt')
      .sort({ createdAt: -1 })
      .lean();

    let scored = items.map((item) => ({
      ...item,
      score: (item.likes?.length || 0) * 3 + (item.comments?.length || 0) * 2 + (item.views || 0),
      distance: hasLocation && item.foodPartner?.lat && item.foodPartner?.lng
        ? haversineDistance(userLat, userLng, item.foodPartner.lat, item.foodPartner.lng)
        : null,
    }));

    if (hasLocation) {
      scored = scored.filter((i) => i.distance === null || i.distance <= MAX_DISTANCE_KM);
    }

    scored.sort((a, b) => b.score - a.score);

    res.json({ success: true, items: scored.slice(0, parseInt(limit)) });
  } catch (err) {
    console.error('getTrendingStreetFood error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch trending street food' });
  }
}

module.exports = { getTrendingFood, getTrendingRestaurants, getTrendingStreetFood };

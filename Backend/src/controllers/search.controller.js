const foodModel = require('../models/food.model');
const FoodPartnerModel = require('../models/foodPartner.model');

async function search(req, res) {
    try {
        const { q, type = 'all' } = req.query;
        if (!q || q.trim().length < 1) {
            return res.json({ restaurants: [], dishes: [] });
        }
        const regex = { $regex: q.trim(), $options: 'i' };
        let restaurants = [];
        let dishes = [];
        if (type === 'all' || type === 'restaurant') {
            restaurants = await FoodPartnerModel.find({ businessName: regex })
                .select('businessName address rating logo')
                .limit(20);
        }
        if (type === 'all' || type === 'dish') {
            dishes = await foodModel.find({
                $or: [{ dishName: regex }, { category: regex }],
                isAvailable: true
            })
                .populate('foodPartner', 'businessName')
                .select('dishName description price category foodPartner')
                .limit(20);
        }
        res.json({ restaurants, dishes });
    } catch (error) {
        console.error('Error in search:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { search };

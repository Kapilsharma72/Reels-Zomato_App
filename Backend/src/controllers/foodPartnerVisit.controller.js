const foodPartnerModel = require('../models/foodPartner.model');
const foodModel = require('../models/food.model');

async function getFoodPartnerById(req, res) {
    try {
        const foodPartnerID = req.params.id;

        const foodPartner = await foodPartnerModel.findOne({ _id: foodPartnerID });

        const foodItemsByFoodPartner = await foodModel.find({ foodPartner: foodPartnerID });

        if (!foodPartner) {
            return res.status(404).json({ message: "Food partner not found" });
        }

        res.status(200).json({
            message: "Food partner fetched successfully",
            foodPartner:{
                ...foodPartner.toObject(),
                foodItems: foodItemsByFoodPartner,
                totalPosts: foodItemsByFoodPartner.length
            }
        });
    } catch (error) {
        console.error("Error fetching food partner:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports = {
    getFoodPartnerById
};

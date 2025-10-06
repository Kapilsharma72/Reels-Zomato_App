const FoodPartnerModel = require("../models/foodPartner.model");
const UserModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authFoodPartnerMiddleware(req, res, next) {
    console.log('authFoodPartnerMiddleware called');
    const token = req.cookies.token;
    console.log('Token from cookies:', token);
    
    if (!token) {
        console.log('No token found');
        return res.status(401).json({
            message: "Please login First",
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded token:', decoded);
        
        const foodPartner = await FoodPartnerModel.findById(decoded.id);
        console.log('Found food partner:', foodPartner ? 'Yes' : 'No');
        
        if (!foodPartner) {
            console.log('Food partner not found in database');
            console.log('Searched for ID:', decoded.id);
            
            // Check if the ID format is valid
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(decoded.id);
            console.log('Is valid ObjectId format:', isValidObjectId);
            
            // Count total food partners for debugging
            const totalCount = await FoodPartnerModel.countDocuments();
            console.log('Total food partners in database:', totalCount);
            
            // Clear the invalid token
            res.clearCookie("token");
            
            return res.status(401).json({
                message: "Food partner not found. Please login again.",
                debug: {
                    searchedId: decoded.id,
                    isValidObjectId: isValidObjectId,
                    totalFoodPartners: totalCount
                }
            });
        }
        req.foodPartner = foodPartner;
        console.log('Food partner attached to request');
        next();
    } catch (err) {
        console.log('Token verification error:', err.message);
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}

async function authUserMiddleware(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            message: "please login first"
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}

async function profileDataMiddleware(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            message: "Please login first"
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Try to find user first
        let user = await UserModel.findById(decoded.id);
        if (user) {
            req.user = user;
            return next();
        }
        // If not user, try food partner
        let foodPartner = await FoodPartnerModel.findById(decoded.id);
        if (foodPartner) {
            req.foodPartner = foodPartner;
            return next();
        }
        return res.status(401).json({
            message: "User or Food Partner not found"
        });
    } catch (err) {
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}

module.exports = {
    authFoodPartnerMiddleware,
    authUserMiddleware,
    profileDataMiddleware
}

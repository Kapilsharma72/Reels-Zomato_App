const FoodPartnerModel = require("../models/foodPartner.model");
const UserModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

async function authFoodPartnerMiddleware(req, res, next) {
    const token = req.cookies.token;
    
    if (!token) {
        return res.status(401).json({
            message: "Please login First",
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const foodPartner = await FoodPartnerModel.findById(decoded.id);
        
        if (!foodPartner) {
            res.clearCookie("token");
            return res.status(401).json({
                message: "Food partner not found. Please login again.",
            });
        }
        req.foodPartner = foodPartner;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token expired, please login again"
            });
        }
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
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token expired, please login again"
            });
        }
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}

async function adminMiddleware(req, res, next) {
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
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                message: "Admin access required"
            });
        }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token expired, please login again"
            });
        }
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
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token expired, please login again"
            });
        }
        return res.status(401).json({
            message: "Invalid token"
        });
    }
}

module.exports = {
    authFoodPartnerMiddleware,
    authUserMiddleware,
    adminMiddleware,
    profileDataMiddleware
}

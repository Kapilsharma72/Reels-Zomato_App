const UserModel = require('../models/user.model');
const FoodPartnerModel = require('../models/foodPartner.model');
const OrderModel = require('../models/order.model');
const foodModel = require('../models/food.model');

async function getStats(req, res) {
    try {
        const [users, foodPartners, orders, reels] = await Promise.all([
            UserModel.countDocuments(),
            FoodPartnerModel.countDocuments(),
            OrderModel.countDocuments(),
            foodModel.countDocuments()
        ]);
        res.json({ users, foodPartners, orders, reels });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getUsers(req, res) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            UserModel.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
            UserModel.countDocuments()
        ]);
        res.json({ users, total, page, pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateUserRole(req, res) {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        const validRoles = ['user', 'delivery-partner', 'editor', 'admin'];
        if (!validRoles.includes(role)) return res.status(400).json({ message: 'Invalid role' });
        const user = await UserModel.findByIdAndUpdate(userId, { role }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Role updated', user: { id: user._id, role: user.role } });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deactivateUser(req, res) {
    try {
        const { userId } = req.params;
        const user = await UserModel.findByIdAndUpdate(userId, { isActive: false }, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deactivated' });
    } catch (error) {
        console.error('Error deactivating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { getStats, getUsers, updateUserRole, deactivateUser };

const foodModel = require('../models/food.model');

async function createMenuItem(req, res) {
    try {
        const { dishName, description, price, category, imageUrl } = req.body;
        if (!dishName || !description || !price) {
            return res.status(400).json({ message: 'dishName, description, and price are required' });
        }
        const itemData = {
            dishName,
            description,
            price: parseFloat(price),
            category: category || 'main',
            foodPartner: req.foodPartner._id,
            isAvailable: true,
            video: ''
        };
        if (imageUrl) {
            itemData.imageUrl = imageUrl;
        }
        const item = await foodModel.create(itemData);
        res.status(201).json({ message: 'Menu item created', item });
    } catch (error) {
        console.error('Error creating menu item:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function getMenuItems(req, res) {
    try {
        const items = await foodModel.find({ foodPartner: req.foodPartner._id })
            .sort({ createdAt: -1 });
        res.json({ items });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateMenuItem(req, res) {
    try {
        const { itemId } = req.params;
        const updates = { ...req.body };
        delete updates._id;
        delete updates.foodPartner;
        const item = await foodModel.findOneAndUpdate(
            { _id: itemId, foodPartner: req.foodPartner._id },
            updates,
            { new: true, runValidators: true }
        );
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item updated', item });
    } catch (error) {
        console.error('Error updating menu item:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function deleteMenuItem(req, res) {
    try {
        const { itemId } = req.params;
        const item = await foodModel.findOneAndDelete({ _id: itemId, foodPartner: req.foodPartner._id });
        if (!item) return res.status(404).json({ message: 'Item not found' });
        res.json({ message: 'Item deleted' });
    } catch (error) {
        console.error('Error deleting menu item:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = { createMenuItem, getMenuItems, updateMenuItem, deleteMenuItem };

const mongoose = require('mongoose');

const foodPartnerSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: true
    },
    slogan: {
        type: String,
        default: ""
    },
    logo: {
        type: String,
        default: ""
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    totalCustomers: {
        type: Number,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});


const FoodPartnerModel=mongoose.model('FoodPartner', foodPartnerSchema);

module.exports = FoodPartnerModel;


const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: { 
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
    phoneNumber: {
        type: String,
        default: ""
    },
    role: {
        type: String,
        enum: ['user', 'delivery-partner', 'editor', 'admin'],
        default: 'user'
    },
    savedAddresses: [{
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        landmark: { type: String, default: '' },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        type: { type: String, default: 'Home' }
    }],
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Additional fields for delivery partners
    vehicleType: {
        type: String,
        default: ""
    },
    licenseNumber: {
        type: String,
        default: ""
    },
    // Additional fields for editors
    experience: {
        type: String,
        default: ""
    },
    portfolio: {
        type: String,
        default: ""
    }
}, { 
    timestamps: true 
});

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
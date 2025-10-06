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
        enum: ['user', 'delivery-partner', 'editor'],
        default: 'user'
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
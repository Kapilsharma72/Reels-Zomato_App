const UserModel = require("../models/user.model");
const FoodPartnerModel = require("../models/foodPartner.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const nodemailer = require('nodemailer');


async function registerUser(req, res) {
  try {
    const { fullName, email, password, phoneNumber, role, vehicleType, licenseNumber, experience, portfolio } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required' });
    }

    const isUserAlreadyPresent = await UserModel.findOne({ email });
    if (isUserAlreadyPresent) {
      return res.status(400).json({ message: 'User already exists, please login' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      fullName, email, password: hashedPassword,
      phoneNumber: phoneNumber || '', role: role || 'user',
      vehicleType: vehicleType || '', licenseNumber: licenseNumber || '',
      experience: experience || '', portfolio: portfolio || ''
    });

    const userType = user.role === 'delivery-partner' ? 'delivery-partner'
      : user.role === 'editor' ? 'editor' : 'user';

    const token = jwt.sign({ id: user._id, userType }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 604800000
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('registerUser error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const userType = user.role === 'delivery-partner' ? 'delivery-partner'
      : user.role === 'editor' ? 'editor' : 'user';

    const token = jwt.sign({ id: user._id, userType }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 604800000
    });

    res.status(200).json({
      message: 'User logged in successfully',
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('loginUser error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function logoutUser(req, res) {
    res.clearCookie("token");
    res.status(200).json
    ({ message: "User logged out successfully" });
}

async function getCurrentUser(req, res) {
    try {
        // The user is already attached to req by the authUserMiddleware
        const user = req.user;
        
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User retrieved successfully",
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

async function registerFoodPartner(req, res) {
  try {
    const { businessName, name, email, password, address, phoneNumber } = req.body;
    if (!businessName || !name || !email || !password || !address || !phoneNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const isFoodPartnerAlreadyPresent = await FoodPartnerModel.findOne({ email });
    if (isFoodPartnerAlreadyPresent) {
      return res.status(400).json({ message: 'Food Partner already exists, please login' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const foodPartner = await FoodPartnerModel.create({
      businessName, name, email, password: hashedPassword, address, phoneNumber
    });

    const token = jwt.sign({ id: foodPartner._id, userType: 'food-partner' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 604800000
    });

    res.status(201).json({
      message: 'Food Partner registered successfully',
      foodPartner: {
        id: foodPartner._id, businessName: foodPartner.businessName,
        name: foodPartner.name, email: foodPartner.email,
        address: foodPartner.address, phoneNumber: foodPartner.phoneNumber
      }
    });
  } catch (error) {
    console.error('registerFoodPartner error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function loginFoodPartner(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const foodPartner = await FoodPartnerModel.findOne({ email });
    if (!foodPartner) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, foodPartner.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: foodPartner._id, userType: 'food-partner' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 604800000
    });

    res.status(200).json({
      message: 'Food Partner logged in successfully',
      foodPartner: {
        id: foodPartner._id, businessName: foodPartner.businessName,
        name: foodPartner.name, email: foodPartner.email,
        address: foodPartner.address, phoneNumber: foodPartner.phoneNumber
      }
    });
  } catch (error) {
    console.error('loginFoodPartner error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function logoutFoodPartner(req, res) {
    res.clearCookie("token");
    res.status(200).json
    ({ message: "Food Partner logged out successfully" });
}

async function getCurrentFoodPartner(req, res) {
    try {
        const foodPartner = req.foodPartner;
        
        if (!foodPartner) {
            return res.status(401).json({ message: "Food Partner not found" });
        }

        res.status(200).json({
            message: "Food Partner retrieved successfully",
            foodPartner: {
                id: foodPartner._id,
                businessName: foodPartner.businessName,
                name: foodPartner.name,
                email: foodPartner.email,
                address: foodPartner.address,
                phoneNumber: foodPartner.phoneNumber,
                slogan: foodPartner.slogan,
                logo: foodPartner.logo,
                totalCustomers: foodPartner.totalCustomers,
                rating: foodPartner.rating
            }
        });
    } catch (error) {
        console.error('Error getting current food partner:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Debug function to list all food partners — DEVELOPMENT ONLY
async function getAllFoodPartners(req, res) {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Not found' });
    }
    try {
        const foodPartners = await FoodPartnerModel.find({});
        res.status(200).json({
            message: "All food partners retrieved",
            foodPartners: foodPartners.map(fp => ({
                id: fp._id,
                businessName: fp.businessName,
                email: fp.email,
                name: fp.name
            }))
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get all available editors
async function getAvailableEditors(req, res) {
    try {
        const editors = await UserModel.find({ role: 'editor' })
            .select('fullName email experience portfolio')
            .sort({ fullName: 1 });

        res.status(200).json({
            success: true,
            message: "Available editors retrieved successfully",
            editors: editors.map(editor => ({
                id: editor._id,
                fullName: editor.fullName,
                email: editor.email,
                experience: editor.experience,
                portfolio: editor.portfolio
            }))
        });
    } catch (error) {
        console.error('Error getting available editors:', error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
}

// Update food partner profile
async function updateFoodPartnerProfile(req, res) {
    try {
        const foodPartnerId = req.foodPartner._id;
        const updateData = req.body;
        
        // Remove sensitive fields that shouldn't be updated through this endpoint
        delete updateData.password;
        delete updateData._id;
        delete updateData.createdAt;
        delete updateData.updatedAt;
        
        // Validate required fields
        if (updateData.email) {
            // Check if email is already taken by another food partner
            const existingPartner = await FoodPartnerModel.findOne({ 
                email: updateData.email, 
                _id: { $ne: foodPartnerId } 
            });
            if (existingPartner) {
                return res.status(400).json({ 
                    message: "Email already exists for another food partner" 
                });
            }
        }
        
        // Update the food partner
        const updatedFoodPartner = await FoodPartnerModel.findByIdAndUpdate(
            foodPartnerId,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedFoodPartner) {
            return res.status(404).json({ message: "Food partner not found" });
        }
        
        res.status(200).json({
            message: "Profile updated successfully",
            foodPartner: {
                id: updatedFoodPartner._id,
                businessName: updatedFoodPartner.businessName,
                name: updatedFoodPartner.name,
                email: updatedFoodPartner.email,
                address: updatedFoodPartner.address,
                phoneNumber: updatedFoodPartner.phoneNumber,
                slogan: updatedFoodPartner.slogan,
                logo: updatedFoodPartner.logo,
                totalCustomers: updatedFoodPartner.totalCustomers,
                rating: updatedFoodPartner.rating
            }
        });
    } catch (error) {
        console.error('Error updating food partner profile:', error);
        res.status(500).json({ 
            message: "Internal server error",
            error: error.message 
        });
    }
}

// Debug function to check specific food partner by ID — DEVELOPMENT ONLY
async function debugFoodPartnerById(req, res) {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Not found' });
    }
    try {
        const { id } = req.params;
        const foodPartner = await FoodPartnerModel.findById(id);
        if (!foodPartner) {
            return res.status(404).json({ message: "Food partner not found" });
        }
        res.status(200).json({
            message: "Food partner found",
            foodPartner: { id: foodPartner._id, businessName: foodPartner.businessName, email: foodPartner.email, name: foodPartner.name }
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}

// Create a test food partner — DEVELOPMENT ONLY
async function createTestFoodPartner(req, res) {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ message: 'Not found' });
    }
    try {
        const existingTestPartner = await FoodPartnerModel.findOne({ email: 'test@restaurant.com' });
        if (existingTestPartner) {
            return res.status(200).json({
                message: "Test food partner already exists",
                foodPartner: { id: existingTestPartner._id, businessName: existingTestPartner.businessName, email: existingTestPartner.email }
            });
        }
        const hashedPassword = await bcrypt.hash('test123', 10);
        const testFoodPartner = await FoodPartnerModel.create({
            businessName: 'Test Restaurant', name: 'Test Owner',
            email: 'test@restaurant.com', password: hashedPassword,
            address: '123 Test Street, Test City', phoneNumber: '+91 9876543210',
            slogan: 'Delicious Test Food', totalCustomers: 0, rating: 4.5
        });
        res.status(201).json({
            message: "Test food partner created successfully",
            foodPartner: { id: testFoodPartner._id, businessName: testFoodPartner.businessName, email: testFoodPartner.email },
            credentials: { email: 'test@restaurant.com', password: 'test123' }
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
}


async function updateUserProfile(req, res) {
    try {
        const userId = req.user._id;
        const { fullName, email, phoneNumber } = req.body;
        if (email) {
            const existing = await UserModel.findOne({ email, _id: { $ne: userId } });
            if (existing) return res.status(400).json({ message: 'Email already in use' });
        }
        const updated = await UserModel.findByIdAndUpdate(
            userId,
            { ...(fullName && { fullName }), ...(email && { email }), ...(phoneNumber !== undefined && { phoneNumber }) },
            { new: true, runValidators: true }
        );
        res.json({ message: 'Profile updated successfully', user: { id: updated._id, fullName: updated.fullName, email: updated.email, phoneNumber: updated.phoneNumber } });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function changePassword(req, res) {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both current and new password are required' });
        const user = await UserModel.findById(userId);
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return res.status(400).json({ message: 'Current password is incorrect' });
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function addAddress(req, res) {
    try {
        const userId = req.user._id;
        const { name, phone, address, landmark, city, pincode, type } = req.body;
        if (!name || !phone || !address || !city || !pincode) return res.status(400).json({ message: 'name, phone, address, city, and pincode are required' });
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $push: { savedAddresses: { name, phone, address, landmark: landmark || '', city, pincode, type: type || 'Home' } } },
            { new: true }
        );
        const newAddress = user.savedAddresses[user.savedAddresses.length - 1];
        res.status(201).json({ message: 'Address added', address: newAddress });
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteAddress(req, res) {
    try {
        const userId = req.user._id;
        const { addressId } = req.params;
        const user = await UserModel.findById(userId);
        const addr = user.savedAddresses.id(addressId);
        if (!addr) return res.status(404).json({ message: 'Address not found' });
        await UserModel.findByIdAndUpdate(userId, { $pull: { savedAddresses: { _id: addressId } } });
        res.json({ message: 'Address removed' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getUserAddresses(req, res) {
    try {
        const user = await UserModel.findById(req.user._id).select('savedAddresses');
        res.json({ addresses: user.savedAddresses });
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;
        const user = await UserModel.findOne({ email });
        // Always return 200 to prevent enumeration
        if (!user) {
            return res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
        }
        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save({ validateBeforeSave: false });
        // Send email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            await transporter.sendMail({
                from: process.env.EMAIL_FROM || 'noreply@reelzomato.com',
                to: user.email,
                subject: 'ReelZomato Password Reset',
                html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p><p>If you did not request this, please ignore this email.</p>`
            });
        } catch (emailError) {
            console.error('Email send error:', emailError.message);
            // Clear reset token if email fails
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Error sending email. Please try again.' });
        }
        res.status(200).json({ message: 'If that email exists, a reset link has been sent' });
    } catch (error) {
        console.error('Error in forgotPassword:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function resetPassword(req, res) {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await UserModel.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Reset token is invalid or has expired' });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Error in resetPassword:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    registerFoodPartner,
    loginFoodPartner,
    logoutFoodPartner,
    getCurrentFoodPartner,
    updateFoodPartnerProfile,
    getAllFoodPartners,
    debugFoodPartnerById,
    createTestFoodPartner,
    getAvailableEditors,
    updateUserProfile,
    changePassword,
    addAddress,
    deleteAddress,
    getUserAddresses,
    forgotPassword,
    resetPassword
};
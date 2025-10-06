const UserModel = require("../models/user.model");
const FoodPartnerModel = require("../models/foodPartner.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


async function registerUser(req, res) {

    const { fullName, email, password, phoneNumber, role, vehicleType, licenseNumber, experience, portfolio } = req.body;
    
    const isUserAlreadyPresent = await UserModel.findOne({ 
        email 
    });

    if (isUserAlreadyPresent) {
        return res.status(400).json
        ({ message: "User already exists, please login" 

        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UserModel.create({
        fullName,
        email,
        password: hashedPassword,
        phoneNumber: phoneNumber || "",
        role: role || "user",
        vehicleType: vehicleType || "",
        licenseNumber: licenseNumber || "",
        experience: experience || "",
        portfolio: portfolio || ""
    });

    const token = jwt.sign({
        id: user._id,
    },process.env.JWT_SECRET);

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    res.status(201).json({
        message: "User registered successfully",
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        },
    });


}

async function loginUser(req, res) {

    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });

    if (!user) {
        return res.status(400).json
        ({ message: "Invaild email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json
        ({ message: "Invalid email or password" });
    }
    const token = jwt.sign({
        id: user._id,
    },process.env.JWT_SECRET);
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })

    res.status(200).json({
        message: "User logged in successfully", 
        user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role
        },
    });


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
    const { businessName, name, email, password, address, phoneNumber } = req.body;

    const isFoodPartnerAlreadyPresent = await FoodPartnerModel.findOne({ email });

    if (isFoodPartnerAlreadyPresent) {
        return res.status(400).json
        ({ message: "Food Partner already exists, please login" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const foodPartner = await FoodPartnerModel.create({
        businessName,
        name,
        email,
        password: hashedPassword,
        address,
        phoneNumber
    });
    const token = jwt.sign({
        id: foodPartner._id,
    },process.env.JWT_SECRET);
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })
    res.status(201).json({
        message: "Food Partner registered successfully",
        foodPartner: {
            id: foodPartner._id,
            businessName: foodPartner.businessName,
            name: foodPartner.name,
            email: foodPartner.email,
            address: foodPartner.address,
            phoneNumber: foodPartner.phoneNumber
        },
    });
}

async function loginFoodPartner(req, res) {
    const { email, password } = req.body;

    const foodPartner = await FoodPartnerModel.findOne({ email });

    if (!foodPartner) {
        return res.status(400).json
        ({ message: "Invaild email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, foodPartner.password);
    if (!isPasswordValid) {
        return res.status(400).json
        ({ message: "Invalid email or password" });
    }
    const token = jwt.sign({
        id: foodPartner._id,
    },process.env.JWT_SECRET);
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })
    res.status(200).json({
        message: "Food Partner logged in successfully",
        foodPartner: {
            id: foodPartner._id,
            businessName: foodPartner.businessName,
            name: foodPartner.name,
            email: foodPartner.email,
            address: foodPartner.address,
            phoneNumber: foodPartner.phoneNumber
        },
    });
}

async function logoutFoodPartner(req, res) {
    res.clearCookie("token");
    res.status(200).json
    ({ message: "Food Partner logged out successfully" });
}

async function getCurrentFoodPartner(req, res) {
    try {
        console.log('getCurrentFoodPartner called');
        console.log('req.foodPartner:', req.foodPartner);
        console.log('req.cookies:', req.cookies);
        
        // The food partner is already attached to req by the authFoodPartnerMiddleware
        const foodPartner = req.foodPartner;
        
        if (!foodPartner) {
            console.log('No food partner found in request');
            return res.status(401).json({ message: "Food Partner not found" });
        }

        console.log('Food partner found:', {
            id: foodPartner._id,
            businessName: foodPartner.businessName,
            email: foodPartner.email,
            name: foodPartner.name
        });

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

// Debug function to list all food partners (remove in production)
async function getAllFoodPartners(req, res) {
    try {
        const foodPartners = await FoodPartnerModel.find({});
        console.log('All food partners:', foodPartners);
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
        console.error('Error getting all food partners:', error);
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

// Debug function to check specific food partner by ID
async function debugFoodPartnerById(req, res) {
    try {
        const { id } = req.params;
        console.log('Debug: Looking for food partner with ID:', id);
        
        const foodPartner = await FoodPartnerModel.findById(id);
        console.log('Debug: Found food partner:', foodPartner);
        
        if (!foodPartner) {
            // Check if the ID format is valid
            const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
            console.log('Debug: Is valid ObjectId format:', isValidObjectId);
            
            // Count total food partners
            const totalCount = await FoodPartnerModel.countDocuments();
            console.log('Debug: Total food partners in database:', totalCount);
            
            return res.status(404).json({
                message: "Food partner not found",
                debug: {
                    searchedId: id,
                    isValidObjectId: isValidObjectId,
                    totalFoodPartners: totalCount
                }
            });
        }
        
        res.status(200).json({
            message: "Food partner found",
            foodPartner: {
                id: foodPartner._id,
                businessName: foodPartner.businessName,
                email: foodPartner.email,
                name: foodPartner.name
            }
        });
    } catch (error) {
        console.error('Error debugging food partner:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Create a test food partner for development
async function createTestFoodPartner(req, res) {
    try {
        // Check if test food partner already exists
        const existingTestPartner = await FoodPartnerModel.findOne({ email: 'test@restaurant.com' });
        
        if (existingTestPartner) {
            return res.status(200).json({
                message: "Test food partner already exists",
                foodPartner: {
                    id: existingTestPartner._id,
                    businessName: existingTestPartner.businessName,
                    email: existingTestPartner.email,
                    name: existingTestPartner.name
                }
            });
        }

        // Create test food partner
        const hashedPassword = await bcrypt.hash('test123', 10);
        
        const testFoodPartner = await FoodPartnerModel.create({
            businessName: 'Test Restaurant',
            name: 'Test Owner',
            email: 'test@restaurant.com',
            password: hashedPassword,
            address: '123 Test Street, Test City',
            phoneNumber: '+91 9876543210',
            slogan: 'Delicious Test Food',
            totalCustomers: 0,
            rating: 4.5
        });

        res.status(201).json({
            message: "Test food partner created successfully",
            foodPartner: {
                id: testFoodPartner._id,
                businessName: testFoodPartner.businessName,
                email: testFoodPartner.email,
                name: testFoodPartner.name
            },
            credentials: {
                email: 'test@restaurant.com',
                password: 'test123'
            }
        });
    } catch (error) {
        console.error('Error creating test food partner:', error);
        res.status(500).json({ message: "Internal server error" });
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
    getAvailableEditors
};
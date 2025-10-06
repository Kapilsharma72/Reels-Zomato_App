const mongoose = require('mongoose');
const FoodPartnerModel = require('./src/models/foodPartner.model');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function debugDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if there are any food partners
        const foodPartners = await FoodPartnerModel.find({});
        console.log(`\nFound ${foodPartners.length} food partners in database:`);
        
        foodPartners.forEach((fp, index) => {
            console.log(`${index + 1}. ID: ${fp._id}`);
            console.log(`   Business Name: ${fp.businessName}`);
            console.log(`   Email: ${fp.email}`);
            console.log(`   Name: ${fp.name}`);
            console.log('');
        });

        // If no food partners exist, create a test one
        if (foodPartners.length === 0) {
            console.log('No food partners found. Creating a test food partner...');
            
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

            console.log('Test food partner created:');
            console.log(`ID: ${testFoodPartner._id}`);
            console.log(`Business Name: ${testFoodPartner.businessName}`);
            console.log(`Email: ${testFoodPartner.email}`);
            console.log(`Password: test123`);
        }

        // Check the specific ID from the error
        const problemId = '68cef6d7fb2277cb8ee09b32';
        console.log(`\nChecking for the problematic ID: ${problemId}`);
        const specificFoodPartner = await FoodPartnerModel.findById(problemId);
        
        if (specificFoodPartner) {
            console.log('Found food partner with the problematic ID:');
            console.log(`Business Name: ${specificFoodPartner.businessName}`);
            console.log(`Email: ${specificFoodPartner.email}`);
        } else {
            console.log('No food partner found with the problematic ID.');
            console.log('This explains why the authentication is failing.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

debugDatabase();

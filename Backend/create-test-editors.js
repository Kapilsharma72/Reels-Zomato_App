const mongoose = require('mongoose');
const UserModel = require('./src/models/user.model');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createTestEditors() {
    try {
        // Connect to MongoDB
        const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/reel-zomato";
        await mongoose.connect(dbUrl);
        console.log('Connected to MongoDB');

        // Check if editors already exist
        const existingEditors = await UserModel.find({ role: 'editor' });
        console.log(`Found ${existingEditors.length} existing editors`);

        if (existingEditors.length > 0) {
            console.log('Editors already exist. Skipping creation.');
            existingEditors.forEach((editor, index) => {
                console.log(`${index + 1}. ${editor.fullName} - ${editor.email}`);
            });
            return;
        }

        // Create test editors
        const testEditors = [
            {
                fullName: 'Sarah Johnson',
                email: 'sarah.johnson@editor.com',
                password: 'editor123',
                role: 'editor',
                experience: 'Food Videos Specialist - 5 years experience in restaurant marketing videos',
                portfolio: 'https://portfolio.sarahjohnson.com'
            },
            {
                fullName: 'Mike Chen',
                email: 'mike.chen@editor.com',
                password: 'editor123',
                role: 'editor',
                experience: 'Motion Graphics Expert - Specializes in dynamic food presentations',
                portfolio: 'https://portfolio.mikechen.com'
            },
            {
                fullName: 'Emma Davis',
                email: 'emma.davis@editor.com',
                password: 'editor123',
                role: 'editor',
                experience: 'Cinematic Editor - Creates stunning food documentaries and reviews',
                portfolio: 'https://portfolio.emmadavis.com'
            },
            {
                fullName: 'Alex Rodriguez',
                email: 'alex.rodriguez@editor.com',
                password: 'editor123',
                role: 'editor',
                experience: 'Social Media Specialist - Expert in viral food content',
                portfolio: 'https://portfolio.alexrodriguez.com'
            },
            {
                fullName: 'Lisa Wang',
                email: 'lisa.wang@editor.com',
                password: 'editor123',
                role: 'editor',
                experience: 'Color Grading Expert - Enhances food visuals with professional color correction',
                portfolio: 'https://portfolio.lisawang.com'
            }
        ];

        console.log('Creating test editors...');
        
        for (const editorData of testEditors) {
            const hashedPassword = await bcrypt.hash(editorData.password, 10);
            
            const editor = await UserModel.create({
                fullName: editorData.fullName,
                email: editorData.email,
                password: hashedPassword,
                role: editorData.role,
                experience: editorData.experience,
                portfolio: editorData.portfolio
            });

            console.log(`Created editor: ${editor.fullName} (${editor.email})`);
        }

        console.log('\nAll test editors created successfully!');
        console.log('You can now login with any of these editors using password: editor123');

    } catch (error) {
        console.error('Error creating test editors:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    }
}

createTestEditors();

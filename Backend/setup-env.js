const fs = require('fs');
const path = require('path');

// Environment variables template
const envContent = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017/reelzomato_dev
DB_URL=mongodb://localhost:27017/reel-zomato

# JWT Configuration
JWT_SECRET=your-development-jwt-secret-key-change-this-in-production

# Server Configuration
PORT=3001
HOST=127.0.0.1
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Upload Configuration
UPLOAD_PATH=./uploads
`;

const envPath = path.join(__dirname, '.env');

try {
  // Check if .env file already exists
  if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists');
    console.log('📝 Current .env file location:', envPath);
  } else {
    // Create .env file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully');
    console.log('📝 .env file location:', envPath);
  }
  
  console.log('\n🔧 Environment variables configured:');
  console.log('   - MONGODB_URI: mongodb://localhost:27017/reelzomato_dev');
  console.log('   - JWT_SECRET: your-development-jwt-secret-key-change-this-in-production');
  console.log('   - PORT: 3001');
  console.log('   - HOST: 127.0.0.1');
  console.log('   - NODE_ENV: development');
  
  console.log('\n💡 Next steps:');
  console.log('   1. Make sure MongoDB is running on your system');
  console.log('   2. Start MongoDB with: mongod');
  console.log('   3. Run your server with: npm start or npm run dev');
  
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('\n📝 Please create a .env file manually with the following content:');
  console.log(envContent);
}

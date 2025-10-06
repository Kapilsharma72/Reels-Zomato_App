// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');

async function testMongoDBConnection() {
  console.log('🧪 Testing MongoDB Connection...\n');
  
  // Test different connection strings
  const connectionStrings = [
    process.env.MONGODB_URI || 'mongodb://localhost:27017/reelzomato_dev',
    process.env.DB_URL || 'mongodb://localhost:27017/reel-zomato',
    'mongodb://localhost:27017/test'
  ];
  
  for (let i = 0; i < connectionStrings.length; i++) {
    const uri = connectionStrings[i];
    console.log(`🔄 Test ${i + 1}: Trying to connect to ${uri}`);
    
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });
      
      console.log('✅ Connection successful!');
      console.log(`📊 Database: ${mongoose.connection.name}`);
      console.log(`🌐 Host: ${mongoose.connection.host}`);
      console.log(`🔌 Port: ${mongoose.connection.port}`);
      console.log(`🔗 Ready State: ${mongoose.connection.readyState}`);
      
      // Test a simple operation
      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📁 Collections found: ${collections.length}`);
      
      await mongoose.connection.close();
      console.log('✅ Connection closed successfully\n');
      
      // If we get here, the connection worked
      console.log('🎉 MongoDB is working correctly!');
      console.log('💡 Use this connection string in your .env file:');
      console.log(`   MONGODB_URI=${uri}`);
      return;
      
    } catch (error) {
      console.log('❌ Connection failed:', error.message);
      
      if (error.message.includes('ECONNREFUSED')) {
        console.log('💡 MongoDB is not running. Start it with: mongod');
      } else if (error.message.includes('authentication failed')) {
        console.log('💡 Authentication failed. Check your credentials.');
      } else if (error.message.includes('timeout')) {
        console.log('💡 Connection timed out. Check if MongoDB is accessible.');
      }
      console.log('');
    }
  }
  
  console.log('❌ All connection attempts failed.');
  console.log('\n🔧 Troubleshooting steps:');
  console.log('1. Make sure MongoDB is installed and running');
  console.log('2. Check if MongoDB is running on the default port 27017');
  console.log('3. Try starting MongoDB with: mongod');
  console.log('4. Check MongoDB logs for any errors');
  console.log('5. Verify your connection string format');
  
  process.exit(1);
}

// Run the test
testMongoDBConnection().catch(console.error);

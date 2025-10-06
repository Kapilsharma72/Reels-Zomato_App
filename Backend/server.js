// Load environment variables first
require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const websocketService = require('./src/services/websocket.service');
const mongoose = require('mongoose');
const config = require('./config');

// Set environment
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = config.database.uri;
    const options = config.database.options;
    
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📍 Connection URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB connected successfully');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('🔌 Port:', mongoose.connection.port);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('🔍 Error details:', error);
    
    // Check if MongoDB is running
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Make sure MongoDB is running on your system');
      console.error('💡 Start MongoDB with: mongod (or brew services start mongodb-community on macOS)');
    } else if (error.message.includes('authentication failed')) {
      console.error('💡 Check your MongoDB credentials');
    } else if (error.message.includes('timeout')) {
      console.error('💡 MongoDB connection timed out - check if MongoDB is accessible');
    }
    
    console.warn('⚠️ Server will continue without database connection');
    console.warn('⚠️ Some features may not work properly');
    // Don't exit - let server continue without database
  }
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      // Close WebSocket connections
      websocketService.shutdown();
      
      // Close MongoDB connection
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 30000);
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Start HTTP server
    const port = config.server.port;
    const host = config.server.host;
    
    server.listen(port, host, () => {
      console.log(`🚀 ReelZomato server running on ${host}:${port}`);
      console.log(`📱 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 WebSocket endpoint: ws://${host}:${port}/ws`);
      console.log(`📊 Health check: http://${host}:${port}/health`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }
      
      const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;
      
      switch (error.code) {
        case 'EACCES':
          console.error(`❌ ${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`❌ ${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export for testing
module.exports = { server, app };
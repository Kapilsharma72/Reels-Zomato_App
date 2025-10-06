module.exports = {
  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || process.env.DB_URL || 'mongodb://localhost:27017/reelzomato_dev',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-development-jwt-secret-key',
    expiresIn: '24h',
    refreshExpiresIn: '7d'
  },

  // Server configuration
  server: {
    port: process.env.PORT || 3001,
    host: process.env.HOST || '127.0.0.1',
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
    }
  },

  // File upload configuration
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/webm'
    ],
    uploadPath: process.env.UPLOAD_PATH || './uploads'
  },

  // WebSocket configuration
  websocket: {
    path: '/ws',
    heartbeatInterval: 30000, // 30 seconds
    connectionTimeout: 300000, // 5 minutes
    maxConnections: 1000
  }
};

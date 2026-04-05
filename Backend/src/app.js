const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require('helmet');
// express-mongo-sanitize is incompatible with Express 5 (req.query is read-only)
// Using a custom sanitizer instead
function sanitizeValue(val) {
    if (val && typeof val === 'object') {
        for (const key of Object.keys(val)) {
            if (key.startsWith('$') || key.includes('.')) {
                delete val[key];
            } else {
                sanitizeValue(val[key]);
            }
        }
    }
    return val;
}
function mongoSanitize() {
    return (req, res, next) => {
        if (req.body) sanitizeValue(req.body);
        if (req.params) sanitizeValue(req.params);
        next();
    };
}
const authRoutes = require("./routes/auth.routes");
const foodRoutes = require("./routes/food.routes");
const foodPartnerVisitRoutes = require('./routes/foodPartnerVisit.routes');
const postRoutes = require('./routes/post.routes');
const storyRoutes = require('./routes/story.routes');
const orderRoutes = require('./routes/order.routes');
const videoSubmissionRoutes = require('./routes/videoSubmission.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const websocketRoutes = require('./routes/websocket.routes');
const menuRoutes = require('./routes/menu.routes');
const searchRoutes = require('./routes/search.routes');
const adminRoutes = require('./routes/admin.routes');
const trendingRoutes = require('./routes/trending.routes');

const cors = require('cors');
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
const devOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : devOrigins;

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/health', async (req, res) => {
    const mongoose = require('mongoose');
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    const healthy = dbState === 1;
    res.status(healthy ? 200 : 503).json({ 
        status: healthy ? 'OK' : 'DEGRADED',
        database: dbStatus,
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);

// Debug routes — only available in development
if (process.env.NODE_ENV === 'development') {
    const debugRoutes = require('./routes/debug.routes');
    app.use('/api/debug', debugRoutes);
}
app.use("/api/food", foodRoutes);
app.use('/api/food-partner/menu', menuRoutes);
app.use('/api/food-partner', foodPartnerVisitRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/video-submissions', videoSubmissionRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/websocket', websocketRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trending', trendingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large. Maximum allowed size is 200MB.',
      error: 'LIMIT_FILE_SIZE'
    });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Payload too large. Please reduce file size.',
      error: 'File size exceeds limit'
    });
  }
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      error: 'Request body parsing failed'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

module.exports = app;

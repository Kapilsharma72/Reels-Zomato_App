const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const foodRoutes = require("./routes/food.routes");
const foodPartnerVisitRoutes = require('./routes/foodPartnerVisit.routes');
const postRoutes = require('./routes/post.routes');
const storyRoutes = require('./routes/story.routes');
const orderRoutes = require('./routes/order.routes');
const videoSubmissionRoutes = require('./routes/videoSubmission.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const websocketRoutes = require('./routes/websocket.routes');

const cors = require('cors');
const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
// Increase payload limit for file uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());



// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/food", foodRoutes);
app.use('/api/food-partner', foodPartnerVisitRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/video-submissions', videoSubmissionRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/websocket', websocketRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
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
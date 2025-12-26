const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
const scrapeRoutes = require('./routes/scrape');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Increase payload limit for large HTML content
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', scrapeRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Multi-Platform Profile Scraper Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Multi-Platform Profile Scraper API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      scrapeProfile: 'POST /api/scrape-profile',
      getProfiles: 'GET /api/profiles/:platform',
      supportedPlatforms: 'GET /api/supported-platforms'
    },
    supportedPlatforms: ['linkedin', 'instagram']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync database models
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');
    
    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════════╗');
      console.log('║   Multi-Platform Profile Scraper Backend          ║');
      console.log('╚════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`🚀 Server running on: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔍 Supported platforms: LinkedIn, Instagram`);
      console.log('');
      console.log('Ready to receive HTML handoffs from Chrome Extension!');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
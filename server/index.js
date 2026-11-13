/**
 * WasteWise Backend Server Entry Point
 * Configures Express, middleware, database connection, routes, and error handling.
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env file
dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const contributionRoutes = require('./routes/contributionRoutes');

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend requests
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'WasteWise API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
app.use('/api/auth', authRoutes);
app.use('/api/contributions', contributionRoutes);

// Catch-all handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/**
 * Starts the HTTP server and initiates the database connection.
 */
const startServer = async () => {
  try {
    // Connect to database
    if (process.env.MONGODB_URI) {
      await connectDB();
    } else {
      console.warn('Warning: MONGODB_URI not set. Running server without database connection.');
    }

    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    return server;
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Start the server if executed directly
if (require.main === module) {
  startServer();
}

module.exports = app;

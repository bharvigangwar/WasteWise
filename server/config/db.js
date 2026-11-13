/**
 * Database connection setup using Mongoose.
 * Connects the Express server to the MongoDB database.
 */

const mongoose = require('mongoose');

/**
 * connectDB establishes a connection to MongoDB using the URI from environment variables.
 * If the connection fails, it logs the error and exits the process.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

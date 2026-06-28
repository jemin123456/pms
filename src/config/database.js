const mongoose = require('mongoose');
const logger = require('./logger');

const connectDatabase = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/epms';

  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      autoIndex: true, // Build indexes
    });
    logger.info('MongoDB connected successfully.');
  } catch (error) {
    logger.error('MongoDB connection error: %o', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB database error: %o', err);
});

module.exports = connectDatabase;

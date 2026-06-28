const mongoose = require('mongoose');
const auditPlugin = require('../database/plugins/auditPlugin');
const logger = require('../utils/logger'); // We will create this next

// Apply global audit plugin to all mongoose schemas
mongoose.plugin(auditPlugin);

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI env variable is not defined.');
    }

    const conn = await mongoose.connect(mongoUri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

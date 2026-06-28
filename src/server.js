const dotenv = require('dotenv');
// Load environment variables before anything else
dotenv.config();

const connectDB = require('./config/db');
const app = require('./app');

// Connect to MongoDB Database
connectDB();

const PORT = process.env.PORT || 3015;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  server.close(() => process.exit(1));
});

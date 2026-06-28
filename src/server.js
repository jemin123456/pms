require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const path = require('path');

const connectDatabase = require('./config/database');
const logger = require('./config/logger');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const { NotFoundError } = require('./errors/customErrors');

// Import Module Routes
const authRoutes = require('./modules/auth/routes/auth.routes');
const userRoutes = require('./modules/user/routes/user.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database
connectDatabase();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP for easy local testing/scripts if needed, or customize
}));
app.use(cors({
  origin: true, // Allow all origins in development or set specifically
  credentials: true
}));
app.use(mongoSanitize());
app.use(compression());

// Body and Cookie Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logger
app.use(requestLogger);

// Static file serving for Frontend UI
app.use(express.static(path.join(__dirname, 'public')));

// Module Endpoints
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// Handle unknown route request
app.use('*', (req, res, next) => {
  next(new NotFoundError(`Can't find ${req.originalUrl} on this server!`));
});

// Centralized error handler middleware
app.use(errorHandler);

// Run Server
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});

module.exports = app;

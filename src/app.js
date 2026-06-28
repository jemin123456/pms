const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const { NotFoundError } = require('./utils/errors');

// Import router placeholder
const authRouter = require('./modules/auth/routes');
const projectRouter = require('./modules/project/routes');

const app = express();

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "*"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
  })
);

// CORS configuration (allow credentials for refresh cookies)
app.use(
  cors({
    origin: true, // Allow all origins for development, adjust for production
    credentials: true,
  })
);

// Compression & Body parsing
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging (Morgan via Winston)
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '../public')));

// Register Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/projects', projectRouter);

// Fallback: If request is not for API but doesn't match static files, serve SPA index.html
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next(new NotFoundError(`Route ${req.originalUrl} not found`));
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS configuration
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static assets
app.use(express.static(path.join(__dirname, '../public')));

// Mount routers
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/projects', require('./modules/project/project.routes'));

// Catch-all route to serve static files
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;

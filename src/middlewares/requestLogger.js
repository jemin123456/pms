const morgan = require('morgan');
const logger = require('../config/logger');

const stream = {
  write: (message) => logger.info(message.trim())
};

// Log only in non-production, or all depending on requirement
const requestLogger = morgan(
  ':remote-addr - :method :url :status :res[content-length] - :response-time ms',
  { stream }
);

module.exports = requestLogger;

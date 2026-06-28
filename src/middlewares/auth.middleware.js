const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('../errors/customErrors');
const User = require('../modules/user/models/user.model');
const Role = require('../modules/user/models/role.model');
const { defineAbilityFor } = require('../modules/auth/policies/ability.factory');

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check cookie first
    if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    } 
    // Check Authorization header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AuthenticationError('Authentication required. Access token missing.');
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AuthenticationError('Access token expired.');
      }
      throw new AuthenticationError('Invalid access token.');
    }

    // Find user and populate their role
    const user = await User.findById(decoded.id).populate('role');
    if (!user || user.isDeleted) {
      throw new AuthenticationError('User session invalid or user no longer exists.');
    }

    // Attach user and ability to request
    req.user = user;
    req.ability = defineAbilityFor(user);

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate
};

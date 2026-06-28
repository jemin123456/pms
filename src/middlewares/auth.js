const authService = require('../modules/auth/service');
const { defineAbilitiesFor } = require('../modules/auth/abilityFactory');
const { AuthenticationError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Please log in to access this resource');
    }

    const token = authHeader.split(' ')[1];
    const user = await authService.verifyAccessToken(token);

    req.user = user;
    req.ability = defineAbilitiesFor(user);
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };

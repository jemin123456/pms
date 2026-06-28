const defineAbility = require('../abilities/defineAbility');

const attachAbility = (req, res, next) => {
  if (!req.user || !req.tenantId) {
    return next();
  }
  req.ability = defineAbility(req.user, req.tenantId);
  next();
};

module.exports = attachAbility;

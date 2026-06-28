const ForbiddenError = require('../errors/ForbiddenError');
const mongoose = require('mongoose');

const policyGate = (policyName, action) => {
  return async (req, res, next) => {
    try {
      const PolicyClass = require(`../policies/${policyName}`);
      const policy = new PolicyClass(req.user, req.tenantId, req.userRole);

      const methodName = `can${action.charAt(0).toUpperCase()}${action.slice(1)}`;
      if (typeof policy[methodName] !== 'function') {
        return next(new ForbiddenError(`Action method ${methodName} not implemented in ${policyName}`));
      }

      let resource = null;

      if (req.params.id) {
        const modelName = policyName.replace('Policy', '');
        const Model = mongoose.model(modelName);
        resource = await Model.findById(req.params.id);
        
        if (!resource) {
          return res.status(404).json({ success: false, message: `${modelName} not found` });
        }
        
        req[modelName.toLowerCase()] = resource;
      }

      const isAuthorized = policy[methodName](resource);
      if (isAuthorized) {
        return next();
      }

      return next(new ForbiddenError(`Access denied: You do not have permission to ${action} this ${policyName.replace('Policy', '')}`));
    } catch (err) {
      next(err);
    }
  };
};

module.exports = policyGate;

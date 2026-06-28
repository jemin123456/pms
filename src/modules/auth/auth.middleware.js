const jwt = require('jsonwebtoken');
const User = require('../user/user.model');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkeyforaccess_12345');

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      // 1. Identify active tenant from header or default to first membership
      let activeTenantId = req.headers['x-tenant-id'];
      if (!activeTenantId && req.user.memberships && req.user.memberships.length > 0) {
        activeTenantId = req.user.memberships[0].tenantId.toString();
      }

      // If user has memberships, verify activeTenantId is valid
      if (activeTenantId) {
        const membership = req.user.memberships.find(
          (m) => m.tenantId.toString() === activeTenantId.toString()
        );

        if (!membership) {
          return res.status(403).json({ success: false, message: 'Access denied: Not a member of this workspace' });
        }

        // Verify user is not archived in this workspace
        if (membership.status === 'archived') {
          return res.status(403).json({ success: false, message: 'Access denied: Your account in this workspace has been archived' });
        }

        req.tenantId = activeTenantId;
        req.userRole = membership.role;
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token validation failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }
};

module.exports = { protect };

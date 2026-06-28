const express = require('express');
const router = express.Router();
const {
  getUsers,
  addUser,
  assignRole,
  archiveUser,
  activateUser,
} = require('./user-management.controller');
const { protect } = require('../auth/auth.middleware');
const attachAbility = require('../../middleware/attachAbility');
const authorize = require('../../middleware/authorize');

router.use(protect);
router.use(attachAbility);
router.use(authorize('manage', 'User'));

router.route('/users')
  .get(getUsers)
  .post(addUser);

router.put('/users/:id/role', assignRole);
router.put('/users/:id/archive', archiveUser);
router.put('/users/:id/activate', activateUser);

module.exports = router;

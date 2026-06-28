const routes = require('./routes/user.routes');
const model = require('./models/user.model');
const roleModel = require('./models/role.model');
const service = require('./services/user.service');
const repository = require('./repositories/user.repository');

module.exports = {
  routes,
  model,
  roleModel,
  service,
  repository
};

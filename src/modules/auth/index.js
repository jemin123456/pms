const routes = require('./routes/auth.routes');
const sessionModel = require('./models/session.model');
const service = require('./services/auth.service');
const repository = require('./repositories/session.repository');
const abilityFactory = require('./policies/ability.factory');

module.exports = {
  routes,
  sessionModel,
  service,
  repository,
  abilityFactory
};

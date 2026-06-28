const Session = require('../models/session.model');

class SessionRepository {
  async createSession(sessionData) {
    return Session.create(sessionData);
  }

  async findSessionByToken(refreshToken) {
    return Session.findOne({ refreshToken, isDeleted: false }).populate({
      path: 'user',
      populate: { path: 'role' }
    });
  }

  async deleteSessionByToken(refreshToken) {
    return Session.findOneAndUpdate(
      { refreshToken },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
  }

  async deleteSessionsByUserId(userId) {
    return Session.updateMany(
      { user: userId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() }
    );
  }
}

module.exports = new SessionRepository();

const jwt = require('jsonwebtoken');
const userRepository = require('../../user/repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const userService = require('../../user/services/user.service');
const { AuthenticationError, NotFoundError } = require('../../../errors/customErrors');

class AuthService {
  generateAccessToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      roleCode: user.role ? user.role.code : 'EMPLOYEE'
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  }

  generateRefreshToken(user) {
    const payload = { id: user._id };
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  }

  async register(userData) {
    // Delegates to User Service for email check, role validation and user creation
    return userService.createUser(userData);
  }

  async login(usernameOrEmail, password, deviceInfo, ipAddress) {
    // Find user by email or username
    let user;
    if (usernameOrEmail.includes('@')) {
      user = await userRepository.findByEmail(usernameOrEmail);
    } else {
      user = await userRepository.findByUsername(usernameOrEmail);
    }

    if (!user) {
      throw new AuthenticationError('Invalid email/username or password.');
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email/username or password.');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Save refresh token session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await sessionRepository.createSession({
      user: user._id,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt
    });

    return {
      user,
      accessToken,
      refreshToken
    };
  }

  async logout(refreshToken) {
    if (!refreshToken) return;
    await sessionRepository.deleteSessionByToken(refreshToken);
  }

  async refresh(refreshToken, deviceInfo, ipAddress) {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token required.');
    }

    // Verify token structure & expiry
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new AuthenticationError('Invalid or expired refresh token.');
    }

    // Find session in database
    const session = await sessionRepository.findSessionByToken(refreshToken);
    if (!session || !session.user) {
      throw new AuthenticationError('Session not found or expired.');
    }

    const user = session.user;

    // Generate new tokens (token rotation)
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Invalidate old session
    await sessionRepository.deleteSessionByToken(refreshToken);

    // Create new session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await sessionRepository.createSession({
      user: user._id,
      refreshToken: newRefreshToken,
      deviceInfo,
      ipAddress,
      expiresAt
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user
    };
  }

  async changePassword(userId, oldPassword, newPassword) {
    // Find user with password field explicitly selected
    const user = await userRepository.findByEmail((await userService.getUserById(userId)).email);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      throw new AuthenticationError('Incorrect current password.');
    }

    // Update password
    user.password = newPassword;
    user.updatedBy = userId;
    user.version = (user.version || 1) + 1;
    await user.save();

    // Revoke all active sessions for security
    await sessionRepository.deleteSessionsByUserId(userId);
  }
}

module.exports = new AuthService();

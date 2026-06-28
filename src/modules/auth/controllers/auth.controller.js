const authService = require('../services/auth.service');
const AuthDto = require('../dtos/auth.dto');
const UserDto = require('../../user/dtos/user.dto');

const getCookieOptions = (maxAgeMs) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs
  };
};

class AuthController {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        status: 'success',
        message: 'Registration successful.',
        data: UserDto.toResponse(user)
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const deviceInfo = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || '0.0.0.0';

      const { user, accessToken, refreshToken } = await authService.login(
        req.body.usernameOrEmail,
        req.body.password,
        deviceInfo,
        ipAddress
      );

      // Set HTTP-Only cookies
      res.cookie('access_token', accessToken, getCookieOptions(15 * 60 * 1000)); // 15m
      res.cookie('refresh_token', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7d

      res.status(200).json({
        status: 'success',
        message: 'Login successful.',
        data: AuthDto.toAuthResponse(user, accessToken)
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refresh_token || req.body.refreshToken;
      await authService.logout(refreshToken);

      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully.'
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.cookies.refresh_token || req.body.refreshToken;
      const deviceInfo = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || '0.0.0.0';

      const { accessToken, refreshToken: newRefreshToken, user } = await authService.refresh(
        refreshToken,
        deviceInfo,
        ipAddress
      );

      // Reset cookies
      res.cookie('access_token', accessToken, getCookieOptions(15 * 60 * 1000)); // 15m
      res.cookie('refresh_token', newRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000)); // 7d

      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully.',
        data: AuthDto.toAuthResponse(user, accessToken)
      });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user._id;
      const { oldPassword, newPassword } = req.body;

      await authService.changePassword(userId, oldPassword, newPassword);

      // Clear cookies since all sessions are revoked
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');

      res.status(200).json({
        status: 'success',
        message: 'Password changed successfully. Please log in again.'
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      res.status(200).json({
        status: 'success',
        data: UserDto.toResponse(req.user)
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

const authService = require('./service');
const AuthDto = require('./dto');
const { AuthenticationError } = require('../../utils/errors');

class AuthController {
  async register(req, res, next) {
    try {
      const { user, accessToken, refreshToken } = await authService.register(req.body);
      
      // Set refresh token in cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        status: 'success',
        data: AuthDto.toAuthResponse(user, accessToken),
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await authService.login(email, password);

      // Set refresh token in cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        status: 'success',
        data: AuthDto.toAuthResponse(user, accessToken),
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      // Support reading refresh token from cookie or request body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        throw new AuthenticationError('Refresh token is required');
      }

      const { accessToken } = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        status: 'success',
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      res.status(200).json({
        status: 'success',
        data: {
          user: AuthDto.toUserResponse(req.user),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req, res, next) {
    try {
      const userRepository = require('../user/repository');
      const users = await userRepository.findAll();
      res.status(200).json({
        status: 'success',
        data: {
          users: users.map(user => AuthDto.toUserResponse(user)),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

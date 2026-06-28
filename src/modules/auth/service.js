const jwt = require('jsonwebtoken');
const userRepository = require('../user/repository');
const {
  AuthenticationError,
  ValidationError,
  AppError,
} = require('../../utils/errors');

class AuthService {
  /**
   * Register a new user
   */
  async register(registerDto) {
    const { name, email, password, roleName } = registerDto;

    // 1. Check if email already registered
    const userExists = await userRepository.exists(email);
    if (userExists) {
      throw new ValidationError('Email is already in use');
    }

    // 2. Fetch the role from db (defaulting to Employee)
    const targetRoleName = roleName || 'Employee';
    const role = await userRepository.findRoleByName(targetRoleName);
    if (!role) {
      throw new ValidationError(`Role '${targetRoleName}' does not exist`);
    }

    // 3. Create the user
    const newUser = await userRepository.create({
      name,
      email,
      password,
      role: role._id,
    });

    // 4. Generate tokens
    const tokens = this.generateAuthTokens(newUser);
    return { user: newUser, ...tokens };
  }

  /**
   * Login user
   */
  async login(email, password) {
    // 1. Find user by email and select password field
    const user = await userRepository.findByEmail(email, true);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // 2. Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AuthenticationError('Invalid email or password');
    }

    // 3. Generate tokens
    const tokens = this.generateAuthTokens(user);
    
    // Convert to object and delete password if we need to return user
    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, ...tokens };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken) {
    try {
      // 1. Verify token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      
      // 2. Find user
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        throw new AuthenticationError('User associated with this token no longer exists');
      }

      // 3. Generate new access token
      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  /**
   * Helper: Generate both tokens
   */
  generateAuthTokens(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    return { accessToken, refreshToken };
  }

  /**
   * Helper: Generate access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  /**
   * Helper: Generate refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verify access token for middleware
   */
  async verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        throw new AuthenticationError('User not found');
      }
      return user;
    } catch (error) {
      throw new AuthenticationError('Not authorized to access this resource');
    }
  }
}

module.exports = new AuthService();

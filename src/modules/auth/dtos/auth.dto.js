const UserDto = require('../../user/dtos/user.dto');

class AuthDto {
  static toAuthResponse(user, accessToken) {
    return {
      user: UserDto.toResponse(user),
      accessToken
    };
  }
}

module.exports = AuthDto;

class AuthDto {
  static toUserResponse(user) {
    if (!user) return null;
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role ? {
        id: user.role._id,
        name: user.role.name,
        permissions: user.role.permissions,
      } : null,
      department: user.department || '',
      designation: user.designation || '',
      timezone: user.timezone || 'UTC',
      skills: user.skills || [],
      bio: user.bio || '',
      experience: user.experience || 0,
      contactDetails: user.contactDetails || { phone: '', address: '' },
      profilePicture: user.profilePicture || '',
    };
  }

  static toAuthResponse(user, accessToken) {
    return {
      user: this.toUserResponse(user),
      accessToken,
    };
  }
}

module.exports = AuthDto;

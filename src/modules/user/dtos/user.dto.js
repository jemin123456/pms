class UserDto {
  static toResponse(user) {
    if (!user) return null;
    return {
      id: user._id,
      email: user.email,
      username: user.username,
      name: user.name,
      profilePicture: user.profilePicture,
      employeeId: user.employeeId,
      department: user.department,
      designation: user.designation,
      skills: user.skills || [],
      contactDetails: user.contactDetails || {},
      bio: user.bio,
      experience: user.experience,
      timeZone: user.timeZone,
      isEmailVerified: user.isEmailVerified,
      role: user.role ? {
        id: user.role._id,
        name: user.role.name,
        code: user.role.code
      } : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  static toResponseList(users) {
    if (!users || !Array.isArray(users)) return [];
    return users.map(user => this.toResponse(user));
  }
}

module.exports = UserDto;

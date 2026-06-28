class ProjectDto {
  static toResponse(project) {
    if (!project) return null;
    return {
      id: project._id,
      name: project.name,
      code: project.code,
      description: project.description || '',
      category: project.category || '',
      department: project.department || '',
      budget: project.budget || 0,
      currency: project.currency || 'USD',
      priority: project.priority || 'Medium',
      startDate: project.startDate,
      endDate: project.endDate,
      status: project.status || 'Planning',
      color: project.color || '#7c3aed',
      tags: project.tags || [],
      visibility: project.visibility || 'Private',
      projectImage: project.projectImage || '',
      manager: project.manager ? {
        id: project.manager._id,
        name: project.manager.name,
        email: project.manager.email,
        designation: project.manager.designation || '',
        profilePicture: project.manager.profilePicture || '',
      } : null,
      members: project.members ? project.members.map(member => ({
        id: member._id,
        name: member.name,
        email: member.email,
        designation: member.designation || '',
        profilePicture: member.profilePicture || '',
      })) : [],
      client: project.client ? {
        id: project.client._id,
        name: project.client.name,
        email: project.client.email,
      } : null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  static toCollectionResponse(projects) {
    if (!projects) return [];
    return projects.map(project => this.toResponse(project));
  }
}

module.exports = ProjectDto;

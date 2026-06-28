import { apiFetch, getActiveTenantId, setActiveTenantId } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  let projects = [];
  let currentUser = null;
  let activeRole = 'employee';

  // DOM elements
  const welcomeMessage = document.getElementById('welcome-message');
  const tenantDisplayName = document.getElementById('tenant-display-name');
  const workspaceSelect = document.getElementById('workspace-select');
  const userAvatarInitial = document.getElementById('user-avatar-initial');
  const userDisplayName = document.getElementById('user-display-name');
  const userDisplayRole = document.getElementById('user-display-role');
  const userDisplayId = document.getElementById('user-display-id');
  const logoutBtn = document.getElementById('logout-btn');

  // Views
  const dashboardActiveView = document.getElementById('dashboard-active-view');
  const noWorkspaceView = document.getElementById('no-workspace-view');
  const userIdBadge = document.getElementById('user-id-badge');
  const copyUserIdBtn = document.getElementById('copy-user-id-btn');

  // Stats elements
  const statTotal = document.getElementById('stat-total');
  const statActive = document.getElementById('stat-active');
  const statCompleted = document.getElementById('stat-completed');
  const statBudget = document.getElementById('stat-budget');
  const projectCountBadge = document.getElementById('project-count');

  // Table elements
  const projectTableBody = document.getElementById('project-table-body');
  const employeeSection = document.getElementById('employee-section');
  const employeeTableBody = document.getElementById('employee-table-body');

  // Modals
  const projectModal = document.getElementById('project-modal');
  const projectForm = document.getElementById('project-form');
  const addProjectBtn = document.getElementById('add-project-btn');
  const modalCloseX = document.getElementById('modal-close-x');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalTitle = document.getElementById('modal-title');
  const modalAlert = document.getElementById('modal-alert');
  const projectIdInput = document.getElementById('project-id');

  const workspaceModal = document.getElementById('workspace-modal');
  const workspaceForm = document.getElementById('workspace-form');
  const workspaceModalCloseX = document.getElementById('workspace-modal-close-x');
  const workspaceModalCancelBtn = document.getElementById('workspace-modal-cancel-btn');
  const workspaceModalAlert = document.getElementById('workspace-modal-alert');
  const createWorkspaceNavBtn = document.getElementById('create-workspace-nav-btn');
  const createFirstWorkspaceBtn = document.getElementById('create-first-workspace-btn');

  const employeeModal = document.getElementById('employee-modal');
  const employeeForm = document.getElementById('employee-form');
  const employeeModalCloseX = document.getElementById('employee-modal-close-x');
  const employeeModalCancelBtn = document.getElementById('employee-modal-cancel-btn');
  const employeeModalAlert = document.getElementById('employee-modal-alert');
  const addEmployeeTrigger = document.getElementById('add-employee-trigger');

  // Modal Form Inputs
  const nameInput = document.getElementById('projectName');
  const descriptionInput = document.getElementById('projectDescription');
  const techStackInput = document.getElementById('projectTechStack');
  const budgetInput = document.getElementById('projectBudget');
  const statusSelect = document.getElementById('projectStatus');

  const workspaceNameInput = document.getElementById('workspaceName');
  const workspaceSlugInput = document.getElementById('workspaceSlug');
  const employeeUserIdInput = document.getElementById('employeeUserId');

  // Theme Elements
  const themeToggle = document.getElementById('theme-toggle');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const themeIconMoon = document.getElementById('theme-icon-moon');

  // --- Initial Operations & Session Check ---
  initDashboard();

  async function initDashboard() {
    setupTheme();
    
    try {
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const body = await res.json();
        currentUser = body.data;
        
        renderProfileBadge(currentUser);

        // Check if user has workspaces
        if (!currentUser.memberships || currentUser.memberships.length === 0) {
          showNoWorkspaceState(currentUser);
        } else {
          showActiveWorkspaceState(currentUser);
        }
      } else {
        window.location.href = '/login.html';
      }
    } catch (err) {
      console.error('Session initialization failed:', err);
      window.location.href = '/login.html';
    }
  }

  function renderProfileBadge(user) {
    if (!user) return;
    const name = user.name || 'User';
    userDisplayName.textContent = name;
    userAvatarInitial.textContent = name.charAt(0).toUpperCase();
    userDisplayId.textContent = `ID: ${user._id || user.id}`;
  }

  function showNoWorkspaceState(user) {
    dashboardActiveView.style.display = 'none';
    addProjectBtn.style.display = 'none';
    document.getElementById('workspace-selector-container').style.display = 'none';
    
    welcomeMessage.textContent = `Hello, ${user.name.split(' ')[0]}!`;
    tenantDisplayName.textContent = 'No active workspace selected';
    userDisplayRole.textContent = 'GUEST';
    userIdBadge.textContent = user._id || user.id;

    noWorkspaceView.style.display = 'block';
  }

  function showActiveWorkspaceState(user) {
    noWorkspaceView.style.display = 'none';
    document.getElementById('workspace-selector-container').style.display = 'block';
    
    setupWorkspaceDropdown(user);
    updateWorkspaceUI();
    
    dashboardActiveView.style.display = 'block';
    fetchProjects();
    fetchEmployees();
  }

  function setupWorkspaceDropdown(user) {
    workspaceSelect.innerHTML = '';
    
    user.memberships.forEach((memb) => {
      const tenant = memb.tenantId;
      if (!tenant) return;

      const opt = document.createElement('option');
      opt.value = tenant._id;
      opt.textContent = `${tenant.name} (${memb.role})`;
      workspaceSelect.appendChild(opt);
    });

    let activeId = getActiveTenantId();
    const hasActiveId = user.memberships.some(m => m.tenantId?._id === activeId);

    if (!activeId || !hasActiveId) {
      if (user.memberships.length > 0) {
        activeId = user.memberships[0].tenantId._id;
        setActiveTenantId(activeId);
      }
    }

    workspaceSelect.value = activeId;
  }

  // Handle workspace change dropdown
  workspaceSelect.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    setActiveTenantId(selectedId);
    updateWorkspaceUI();
    fetchProjects();
    fetchEmployees();
  });

  function updateWorkspaceUI() {
    if (!currentUser) return;
    
    const activeId = getActiveTenantId();
    const membership = currentUser.memberships.find(m => m.tenantId?._id === activeId);
    
    if (membership) {
      activeRole = membership.role;
      const tenantName = membership.tenantId.name;
      
      const userFirstName = currentUser.name || 'User';
      welcomeMessage.textContent = `Hello, ${userFirstName.split(' ')[0]}!`;
      tenantDisplayName.textContent = `Workspace: ${tenantName}`;
      
      userDisplayRole.textContent = activeRole.toUpperCase();

      if (activeRole === 'admin') {
        addProjectBtn.style.display = 'inline-flex';
      } else {
        addProjectBtn.style.display = 'none';
      }
    }
  }

  // --- Copy User ID Functionality ---
  function copyUserId() {
    if (!currentUser) return;
    const id = currentUser._id || currentUser.id;
    navigator.clipboard.writeText(id).then(() => {
      const originalText = copyUserIdBtn.textContent;
      copyUserIdBtn.textContent = 'Copied!';
      copyUserIdBtn.classList.remove('btn-secondary');
      copyUserIdBtn.classList.add('btn-primary');
      setTimeout(() => {
        copyUserIdBtn.textContent = originalText;
        copyUserIdBtn.classList.remove('btn-primary');
        copyUserIdBtn.classList.add('btn-secondary');
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }

  if (copyUserIdBtn) {
    copyUserIdBtn.addEventListener('click', copyUserId);
  }
  userDisplayId.addEventListener('click', copyUserId);

  // --- Theme Controller ---
  function setupTheme() {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (theme === 'dark') {
      themeIconSun.style.display = 'none';
      themeIconMoon.style.display = 'block';
    } else {
      themeIconSun.style.display = 'block';
      themeIconMoon.style.display = 'none';
    }
  }

  // --- Fetch Projects ---
  async function fetchProjects() {
    projectTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <div class="empty-state-icon">💻</div>
          Loading projects catalog...
        </td>
      </tr>
    `;

    try {
      const res = await apiFetch('/api/projects');
      if (res.ok) {
        const body = await res.json();
        projects = body.data;
        renderProjects(projects);
        updateStatistics(projects);
      } else {
        const body = await res.json();
        showTableError(body.message || 'Access denied to this workspace.');
      }
    } catch (err) {
      console.error('Failed to load projects catalog:', err);
      showTableError('Network error. Unable to retrieve project listing.');
    }
  }

  function renderProjects(list) {
    projectTableBody.innerHTML = '';
    
    if (list.length === 0) {
      projectTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            <div class="empty-state-icon">💻</div>
            <p>${activeRole === 'admin' ? 'No projects added yet. Click "Add Project" to register your first project.' : 'No projects found in this workspace.'}</p>
          </td>
        </tr>
      `;
      return;
    }

    list.forEach((project) => {
      const tr = document.createElement('tr');
      
      const badgeClass = 
        project.status === 'Completed' ? 'badge-success' :
        project.status === 'In Progress' ? 'badge-warning' :
        project.status === 'On Hold' ? 'badge-danger' : 'badge-info';

      let actionsHtml = `<div style="display: flex; gap: 8px; justify-content: center; align-items: center; color: var(--text-secondary); font-size: 0.85rem;">Read Only</div>`;
      
      if (activeRole === 'admin') {
        actionsHtml = `
          <div class="actions-cell">
            <button class="btn-icon edit-project-btn" data-id="${project._id}" title="Edit Project">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-icon delete-project-btn" data-id="${project._id}" title="Delete Project">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
          </div>
        `;
      }

      tr.innerHTML = `
        <td style="font-weight: 600; color: var(--text-primary);">${escapeHtml(project.name)}</td>
        <td style="color: var(--text-secondary);">${escapeHtml(project.description)}</td>
        <td><span class="tech-stack-tag">${escapeHtml(project.techStack)}</span></td>
        <td style="font-weight: 500;">$${Number(project.budget || 0).toLocaleString()}</td>
        <td><span class="badge ${badgeClass}">${project.status}</span></td>
        <td>${actionsHtml}</td>
      `;

      projectTableBody.appendChild(tr);
    });

    // Add click listeners to actions
    document.querySelectorAll('.edit-project-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        openEditProjectModal(id);
      });
    });

    document.querySelectorAll('.delete-project-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        deleteProjectRecord(id);
      });
    });
  }

  function showTableError(message) {
    projectTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state" style="color: var(--danger-color);">
          <div class="empty-state-icon">⚠️</div>
          ${escapeHtml(message)}
        </td>
      </tr>
    `;
  }

  function updateStatistics(list) {
    statTotal.textContent = list.length;
    
    const active = list.filter(p => p.status === 'In Progress').length;
    statActive.textContent = active;

    const completed = list.filter(p => p.status === 'Completed').length;
    statCompleted.textContent = completed;

    const totalBudget = list.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    statBudget.textContent = `$${totalBudget.toLocaleString()}`;

    projectCountBadge.textContent = `${list.length} Project${list.length === 1 ? '' : 's'}`;
  }

  // --- Fetch Workspace Employees ---
  async function fetchEmployees() {
    if (!currentUser || activeRole !== 'admin') {
      employeeSection.style.display = 'none';
      return;
    }

    employeeTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-state">Loading workspace employees...</td>
      </tr>
    `;

    try {
      const res = await apiFetch('/api/auth/employees');
      if (res.ok) {
        const body = await res.json();
        renderEmployees(body.data);
      } else {
        employeeSection.style.display = 'none';
      }
    } catch (err) {
      console.error('Failed to load employees directory:', err);
      employeeSection.style.display = 'none';
    }
  }

  function renderEmployees(list) {
    employeeTableBody.innerHTML = '';
    employeeSection.style.display = 'block';

    if (list.length === 0) {
      employeeTableBody.innerHTML = `
        <tr>
          <td colspan="3" class="empty-state">No employees added to this workspace yet.</td>
        </tr>
      `;
      return;
    }

    list.forEach(emp => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 500;">${escapeHtml(emp.name)}</td>
        <td>${escapeHtml(emp.email)}</td>
        <td><span class="badge ${emp.role === 'admin' ? 'badge-warning' : 'badge-info'}">${emp.role.toUpperCase()}</span></td>
      `;
      employeeTableBody.appendChild(tr);
    });
  }

  // --- Create/Edit Project Form Actions ---
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => {
      openAddProjectModal();
    });
  }

  function openAddProjectModal() {
    projectForm.reset();
    projectIdInput.value = '';
    modalTitle.textContent = 'Add Project';
    modalAlert.style.display = 'none';
    projectModal.style.display = 'flex';
  }

  async function openEditProjectModal(id) {
    projectForm.reset();
    projectIdInput.value = id;
    modalTitle.textContent = 'Edit Project';
    modalAlert.style.display = 'none';

    try {
      const res = await apiFetch(`/api/projects/${id}`);
      if (res.ok) {
        const body = await res.json();
        const p = body.data;

        nameInput.value = p.name;
        descriptionInput.value = p.description;
        techStackInput.value = p.techStack;
        budgetInput.value = p.budget;
        statusSelect.value = p.status;

        projectModal.style.display = 'flex';
      } else {
        const body = await res.json();
        alert(body.message || 'Unable to retrieve project details.');
      }
    } catch (err) {
      console.error('Failed to query project document:', err);
      alert('Network error retrieving project details.');
    }
  }

  async function deleteProjectRecord(id) {
    if (!confirm('Are you sure you want to permanently delete this IT project?')) return;

    try {
      const res = await apiFetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchProjects();
      } else {
        const body = await res.json();
        alert(body.message || 'Delete failed.');
      }
    } catch (err) {
      console.error('Failed to execute delete request:', err);
      alert('Network error. Delete operation aborted.');
    }
  }

  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalAlert.style.display = 'none';

    const id = projectIdInput.value;
    const payload = {
      name: nameInput.value.trim(),
      description: descriptionInput.value.trim(),
      techStack: techStackInput.value.trim(),
      budget: Number(budgetInput.value),
      status: statusSelect.value,
    };

    // Validations
    let isValid = true;
    if (!payload.name) { nameInput.classList.add('is-invalid'); isValid = false; }
    if (!payload.description) { descriptionInput.classList.add('is-invalid'); isValid = false; }
    if (!payload.techStack) { techStackInput.classList.add('is-invalid'); isValid = false; }
    if (isNaN(payload.budget) || payload.budget < 0) { budgetInput.classList.add('is-invalid'); isValid = false; }

    if (!isValid) return;

    try {
      const url = id ? `/api/projects/${id}` : '/api/projects';
      const method = id ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: payload,
      });

      const body = await res.json();
      if (res.ok && body.success) {
        projectModal.style.display = 'none';
        fetchProjects();
      } else {
        modalAlert.textContent = body.message || 'Failed to save project.';
        modalAlert.className = 'alert alert-danger';
        modalAlert.style.display = 'block';
      }
    } catch (err) {
      console.error('Project save error:', err);
      modalAlert.textContent = 'Network error. Save aborted.';
      modalAlert.className = 'alert alert-danger';
      modalAlert.style.display = 'block';
    }
  });

  // Modal Closures
  const closeProjectModal = () => { projectModal.style.display = 'none'; };
  if (modalCloseX) modalCloseX.addEventListener('click', closeProjectModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeProjectModal);

  // --- Create Workspace Modal Trigger ---
  const openWorkspaceModal = () => {
    workspaceForm.reset();
    workspaceModalAlert.style.display = 'none';
    workspaceModal.style.display = 'flex';
  };

  createWorkspaceNavBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openWorkspaceModal();
  });

  if (createFirstWorkspaceBtn) {
    createFirstWorkspaceBtn.addEventListener('click', openWorkspaceModal);
  }

  const closeWorkspaceModal = () => { workspaceModal.style.display = 'none'; };
  if (workspaceModalCloseX) workspaceModalCloseX.addEventListener('click', closeWorkspaceModal);
  if (workspaceModalCancelBtn) workspaceModalCancelBtn.addEventListener('click', closeWorkspaceModal);

  // Auto-slugify workspace name
  workspaceNameInput.addEventListener('input', (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    workspaceSlugInput.value = slug;
  });

  workspaceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    workspaceModalAlert.style.display = 'none';

    const name = workspaceNameInput.value.trim();
    const slug = workspaceSlugInput.value.trim();

    if (!name || !slug) {
      workspaceModalAlert.textContent = 'Please fill out all fields.';
      workspaceModalAlert.className = 'alert alert-danger';
      workspaceModalAlert.style.display = 'block';
      return;
    }

    try {
      const res = await apiFetch('/api/auth/workspaces', {
        method: 'POST',
        body: { name, slug },
      });

      const body = await res.json();
      if (res.ok && body.success) {
        workspaceModal.style.display = 'none';
        if (body.newWorkspaceId) {
          setActiveTenantId(body.newWorkspaceId);
        }
        initDashboard(); // Reload full dashboard
      } else {
        workspaceModalAlert.textContent = body.message || 'Failed to create workspace.';
        workspaceModalAlert.className = 'alert alert-danger';
        workspaceModalAlert.style.display = 'block';
      }
    } catch (err) {
      console.error('Workspace create error:', err);
      workspaceModalAlert.textContent = 'Network error. Creation aborted.';
      workspaceModalAlert.className = 'alert alert-danger';
      workspaceModalAlert.style.display = 'block';
    }
  });

  // --- Add Employee Modal ---
  if (addEmployeeTrigger) {
    addEmployeeTrigger.addEventListener('click', () => {
      employeeForm.reset();
      employeeModalAlert.style.display = 'none';
      employeeModal.style.display = 'flex';
    });
  }

  const closeEmployeeModal = () => { employeeModal.style.display = 'none'; };
  if (employeeModalCloseX) employeeModalCloseX.addEventListener('click', closeEmployeeModal);
  if (employeeModalCancelBtn) employeeModalCancelBtn.addEventListener('click', closeEmployeeModal);

  employeeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    employeeModalAlert.style.display = 'none';

    const userId = employeeUserIdInput.value.trim();
    if (!userId || userId.length !== 24) {
      employeeModalAlert.textContent = 'Please enter a valid 24-character User ID.';
      employeeModalAlert.className = 'alert alert-danger';
      employeeModalAlert.style.display = 'block';
      return;
    }

    try {
      const res = await apiFetch('/api/auth/employees', {
        method: 'POST',
        body: { userId },
      });

      const body = await res.json();
      if (res.ok && body.success) {
        employeeModal.style.display = 'none';
        fetchEmployees();
        alert(body.message || 'Employee added successfully!');
      } else {
        employeeModalAlert.textContent = body.message || 'Failed to add employee.';
        employeeModalAlert.className = 'alert alert-danger';
        employeeModalAlert.style.display = 'block';
      }
    } catch (err) {
      console.error('Add employee error:', err);
      employeeModalAlert.textContent = 'Network error. Addition aborted.';
      employeeModalAlert.className = 'alert alert-danger';
      employeeModalAlert.style.display = 'block';
    }
  });

  // --- Logout ---
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await apiFetch('/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('activeTenantId');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
      } catch (err) {
        console.error('Logout failed:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('activeTenantId');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
      }
    });
  }

  // Clean form input alerts on focus
  document.querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('focus', () => {
      input.classList.remove('is-invalid');
    });
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});

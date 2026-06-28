// UI View Management and Toast Notifications
const App = {
  mountPoint: null,

  init() {
    this.mountPoint = document.getElementById('app');
    
    // Subscribe to authentication changes
    auth.onStateChange((user) => this.render(user));
    
    // Check if session exists on boot
    auth.checkSession().then(() => {
      // Loader is removed automatically when render fires
    });
  },

  // Elegant Toast System
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    toast.innerHTML = `
      <span>${message}</span>
      <button class="toast-close">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(timer);
      toast.remove();
    });
  },

  render(user) {
    if (user) {
      this.renderDashboard(user);
    } else {
      this.renderLogin();
    }
  },

  renderLogin() {
    this.mountPoint.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card glass-panel">
          <div class="auth-header">
            <span class="logo-icon">EPMS</span>
            <h2 class="auth-title">Welcome Back</h2>
            <p class="auth-subtitle">Log in to access your enterprise workspace</p>
          </div>
          
          <form id="login-form">
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address</label>
              <input class="form-control" type="email" id="login-email" required placeholder="name@company.com">
            </div>
            
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <input class="form-control" type="password" id="login-password" required placeholder="••••••••">
            </div>
            
            <button class="btn-primary" type="submit" id="login-btn">
              <span>Sign In</span>
            </button>
          </form>
          
          <div class="auth-footer">
            Don't have an account? <a href="#" class="auth-link" id="goto-register">Register</a>
          </div>
        </div>
      </div>
    `;

    // Navigation and form submit events
    document.getElementById('goto-register').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderRegister();
    });

    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('login-btn');
      
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Signing In...';

      try {
        await auth.login(email, password);
        this.showToast('Login successful! Welcome back.');
      } catch (err) {
        this.showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  },

  renderRegister() {
    this.mountPoint.innerHTML = `
      <div class="auth-wrapper">
        <div class="auth-card glass-panel">
          <div class="auth-header">
            <span class="logo-icon">EPMS</span>
            <h2 class="auth-title">Create Account</h2>
            <p class="auth-subtitle">Join the organization and start collaborating</p>
          </div>
          
          <form id="register-form">
            <div class="form-group">
              <label class="form-label" for="reg-name">Full Name</label>
              <input class="form-control" type="text" id="reg-name" required placeholder="John Doe">
            </div>
            
            <div class="form-group">
              <label class="form-label" for="reg-email">Email Address</label>
              <input class="form-control" type="email" id="reg-email" required placeholder="john@company.com">
            </div>
            
            <div class="form-group">
              <label class="form-label" for="reg-password">Password</label>
              <input class="form-control" type="password" id="reg-password" required placeholder="At least 6 characters">
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-role">Designated Role</label>
              <select class="form-control" id="reg-role" style="background-color: var(--bg-input);">
                <option value="Employee">Employee (Default)</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Admin">Administrator</option>
                <option value="Client">Client Partner</option>
              </select>
            </div>
            
            <button class="btn-primary" type="submit" id="reg-btn">
              <span>Create Account</span>
            </button>
          </form>
          
          <div class="auth-footer">
            Already have an account? <a href="#" class="auth-link" id="goto-login">Sign In</a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('goto-login').addEventListener('click', (e) => {
      e.preventDefault();
      this.renderLogin();
    });

    const form = document.getElementById('register-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;
      const roleName = document.getElementById('reg-role').value;
      const btn = document.getElementById('reg-btn');
      
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Registering...';

      try {
        await auth.register(name, email, password, roleName);
        this.showToast('Registration successful! Session initialized.');
      } catch (err) {
        this.showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  },

  renderDashboard(user) {
    this.user = user;
    this.mountPoint.innerHTML = `
      <div class="dashboard-wrapper">
        <!-- Sidebar Navigation -->
        <aside class="sidebar glass-panel" style="border-radius: 0;">
          <div>
            <div class="sidebar-header">
              <span class="logo-icon" style="font-size: 1.8rem; margin-bottom: 0;">EPMS</span>
            </div>
            <ul class="nav-menu">
              <li class="nav-item">
                <a href="#" class="nav-link active" id="nav-dashboard">Dashboard</a>
              </li>
              <li class="nav-item">
                <a href="#" class="nav-link" id="nav-projects">Projects</a>
              </li>
              <li class="nav-item">
                <a href="#" class="nav-link" id="nav-tasks">Tasks</a>
              </li>
            </ul>
          </div>
          
          <div class="sidebar-footer">
            <div class="user-badge">
              <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
              <div>
                <div class="user-info-name">${user.name}</div>
                <div class="user-info-role">${user.role ? user.role.name : 'User'}</div>
              </div>
            </div>
            <button class="btn-logout" id="logout-btn">Log Out</button>
          </div>
        </aside>

        <!-- Main Dashboard Viewport -->
        <main class="main-content" id="main-content-panel"></main>
      </div>
    `;

    // Logout action handler
    document.getElementById('logout-btn').addEventListener('click', async () => {
      await auth.logout();
      this.showToast('Logged out successfully.');
    });

    // Nav navigation click bindings
    const navItems = {
      'nav-dashboard': () => {
        this.setActiveNav('nav-dashboard');
        this.renderDashboardContent(this.user);
      },
      'nav-projects': () => {
        this.setActiveNav('nav-projects');
        this.renderProjectsView();
      },
      'nav-tasks': () => {
        this.setActiveNav('nav-tasks');
        document.getElementById('main-content-panel').innerHTML = `
          <div class="page-header">
            <h1 class="page-title">Tasks Console</h1>
            <p class="page-subtitle">Assign tasks, map workflow states, and manage checklists.</p>
          </div>
          <div class="widget-card glass-panel" style="text-align:center; padding: 60px 20px;">
            <p class="text-secondary" style="font-size:1.1rem; margin-bottom:16px;">The Task Management & Kanban Board modules will be implemented in the next Phase!</p>
          </div>
        `;
      }
    };

    Object.keys(navItems).forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          navItems[id]();
        });
      }
    });

    // Load initial subview
    this.renderDashboardContent(user);
  },

  setActiveNav(activeId) {
    const navs = ['nav-dashboard', 'nav-projects', 'nav-tasks'];
    navs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === activeId) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });
  },

  renderDashboardContent(user) {
    const panel = document.getElementById('main-content-panel');
    panel.innerHTML = `
      <div class="page-header">
        <h1 class="page-title">Enterprise Dashboard</h1>
        <p class="page-subtitle">Welcome back, ${user.name}. Here is your dashboard overview.</p>
      </div>

      <div class="grid-container">
        <!-- Profile Info Widget -->
        <div class="widget-card glass-panel" style="grid-column: span 2;">
          <h3 class="widget-title">User Profile Details</h3>
          <div class="profile-grid">
            <div class="avatar" style="width: 80px; height: 80px; font-size: 2.2rem;">
              ${user.name.charAt(0).toUpperCase()}
            </div>
            <div class="profile-details">
              <p><strong>Full Name:</strong> ${user.name}</p>
              <p><strong>Email Address:</strong> ${user.email}</p>
              <p><strong>Designation:</strong> ${user.designation || 'Enterprise Colleague'}</p>
              <p><strong>Department:</strong> ${user.department || 'Not Assigned'}</p>
              <p><strong>Timezone:</strong> ${user.timezone || 'UTC'}</p>
              <div>
                <strong>Skills:</strong>
                ${user.skills && user.skills.length > 0 
                  ? user.skills.map(s => `<span class="badge-tag">${s}</span>`).join('') 
                  : '<span class="text-secondary" style="font-size:0.9rem;">None listed</span>'
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Role Permissions Widget -->
        <div class="widget-card glass-panel">
          <h3 class="widget-title">Security & Permissions</h3>
          <p style="font-size: 0.95rem; margin-bottom: 12px;">
            Your role <strong>${user.role ? user.role.name : 'Unknown'}</strong> possesses the following system permissions (governed dynamically by CASL Ability controls):
          </p>
          <div style="max-height: 160px; overflow-y: auto;">
            ${user.role && user.role.permissions && user.role.permissions.length > 0
              ? user.role.permissions.map(p => `<span class="badge-tag" style="background:rgba(16,185,129,0.1); color:var(--success);">${p}</span>`).join('')
              : '<span class="text-secondary">No direct permissions.</span>'
            }
          </div>
        </div>
      </div>
    `;
  },

  async renderProjectsView() {
    const panel = document.getElementById('main-content-panel');
    
    // Check if user has permission to create project
    const userPermissions = this.user.role ? this.user.role.permissions : [];
    const canCreate = userPermissions.includes('create_project') || userPermissions.includes('manage_all') || this.user.role?.name === 'Super Admin';

    panel.innerHTML = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <h1 class="page-title">Enterprise Projects</h1>
          <p class="page-subtitle">Collaborate on software projects, track status, visibility rules, and budgets.</p>
        </div>
        ${canCreate ? '<button class="btn-primary" id="btn-new-project" style="width:auto;">Create Project</button>' : ''}
      </div>

      <div id="projects-grid" class="grid-container">
        <div style="grid-column: span 3; text-align:center; padding: 40px 0;">
          <div class="loader-spinner" style="margin: 0 auto 12px auto; width:36px; height:36px;"></div>
          <p class="text-secondary" style="font-size:0.9rem;">Retrieving project registry...</p>
        </div>
      </div>
    `;

    if (canCreate) {
      document.getElementById('btn-new-project').addEventListener('click', () => this.showCreateProjectModal());
    }

    try {
      const res = await auth.fetchWithAuth('/api/v1/projects');
      const data = await res.json();
      
      const grid = document.getElementById('projects-grid');
      
      if (!res.ok) {
        grid.innerHTML = `<div style="grid-column: span 3; color:var(--danger); text-align:center; padding:20px;">Error: ${data.message}</div>`;
        return;
      }

      const projects = data.data.projects;

      if (!projects || projects.length === 0) {
        grid.innerHTML = `
          <div class="widget-card glass-panel" style="grid-column: span 3; text-align:center; padding: 60px 20px;">
            <p class="text-secondary" style="font-size:1.1rem; margin-bottom:16px;">No projects found.</p>
            ${canCreate ? '<p class="text-muted" style="font-size:0.9rem;">Click the "Create Project" button to create your first workspace.</p>' : '<p class="text-muted" style="font-size:0.9rem;">You are not assigned to any projects at the moment.</p>'}
          </div>
        `;
        return;
      }

      grid.innerHTML = ''; // Clear loader
      projects.forEach(project => {
        const start = new Date(project.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        const end = new Date(project.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        
        let priorityColor = 'var(--text-secondary)';
        if (project.priority === 'High' || project.priority === 'Critical') priorityColor = 'var(--danger)';
        if (project.priority === 'Medium') priorityColor = 'var(--warning)';
        if (project.priority === 'Low') priorityColor = 'var(--success)';

        const budgetFormatted = new Intl.NumberFormat(undefined, { style: 'currency', currency: project.currency }).format(project.budget);

        const card = document.createElement('div');
        card.className = 'widget-card glass-panel project-card';
        card.style.borderTop = `4px solid ${project.color}`;
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.justifyContent = 'space-between';

        card.innerHTML = `
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <span class="badge-tag" style="background:rgba(255,255,255,0.05); color:var(--text-primary); border:1px solid var(--border-glass); margin:0;">${project.code}</span>
              <span class="badge-tag" style="background:rgba(124,58,237,0.1); color:var(--accent-color); margin:0;">${project.status}</span>
            </div>
            <h3 style="font-size:1.15rem; font-weight:600; margin-bottom:8px;">${project.name}</h3>
            <p style="font-size:0.88rem; color:var(--text-secondary); margin-bottom:16px; line-height:1.4; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical; overflow:hidden;">
              ${project.description || 'No description provided.'}
            </p>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px;">
              <strong>Duration:</strong> ${start} - ${end}
            </div>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:12px;">
              <strong>Budget:</strong> <span style="color:var(--accent-color); font-weight:600;">${budgetFormatted}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
              <span style="font-size:0.85rem; color:var(--text-secondary);">Priority:</span>
              <span class="badge-tag" style="background:rgba(255,255,255,0.02); color:${priorityColor}; border:1px solid ${priorityColor}40; margin:0; padding:2px 8px; font-size:0.75rem;">${project.priority}</span>
            </div>
          </div>
          <div style="border-top:1px solid var(--border-glass); padding-top:12px; margin-top:12px; display:flex; justify-content:space-between; align-items:center;">
            <div class="user-badge" style="margin-bottom:0;">
              <div class="avatar" style="width:28px; height:28px; font-size:0.75rem;">${project.manager?.name.charAt(0).toUpperCase() || 'M'}</div>
              <span style="font-size:0.85rem; color:var(--text-secondary);">${project.manager?.name || 'Unassigned'}</span>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="badge-tag" style="background:rgba(255,255,255,0.04); color:var(--text-secondary); margin:0; padding:2px 8px; font-size:0.75rem;">${project.members?.length || 0} Members</span>
              <button class="btn-logout btn-delete-project" data-id="${project.id}" style="padding:4px 8px; font-size:0.75rem; border-radius:4px;">Delete</button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });

      // Bind delete buttons
      document.querySelectorAll('.btn-delete-project').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const projId = btn.getAttribute('data-id');
          if (confirm('Are you sure you want to delete this project? This will trigger a soft delete.')) {
            try {
              const dRes = await auth.fetchWithAuth(`/api/v1/projects/${projId}`, { method: 'DELETE' });
              const dData = await dRes.json();
              if (dRes.ok) {
                this.showToast('Project deleted successfully.');
                this.renderProjectsView(); // refresh
              } else {
                throw new Error(dData.message);
              }
            } catch (err) {
              this.showToast(err.message, 'error');
            }
          }
        });
      });

    } catch (err) {
      this.showToast(err.message, 'error');
    }
  },

  async showCreateProjectModal() {
    // Create or find modal overlay in DOM
    let overlay = document.getElementById('project-modal');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'project-modal';
      overlay.className = 'modal-overlay';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
      <div class="modal-content glass-panel">
        <div class="modal-header">
          <h2 class="modal-title">New Project Registry</h2>
          <button class="modal-close" id="modal-close-btn">&times;</button>
        </div>
        <form id="create-project-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="proj-name">Project Name</label>
              <input class="form-control" type="text" id="proj-name" required placeholder="e.g. ERP Cloud Core">
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-code">Project Code</label>
              <input class="form-control" type="text" id="proj-code" required placeholder="e.g. CORECLOUD">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="proj-description">Description</label>
            <textarea class="form-control" id="proj-description" rows="3" placeholder="Define the workspace target scope..."></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="proj-category">Category</label>
              <input class="form-control" type="text" id="proj-category" placeholder="e.g. Software Dev">
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-dept">Department</label>
              <input class="form-control" type="text" id="proj-dept" placeholder="e.g. R&D Eng">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="proj-budget">Budget</label>
              <input class="form-control" type="number" id="proj-budget" value="10000" min="0">
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-currency">Currency</label>
              <select class="form-control" id="proj-currency">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="proj-priority">Priority</label>
              <select class="form-control" id="proj-priority">
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-visibility">Visibility</label>
              <select class="form-control" id="proj-visibility">
                <option value="Private" selected>Private (Members & Manager Only)</option>
                <option value="Public">Public (Read access for all)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="proj-start">Start Date</label>
              <input class="form-control" type="date" id="proj-start" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="proj-end">End Date</label>
              <input class="form-control" type="date" id="proj-end" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="proj-manager">Designated Manager</label>
            <select class="form-control" id="proj-manager" required>
              <option value="">Loading users...</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Team Members</label>
            <div class="checkbox-list" id="proj-members-list">
              <p class="text-secondary" style="font-size:0.85rem; padding: 4px;">Loading user list...</p>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px;">
            <button class="btn-logout" type="button" id="modal-cancel-btn" style="width:auto; padding:10px 20px;">Cancel</button>
            <button class="btn-primary" type="submit" id="modal-submit-btn" style="width:auto; padding:10px 20px;">Create Project</button>
          </div>
        </form>
      </div>
    `;

    // Add visual dates defaults
    const today = new Date().toISOString().split('T')[0];
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const endDefault = sixMonthsLater.toISOString().split('T')[0];
    document.getElementById('proj-start').value = today;
    document.getElementById('proj-end').value = endDefault;

    // Toggle Modal State
    overlay.classList.add('active');

    const closeModal = () => {
      overlay.classList.remove('active');
    };

    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

    // Fetch user details for manager & team options
    try {
      const uRes = await auth.fetchWithAuth('/api/v1/auth/users');
      const uData = await uRes.json();
      if (uRes.ok) {
        const users = uData.data.users;
        
        // Populate manager options
        const mSelect = document.getElementById('proj-manager');
        mSelect.innerHTML = '';
        users.forEach(u => {
          const opt = document.createElement('option');
          opt.value = u.id;
          opt.innerText = `${u.name} (${u.role ? u.role.name : 'User'})`;
          if (u.id === this.user.id) {
            opt.selected = true; // Default to self
          }
          mSelect.appendChild(opt);
        });

        // Populate members options
        const membersList = document.getElementById('proj-members-list');
        membersList.innerHTML = '';
        users.forEach(u => {
          const item = document.createElement('div');
          item.className = 'checkbox-item';
          item.innerHTML = `
            <input type="checkbox" name="members" value="${u.id}" id="check-member-${u.id}">
            <label for="check-member-${u.id}">${u.name} - <span style="color:var(--text-secondary); font-size:0.8rem;">${u.role ? u.role.name : 'User'}</span></label>
          `;
          membersList.appendChild(item);
        });
      }
    } catch (err) {
      console.error(err);
      this.showToast('Failed to fetch organization users.', 'error');
    }

    // Handle Form Submit
    const form = document.getElementById('create-project-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const members = Array.from(document.querySelectorAll('input[name="members"]:checked')).map(el => el.value);

      const payload = {
        name: document.getElementById('proj-name').value,
        code: document.getElementById('proj-code').value,
        description: document.getElementById('proj-description').value,
        category: document.getElementById('proj-category').value,
        department: document.getElementById('proj-dept').value,
        budget: Number(document.getElementById('proj-budget').value),
        currency: document.getElementById('proj-currency').value,
        priority: document.getElementById('proj-priority').value,
        visibility: document.getElementById('proj-visibility').value,
        startDate: new Date(document.getElementById('proj-start').value).toISOString(),
        endDate: new Date(document.getElementById('proj-end').value).toISOString(),
        manager: document.getElementById('proj-manager').value,
        members: members,
        status: 'Planning'
      };

      const submitBtn = document.getElementById('modal-submit-btn');
      const originText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Registering Workspace...';

      try {
        const pRes = await auth.fetchWithAuth('/api/v1/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const pData = await pRes.json();
        if (pRes.ok) {
          this.showToast('Project registered successfully!');
          closeModal();
          this.renderProjectsView(); // Refresh list
        } else {
          throw new Error(pData.message);
        }
      } catch (err) {
        this.showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originText;
      }
    });
  }
};

// Initial start on window load
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});

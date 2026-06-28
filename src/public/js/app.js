// Global Application State
const state = {
  user: null,
  activeRoute: '#login'
};

// Toast Notifications Helper
const showToast = (message, type = 'success') => {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-times-circle';
  if (type === 'warning') icon = 'fa-exclamation-circle';
  if (type === 'info') icon = 'fa-info-circle';

  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${icon}" style="color: ${type === 'error' ? 'var(--danger-color)' : type === 'warning' ? 'var(--warning-color)' : type === 'info' ? 'var(--info-color)' : 'var(--accent-color)'}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);

  // Auto remove toast
  const timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);

  // Close on click
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timer);
    toast.remove();
  });
};

// Show/Hide Loader
const setLoader = (show) => {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.style.opacity = show ? '1' : '0';
    loader.style.visibility = show ? 'visible' : 'hidden';
  }
};

// API Call Wrapper
const apiRequest = async (url, options = {}) => {
  setLoader(true);
  try {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    // Include cookies
    options.credentials = 'include';

    const response = await fetch(url, options);
    
    // Parse response
    const json = await response.json();
    
    if (!response.ok) {
      throw new Error(json.message || 'Something went wrong');
    }
    
    return json;
  } catch (error) {
    showToast(error.message, 'error');
    throw error;
  } finally {
    setLoader(false);
  }
};

// Authentication Checks on load
const checkAuthStatus = async () => {
  try {
    const res = await apiRequest('/api/v1/auth/me');
    if (res && res.status === 'success') {
      state.user = res.data;
      navigate('#dashboard');
      return true;
    }
  } catch (err) {
    // If not authenticated, force login
    state.user = null;
    navigate('#login');
    return false;
  }
};

// Navigation controller
const navigate = (route) => {
  state.activeRoute = route;
  window.location.hash = route;
  renderPage();
};

// Render Pages dynamically
const renderPage = () => {
  const root = document.getElementById('app-root');
  if (!root) return;

  // Clear existing (except loader and toasts which are outside root)
  root.innerHTML = '';

  const route = window.location.hash || '#login';

  if (!state.user && route !== '#register') {
    renderLoginView(root);
    return;
  }

  switch(route) {
    case '#login':
      if (state.user) {
        navigate('#dashboard');
      } else {
        renderLoginView(root);
      }
      break;
    case '#register':
      if (state.user) {
        navigate('#dashboard');
      } else {
        renderRegisterView(root);
      }
      break;
    case '#dashboard':
    case '#profile':
    case '#users':
      renderDashboardLayout(root, route);
      break;
    default:
      navigate('#login');
  }
};

// Render Login View
const renderLoginView = (container) => {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-brand"><i class="fas fa-cubes logo-icon"></i> EPMS</div>
          <h2 class="auth-title">Welcome Back</h2>
          <p class="auth-subtitle">Login to access your ERP dashboard</p>
        </div>
        <form id="login-form">
          <div class="form-group">
            <label class="form-label">Email or Username</label>
            <div class="input-group">
              <i class="fas fa-user input-icon"></i>
              <input type="text" id="usernameOrEmail" class="form-input" placeholder="admin@epms.com" required autocomplete="username">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-group">
              <i class="fas fa-lock input-icon"></i>
              <input type="password" id="password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
            </div>
          </div>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-sign-in-alt"></i> Sign In
          </button>
        </form>
        <div class="auth-footer">
          Don't have an account? <a href="#register" class="auth-link">Register here</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const usernameOrEmail = document.getElementById('usernameOrEmail').value;
    const password = document.getElementById('password').value;

    try {
      const res = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ usernameOrEmail, password })
      });
      if (res.status === 'success') {
        showToast('Login successful!');
        state.user = res.data.user;
        navigate('#dashboard');
      }
    } catch (err) {}
  });
};

// Render Register View
const renderRegisterView = (container) => {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-brand"><i class="fas fa-cubes logo-icon"></i> EPMS</div>
          <h2 class="auth-title">Create Account</h2>
          <p class="auth-subtitle">Register a new enterprise profile</p>
        </div>
        <form id="register-form">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <div class="input-group">
              <i class="fas fa-user-tag input-icon"></i>
              <input type="text" id="reg-name" class="form-input" placeholder="John Doe" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Username</label>
            <div class="input-group">
              <i class="fas fa-user input-icon"></i>
              <input type="text" id="reg-username" class="form-input" placeholder="johndoe" required autocomplete="username">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <div class="input-group">
              <i class="fas fa-envelope input-icon"></i>
              <input type="email" id="reg-email" class="form-input" placeholder="john@epms.com" required autocomplete="email">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-group">
              <i class="fas fa-lock input-icon"></i>
              <input type="password" id="reg-password" class="form-input" placeholder="••••••••" required autocomplete="new-password">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Department</label>
            <div class="input-group">
              <i class="fas fa-building input-icon"></i>
              <input type="text" id="reg-dept" class="form-input" placeholder="Engineering">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Designation</label>
            <div class="input-group">
              <i class="fas fa-briefcase input-icon"></i>
              <input type="text" id="reg-desg" class="form-input" placeholder="Software Engineer">
            </div>
          </div>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-user-plus"></i> Register Profile
          </button>
        </form>
        <div class="auth-footer">
          Already have an account? <a href="#login" class="auth-link">Login here</a>
        </div>
      </div>
    </div>
  `;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const department = document.getElementById('reg-dept').value;
    const designation = document.getElementById('reg-desg').value;

    try {
      const res = await apiRequest('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, username, email, password, department, designation })
      });
      if (res.status === 'success') {
        showToast('Registration successful! Please login.');
        navigate('#login');
      }
    } catch (err) {}
  });
};

// Render Dashboard Layout (Sidebar + Top bar + Main Body)
const renderDashboardLayout = (container, subRoute) => {
  const sidebarItems = [
    { label: 'Dashboard', icon: 'fa-chart-pie', route: '#dashboard' },
    { label: 'My Profile', icon: 'fa-user-circle', route: '#profile' }
  ];

  // If user is superadmin/admin, add "Users Management" tab
  if (state.user && (state.user.role.code === 'SUPER_ADMIN' || state.user.role.code === 'ADMIN')) {
    sidebarItems.push({ label: 'Users', icon: 'fa-users', route: '#users' });
  }

  container.innerHTML = `
    <div class="dashboard-wrapper">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <i class="fas fa-cubes logo-icon"></i>
          <span class="logo-text">EPMS ERP</span>
        </div>
        <ul class="sidebar-menu">
          ${sidebarItems.map(item => `
            <li class="menu-item ${subRoute === item.route ? 'active' : ''}">
              <a href="${item.route}">
                <i class="fas ${item.icon}"></i>
                <span>${item.label}</span>
              </a>
            </li>
          `).join('')}
        </ul>
        <div class="sidebar-footer">
          <div class="user-avatar">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="user-info">
            <div class="user-name">${state.user.name}</div>
            <div class="user-role">${state.user.role ? state.user.role.name : 'Employee'}</div>
          </div>
          <button class="btn-logout" id="btn-logout" title="Sign Out">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </aside>

      <!-- Main Panel -->
      <main class="main-content">
        <header class="top-bar">
          <h2 class="page-title" id="page-title">Dashboard</h2>
          <div>
            <!-- Quick Actions / Right Side Top bar -->
            <span style="font-size: 0.85rem; color: var(--text-secondary)">
              <i class="fas fa-clock"></i> Local Time: ${new Date().toLocaleTimeString()}
            </span>
          </div>
        </header>
        
        <!-- Page Body Content -->
        <div class="content-body" id="dashboard-content-body"></div>
      </main>
    </div>
  `;

  // Bind logout action
  document.getElementById('btn-logout').addEventListener('click', async () => {
    try {
      await apiRequest('/api/v1/auth/logout', { method: 'POST' });
      state.user = null;
      showToast('Logged out successfully.');
      navigate('#login');
    } catch (err) {}
  });

  const contentBody = document.getElementById('dashboard-content-body');
  const pageTitle = document.getElementById('page-title');

  if (subRoute === '#dashboard') {
    pageTitle.textContent = 'Dashboard Overview';
    renderDashboardView(contentBody);
  } else if (subRoute === '#profile') {
    pageTitle.textContent = 'User Profile';
    renderProfileView(contentBody);
  } else if (subRoute === '#users') {
    pageTitle.textContent = 'Users Management';
    renderUsersView(contentBody);
  }
};

// Render Dashboard Default View
const renderDashboardView = (container) => {
  container.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 40px; border-radius: var(--radius-lg); text-align: center; max-width: 800px; margin: 0 auto; box-shadow: var(--shadow-md);">
      <h3 style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 12px; color: var(--text-primary);">
        Welcome to your Enterprise Portal, ${state.user.name}!
      </h3>
      <p style="color: var(--text-secondary); margin-bottom: 24px;">
        The system core foundation, JWT authentication, dynamic session tracking, and CASL-based instance security rules are fully operational.
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; text-align: left;">
        <div style="padding: 20px; background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div style="font-size: 1.5rem; color: var(--accent-color); margin-bottom: 6px;"><i class="fas fa-shield-alt"></i></div>
          <h4 style="margin-bottom: 4px;">CASL Security</h4>
          <p style="font-size: 0.8rem; color: var(--text-secondary)">Strict instance checking active on user actions.</p>
        </div>
        <div style="padding: 20px; background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div style="font-size: 1.5rem; color: var(--info-color); margin-bottom: 6px;"><i class="fas fa-fingerprint"></i></div>
          <h4 style="margin-bottom: 4px;">JWT Sessions</h4>
          <p style="font-size: 0.8rem; color: var(--text-secondary)">Tokens rotated automatically inside secure HTTP Cookies.</p>
        </div>
        <div style="padding: 20px; background-color: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div style="font-size: 1.5rem; color: var(--warning-color); margin-bottom: 6px;"><i class="fas fa-layer-group"></i></div>
          <h4 style="margin-bottom: 4px;">Modular</h4>
          <p style="font-size: 0.8rem; color: var(--text-secondary)">Isolated repository-service-controller clean architecture.</p>
        </div>
      </div>
    </div>
  `;
};

// Render Detailed Profile View
const renderProfileView = (container) => {
  container.innerHTML = `
    <div class="profile-grid">
      <!-- Left Sidebar Profile details -->
      <div class="profile-sidebar-card">
        <div class="profile-avatar-large">
          <i class="fas fa-user-circle"></i>
        </div>
        <h3 class="profile-name">${state.user.name}</h3>
        <p class="profile-desg">${state.user.designation || 'N/A'}</p>
        <span class="profile-tag">${state.user.role ? state.user.role.name : 'Employee'}</span>
        
        <ul class="profile-details-list">
          <li>
            <span>Username</span>
            <span>${state.user.username}</span>
          </li>
          <li>
            <span>Department</span>
            <span>${state.user.department || 'N/A'}</span>
          </li>
          <li>
            <span>Employee ID</span>
            <span>${state.user.employeeId || 'N/A'}</span>
          </li>
          <li>
            <span>Experience</span>
            <span>${state.user.experience} Years</span>
          </li>
          <li>
            <span>Timezone</span>
            <span>${state.user.timeZone}</span>
          </li>
        </ul>
      </div>

      <!-- Right Main Profile Details -->
      <div class="profile-main-card">
        <h4 class="profile-section-title">Biography</h4>
        <p class="profile-bio-text">
          ${state.user.bio || 'This employee hasn\'t written a biography yet. Set up skills, contact details, and experience to represent them in the company system.'}
        </p>

        <h4 class="profile-section-title">Employee Skills</h4>
        <div class="skills-container">
          ${state.user.skills && state.user.skills.length > 0
            ? state.user.skills.map(skill => `<span class="skill-chip">${skill}</span>`).join('')
            : '<p style="color: var(--text-muted); font-size: 0.9rem">No skills added yet.</p>'
          }
        </div>

        <h4 class="profile-section-title">Contact Information</h4>
        <ul class="profile-details-list" style="border-top: none; padding-top: 0; max-width: 500px;">
          <li>
            <span>Email Address</span>
            <span>${state.user.email}</span>
          </li>
          <li>
            <span>Contact Number</span>
            <span>${state.user.contactDetails && state.user.contactDetails.phone ? state.user.contactDetails.phone : 'N/A'}</span>
          </li>
          <li>
            <span>Office Address</span>
            <span>${state.user.contactDetails && state.user.contactDetails.address ? state.user.contactDetails.address : 'N/A'}</span>
          </li>
        </ul>
      </div>
    </div>
  `;
};

// Render User Management List View (Admin only)
const renderUsersView = async (container) => {
  container.innerHTML = `
    <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 30px; box-shadow: var(--shadow-md);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h3 style="font-family: var(--font-heading); font-size: 1.2rem; font-weight: 600;">Enterprise Employees</h3>
        <span style="font-size: 0.8rem; padding: 4px 10px; background-color: rgba(59, 130, 246, 0.15); border-radius: 12px; color: var(--info-color)">
          <i class="fas fa-info-circle"></i> Authorized Admin Access
        </span>
      </div>
      
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); color: var(--text-secondary);">
              <th style="padding: 12px 16px;">Employee</th>
              <th style="padding: 12px 16px;">Username</th>
              <th style="padding: 12px 16px;">Email</th>
              <th style="padding: 12px 16px;">Department</th>
              <th style="padding: 12px 16px;">Designation</th>
              <th style="padding: 12px 16px;">System Role</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            <tr>
              <td colspan="6" style="padding: 30px; text-align: center; color: var(--text-muted)">
                <i class="fas fa-spinner fa-spin"></i> Loading employee directory...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  try {
    const res = await apiRequest('/api/v1/users');
    const tableBody = document.getElementById('users-table-body');
    if (!tableBody) return;

    if (res.status === 'success' && res.data.length > 0) {
      tableBody.innerHTML = res.data.map(emp => `
        <tr style="border-bottom: 1px solid var(--border-color); transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='var(--bg-tertiary)'" onmouseout="this.style.backgroundColor='transparent'">
          <td style="padding: 16px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: var(--bg-tertiary); display: flex; justify-content: center; align-items: center; font-size: 0.9rem; color: var(--accent-color)">
              ${emp.name[0]}
            </div>
            ${emp.name}
          </td>
          <td style="padding: 16px; color: var(--text-secondary)">${emp.username}</td>
          <td style="padding: 16px; color: var(--text-secondary)">${emp.email}</td>
          <td style="padding: 16px; color: var(--text-secondary)">${emp.department || 'N/A'}</td>
          <td style="padding: 16px; color: var(--text-secondary)">${emp.designation || 'N/A'}</td>
          <td style="padding: 16px;">
            <span style="font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 12px; background-color: ${emp.role.code === 'SUPER_ADMIN' ? 'rgba(239, 68, 68, 0.15)' : emp.role.code === 'ADMIN' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'}; color: ${emp.role.code === 'SUPER_ADMIN' ? 'var(--danger-color)' : emp.role.code === 'ADMIN' ? 'var(--warning-color)' : 'var(--accent-color)'}">
              ${emp.role.name}
            </span>
          </td>
        </tr>
      `).join('');
    } else {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 30px; text-align: center; color: var(--text-muted)">
            No employees found.
          </td>
        </tr>
      `;
    }
  } catch (err) {
    const tableBody = document.getElementById('users-table-body');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 30px; text-align: center; color: var(--danger-color)">
            Failed to load directory. Access denied.
          </td>
        </tr>
      `;
    }
  }
};

// Listen to Hash Change for SPA Routing
window.addEventListener('hashchange', () => {
  renderPage();
});

// App Initialization
window.addEventListener('DOMContentLoaded', async () => {
  // Check auth status on load
  await checkAuthStatus();
  renderPage();
});

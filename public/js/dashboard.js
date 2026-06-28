import { apiFetch, getActiveTenantId, setActiveTenantId } from "./api.js";
console.log("dashbord fiel is link");
document.addEventListener("DOMContentLoaded", () => {
  let projects = [];
  let currentUser = null;
  let activeRole = "developer";

  // ─── Role Hierarchy (frontend mirror of backend ROLE_HIERARCHY) ───
  const ROLE_RANK = {
    "super admin": 5,
    admin: 4,
    "project manager": 3,
    developer: 2,
    tester: 2,
    "backend developer": 2,
    "frontend developer": 2,
    "database administrator": 2,
  };

  /**
   * Returns true if the current user (actorRole) has higher authority
   * than the target user (targetRole). Super admin can act on anyone.
   */
  function canActOn(actorRole, targetRole) {
    if (actorRole === "super admin") return true;
    return (ROLE_RANK[actorRole] || 0) > (ROLE_RANK[targetRole] || 0);
  }

  // Tracks the current role of the user being edited in the role modal
  let editRoleTargetCurrentRole = null;

  // DOM elements
  const welcomeMessage = document.getElementById("welcome-message");
  const tenantDisplayName = document.getElementById("tenant-display-name");
  const workspaceSelect = document.getElementById("workspace-select");
  const userAvatarInitial = document.getElementById("user-avatar-initial");
  const userDisplayName = document.getElementById("user-display-name");
  const userDisplayRole = document.getElementById("user-display-role");
  const userDisplayId = document.getElementById("user-display-id");
  const logoutBtn = document.getElementById("logout-btn");

  // Views
  const dashboardActiveView = document.getElementById("dashboard-active-view");
  const noWorkspaceView = document.getElementById("no-workspace-view");
  const userIdBadge = document.getElementById("user-id-badge");
  const copyUserIdBtn = document.getElementById("copy-user-id-btn");

  // Stats elements
  const statTotal = document.getElementById("stat-total");
  const statActive = document.getElementById("stat-active");
  const statCompleted = document.getElementById("stat-completed");
  const statBudget = document.getElementById("stat-budget");
  const projectCountBadge = document.getElementById("project-count");

  // Table elements
  const projectTableBody = document.getElementById("project-table-body");
  const userManagementSection = document.getElementById(
    "user-management-section",
  );
  const userTableBody = document.getElementById("user-table-body");

  // Modals
  const projectModal = document.getElementById("project-modal");
  const projectForm = document.getElementById("project-form");
  const addProjectBtn = document.getElementById("add-project-btn");
  const modalCloseX = document.getElementById("modal-close-x");
  const modalCancelBtn = document.getElementById("modal-cancel-btn");
  const modalTitle = document.getElementById("modal-title");
  const modalAlert = document.getElementById("modal-alert");
  const projectIdInput = document.getElementById("project-id");

  const workspaceModal = document.getElementById("workspace-modal");
  const workspaceForm = document.getElementById("workspace-form");
  const workspaceModalCloseX = document.getElementById(
    "workspace-modal-close-x",
  );
  const workspaceModalCancelBtn = document.getElementById(
    "workspace-modal-cancel-btn",
  );
  const workspaceModalAlert = document.getElementById("workspace-modal-alert");
  const createWorkspaceNavBtn = document.getElementById(
    "create-workspace-nav-btn",
  );
  const createFirstWorkspaceBtn = document.getElementById(
    "create-first-workspace-btn",
  );

  const employeeModal = document.getElementById("employee-modal");
  const employeeForm = document.getElementById("employee-form");
  const employeeModalCloseX = document.getElementById("employee-modal-close-x");
  const employeeModalCancelBtn = document.getElementById(
    "employee-modal-cancel-btn",
  );
  const employeeModalAlert = document.getElementById("employee-modal-alert");
  const addEmployeeTrigger = document.getElementById("add-employee-trigger");

  const addUserModal = document.getElementById("add-user-modal");
  const addUserForm = document.getElementById("add-user-form");
  const addUserModalCloseX = document.getElementById("add-user-modal-close-x");
  const addUserModalCancelBtn = document.getElementById(
    "add-user-modal-cancel-btn",
  );
  const addUserModalAlert = document.getElementById("add-user-modal-alert");
  const addUserTrigger = document.getElementById("add-user-trigger");

  const editRoleModal = document.getElementById("edit-role-modal");
  const editRoleForm = document.getElementById("edit-role-form");
  const editRoleModalCloseX = document.getElementById(
    "edit-role-modal-close-x",
  );
  const editRoleModalCancelBtn = document.getElementById(
    "edit-role-modal-cancel-btn",
  );
  const editRoleModalAlert = document.getElementById("edit-role-modal-alert");
  const editRoleUserIdInput = document.getElementById("editRoleUserId");
  const editRoleSelect = document.getElementById("editRoleSelect");

  // Modal Form Inputs
  const nameInput = document.getElementById("projectName");
  const descriptionInput = document.getElementById("projectDescription");
  const techStackInput = document.getElementById("projectTechStack");
  const budgetInput = document.getElementById("projectBudget");
  const statusSelect = document.getElementById("projectStatus");

  const workspaceNameInput = document.getElementById("workspaceName");
  const workspaceSlugInput = document.getElementById("workspaceSlug");
  const employeeUserIdInput = document.getElementById("employeeUserId");

  const newUserNameInput = document.getElementById("newUserName");
  const newUserEmailInput = document.getElementById("newUserEmail");
  const newUserPasswordInput = document.getElementById("newUserPassword");
  const newUserRoleSelect = document.getElementById("newUserRole");

  // Theme Elements
  const themeToggle = document.getElementById("theme-toggle");
  const themeIconSun = document.getElementById("theme-icon-sun");
  const themeIconMoon = document.getElementById("theme-icon-moon");

  // --- Initial Operations & Session Check ---
  initDashboard();

  async function initDashboard() {
    setupTheme();

    try {
      const res = await apiFetch("/api/auth/me");
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
        window.location.href = "/login.html";
      }
    } catch (err) {
      console.error("Session initialization failed:", err);
      window.location.href = "/login.html";
    }
  }

  function renderProfileBadge(user) {
    if (!user) return;
    const name = user.name || "User";
    userDisplayName.textContent = name;
    userAvatarInitial.textContent = name.charAt(0).toUpperCase();
    userDisplayId.textContent = `ID: ${user._id || user.id}`;
  }

  function showNoWorkspaceState(user) {
    dashboardActiveView.style.display = "none";
    addProjectBtn.style.display = "none";
    document.getElementById("workspace-selector-container").style.display =
      "none";

    welcomeMessage.textContent = `Hello, ${user.name.split(" ")[0]}!`;
    tenantDisplayName.textContent = "No active workspace selected";
    userDisplayRole.textContent = "GUEST";
    userIdBadge.textContent = user._id || user.id;

    noWorkspaceView.style.display = "block";
  }

  function showActiveWorkspaceState(user) {
    noWorkspaceView.style.display = "none";
    document.getElementById("workspace-selector-container").style.display =
      "block";

    setupWorkspaceDropdown(user);
    updateWorkspaceUI();

    dashboardActiveView.style.display = "block";
    fetchProjects();
    fetchUsersDirectory();
  }

  function setupWorkspaceDropdown(user) {
    workspaceSelect.innerHTML = "";

    user.memberships.forEach((memb) => {
      const tenant = memb.tenantId;
      if (!tenant) return;

      const opt = document.createElement("option");
      opt.value = tenant._id;
      opt.textContent = `${tenant.name} (${memb.role})`;
      workspaceSelect.appendChild(opt);
    });

    let activeId = getActiveTenantId();
    const hasActiveId = user.memberships.some(
      (m) => m.tenantId?._id === activeId,
    );

    if (!activeId || !hasActiveId) {
      if (user.memberships.length > 0) {
        activeId = user.memberships[0].tenantId._id;
        setActiveTenantId(activeId);
      }
    }

    workspaceSelect.value = activeId;
  }

  // Handle workspace change dropdown
  workspaceSelect.addEventListener("change", (e) => {
    const selectedId = e.target.value;
    setActiveTenantId(selectedId);
    updateWorkspaceUI();
    fetchProjects();
    fetchUsersDirectory();
  });

  function updateWorkspaceUI() {
    if (!currentUser) return;

    const activeId = getActiveTenantId();
    const membership = currentUser.memberships.find(
      (m) => m.tenantId?._id === activeId,
    );

    if (membership) {
      activeRole = membership.role;
      const tenantName = membership.tenantId.name;

      const userFirstName = currentUser.name || "User";
      welcomeMessage.textContent = `Hello, ${userFirstName.split(" ")[0]}!`;
      tenantDisplayName.textContent = `Workspace: ${tenantName}`;

      userDisplayRole.textContent = activeRole.toUpperCase();

      // Super Admins, Admins, and Project Managers can create projects
      if (
        activeRole === "super admin" ||
        activeRole === "admin" ||
        activeRole === "project manager"
      ) {
        addProjectBtn.style.display = "inline-flex";
      } else {
        addProjectBtn.style.display = "none";
      }
    }
  }

  // --- Copy User ID Functionality ---
  function copyUserId() {
    if (!currentUser) return;
    const id = currentUser._id || currentUser.id;
    navigator.clipboard
      .writeText(id)
      .then(() => {
        const originalText = copyUserIdBtn.textContent;
        copyUserIdBtn.textContent = "Copied!";
        copyUserIdBtn.classList.remove("btn-secondary");
        copyUserIdBtn.classList.add("btn-primary");
        setTimeout(() => {
          copyUserIdBtn.textContent = originalText;
          copyUserIdBtn.classList.remove("btn-primary");
          copyUserIdBtn.classList.add("btn-secondary");
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  if (copyUserIdBtn) {
    copyUserIdBtn.addEventListener("click", copyUserId);
  }
  userDisplayId.addEventListener("click", copyUserId);

  // --- Theme Controller ---
  function setupTheme() {
    const currentTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener("click", () => {
      const activeTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = activeTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
      updateThemeIcon(newTheme);
    });
  }

  function updateThemeIcon(theme) {
    if (theme === "dark") {
      themeIconSun.style.display = "none";
      themeIconMoon.style.display = "block";
    } else {
      themeIconSun.style.display = "block";
      themeIconMoon.style.display = "none";
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
      const res = await apiFetch("/api/projects");
      if (res.ok) {
        const body = await res.json();
        projects = body.data;
        renderProjects(projects);
        updateStatistics(projects);
      } else {
        const body = await res.json();
        showTableError(body.message || "Access denied to this workspace.");
      }
    } catch (err) {
      console.error("Failed to load projects catalog:", err);
      showTableError("Network error. Unable to retrieve project listing.");
    }
  }

  function renderProjects(list) {
    projectTableBody.innerHTML = "";

    if (list.length === 0) {
      projectTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            <div class="empty-state-icon">💻</div>
            <p>${activeRole === "super admin" || activeRole === "admin" || activeRole === "project manager" ? 'No projects added yet. Click "Add Project" to register your first project.' : "No projects found in this workspace."}</p>
          </td>
        </tr>
      `;
      return;
    }

    list.forEach((project) => {
      const tr = document.createElement("tr");

      const badgeClass =
        project.status === "Completed"
          ? "badge-success"
          : project.status === "In Progress"
            ? "badge-warning"
            : project.status === "On Hold"
              ? "badge-danger"
              : "badge-info";

      let actionsHtml = `<div style="display: flex; gap: 8px; justify-content: center; align-items: center; color: var(--text-secondary); font-size: 0.85rem;">Read Only</div>`;

      // Admins, Super Admins, and PMs can edit/delete
      if (
        activeRole === "super admin" ||
        activeRole === "admin" ||
        activeRole === "project manager"
      ) {
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
        <td class="actions-cell">${actionsHtml}</td>
      `;

      // ── Row click → open project detail page (skip action buttons) ──
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', (e) => {
        if (e.target.closest('.actions-cell')) return;
        window.location.href = `/project.html?id=${project._id}`;
      });

      projectTableBody.appendChild(tr);
    });


    // Add click listeners to actions
    document.querySelectorAll(".edit-project-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = btn.getAttribute("data-id");
        openEditProjectModal(id);
      });
    });

    document.querySelectorAll(".delete-project-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = btn.getAttribute("data-id");
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

    const active = list.filter((p) => p.status === "In Progress").length;
    statActive.textContent = active;

    const completed = list.filter((p) => p.status === "Completed").length;
    statCompleted.textContent = completed;

    const totalBudget = list.reduce(
      (sum, p) => sum + (Number(p.budget) || 0),
      0,
    );
    statBudget.textContent = `$${totalBudget.toLocaleString()}`;

    projectCountBadge.textContent = `${list.length} Project${list.length === 1 ? "" : "s"}`;
  }

  // --- Fetch Workspace Users Directory ---
  async function fetchUsersDirectory() {
    // Only super admin or admin can manage workspace users
    if (
      !currentUser ||
      (activeRole !== "super admin" && activeRole !== "admin")
    ) {
      userManagementSection.style.display = "none";
      return;
    }

    userTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Loading users directory...</td>
      </tr>
    `;

    try {
      const res = await apiFetch("/api/user-management/users");
      if (res.ok) {
        const body = await res.json();
        renderUsersDirectory(body.data);
      } else {
        userManagementSection.style.display = "none";
      }
    } catch (err) {
      console.error("Failed to load users directory:", err);
      userManagementSection.style.display = "none";
    }
  }

  function renderUsersDirectory(list) {
    userTableBody.innerHTML = "";
    userManagementSection.style.display = "block";

    if (list.length === 0) {
      userTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-state">No users associated with this workspace.</td>
        </tr>
      `;
      return;
    }

    list.forEach((emp) => {
      const tr = document.createElement("tr");

      const statusBadge =
        emp.status === "archived"
          ? '<span class="badge badge-danger">ARCHIVED</span>'
          : '<span class="badge badge-success">ACTIVE</span>';

      const isSelf = emp.id === currentUser._id || emp.id === currentUser.id;
      const actorCanAct = canActOn(activeRole, emp.role);

      // ── Edit Role Button ──────────────────────────────────────────
      let editRoleBtn;
      if (isSelf) {
        editRoleBtn = `<button class="btn btn-secondary" disabled
          title="You cannot change your own role"
          style="padding:4px 8px;font-size:0.75rem;opacity:0.45;cursor:not-allowed;">
          Edit Role</button>`;
      } else if (!actorCanAct) {
        editRoleBtn = `<button class="btn btn-secondary" disabled
          title="Cannot modify a user with equal or higher role"
          style="padding:4px 8px;font-size:0.75rem;opacity:0.45;cursor:not-allowed;">
          Edit Role</button>`;
      } else {
        editRoleBtn = `<button class="btn btn-secondary edit-role-btn"
          data-id="${emp.id}" data-role="${emp.role}"
          style="padding:4px 8px;font-size:0.75rem;">Edit Role</button>`;
      }

      // ── Archive / Reactivate Button ───────────────────────────────
      let toggleStatusBtn = "";
      if (!isSelf && actorCanAct) {
        if (emp.status === "archived") {
          toggleStatusBtn = `<button class="btn btn-secondary activate-user-btn"
            data-id="${emp.id}"
            style="padding:4px 8px;font-size:0.75rem;">Reactivate</button>`;
        } else {
          toggleStatusBtn = `<button class="btn btn-secondary archive-user-btn"
            data-id="${emp.id}"
            style="padding:4px 8px;font-size:0.75rem;background:var(--danger-color);border:none;color:#fff;">
            Archive</button>`;
        }
      } else if (!isSelf && !actorCanAct) {
        // Show greyed-out indicator so admin knows why buttons are hidden
        toggleStatusBtn = `<span
          title="Cannot manage a user with equal or higher role"
          style="font-size:0.7rem;color:var(--text-secondary);cursor:help;">🔒 Protected</span>`;
      }

      const actionsHtml = `
        <div style="display:flex;gap:8px;justify-content:center;align-items:center;">
          ${editRoleBtn}
          ${toggleStatusBtn}
        </div>`;

      tr.innerHTML = `
        <td style="font-weight:500;color:var(--text-primary);">${escapeHtml(emp.name)}
          ${isSelf ? '<span style="font-size:0.7rem;color:var(--primary-color);margin-left:4px;">(You)</span>' : ""}
        </td>
        <td style="color:var(--text-secondary);">${escapeHtml(emp.email)}</td>
        <td><span class="tech-stack-tag" style="text-transform:uppercase;">${escapeHtml(emp.role)}</span></td>
        <td>${statusBadge}</td>
        <td>${actionsHtml}</td>`;
      userTableBody.appendChild(tr);
    });

    // Event listeners
    document.querySelectorAll(".edit-role-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const role = btn.getAttribute("data-role");
        openEditRoleModal(id, role);
      });
    });

    document.querySelectorAll(".archive-user-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        toggleUserStatus(id, "archive");
      });
    });

    document.querySelectorAll(".activate-user-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        toggleUserStatus(id, "activate");
      });
    });
  }

  async function toggleUserStatus(id, action) {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const res = await apiFetch(`/api/user-management/users/${id}/${action}`, {
        method: "PUT",
      });

      if (res.ok) {
        fetchUsersDirectory();
      } else {
        const body = await res.json();
        alert(body.message || "Operation failed.");
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      alert("Network error modifying user status.");
    }
  }

  // --- Create/Edit Project Form Actions ---
  if (addProjectBtn) {
    addProjectBtn.addEventListener("click", () => {
      openAddProjectModal();
    });
  }

  function openAddProjectModal() {
    projectForm.reset();
    projectIdInput.value = "";
    modalTitle.textContent = "Add Project";
    modalAlert.style.display = "none";
    projectModal.classList.add("active");
  }

  async function openEditProjectModal(id) {
    projectForm.reset();
    projectIdInput.value = id;
    modalTitle.textContent = "Edit Project";
    modalAlert.style.display = "none";

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

        projectModal.classList.add("active");
      } else {
        const body = await res.json();
        alert(body.message || "Unable to retrieve project details.");
      }
    } catch (err) {
      console.error("Failed to query project document:", err);
      alert("Network error retrieving project details.");
    }
  }

  async function deleteProjectRecord(id) {
    if (
      !confirm("Are you sure you want to permanently delete this IT project?")
    )
      return;

    try {
      const res = await apiFetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchProjects();
      } else {
        const body = await res.json();
        alert(body.message || "Delete failed.");
      }
    } catch (err) {
      console.error("Failed to execute delete request:", err);
      alert("Network error. Delete operation aborted.");
    }
  }

  projectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    modalAlert.style.display = "none";

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
    if (!payload.name) {
      nameInput.classList.add("is-invalid");
      isValid = false;
    }
    if (!payload.description) {
      descriptionInput.classList.add("is-invalid");
      isValid = false;
    }
    if (!payload.techStack) {
      techStackInput.classList.add("is-invalid");
      isValid = false;
    }
    if (isNaN(payload.budget) || payload.budget < 0) {
      budgetInput.classList.add("is-invalid");
      isValid = false;
    }

    if (!isValid) return;

    try {
      const url = id ? `/api/projects/${id}` : "/api/projects";
      const method = id ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        body: payload,
      });

      const body = await res.json();
      if (res.ok && body.success) {
        projectModal.classList.remove("active");
        fetchProjects();
      } else {
        modalAlert.textContent = body.message || "Failed to save project.";
        modalAlert.className = "alert alert-danger";
        modalAlert.style.display = "block";
      }
    } catch (err) {
      console.error("Project save error:", err);
      modalAlert.textContent = "Network error. Save aborted.";
      modalAlert.className = "alert alert-danger";
      modalAlert.style.display = "block";
    }
  });

  // Modal Closures
  const closeProjectModal = () => {
    projectModal.classList.remove("active");
  };
  if (modalCloseX) modalCloseX.addEventListener("click", closeProjectModal);
  if (modalCancelBtn)
    modalCancelBtn.addEventListener("click", closeProjectModal);

  // --- Create Workspace Modal Trigger ---
  const openWorkspaceModal = () => {
    workspaceForm.reset();
    workspaceModalAlert.style.display = "none";
    workspaceModal.classList.add("active");
  };

  createWorkspaceNavBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openWorkspaceModal();
  });

  if (createFirstWorkspaceBtn) {
    createFirstWorkspaceBtn.addEventListener("click", openWorkspaceModal);
  }

  const closeWorkspaceModal = () => {
    workspaceModal.classList.remove("active");
  };
  if (workspaceModalCloseX)
    workspaceModalCloseX.addEventListener("click", closeWorkspaceModal);
  if (workspaceModalCancelBtn)
    workspaceModalCancelBtn.addEventListener("click", closeWorkspaceModal);

  // Auto-slugify workspace name
  workspaceNameInput.addEventListener("input", (e) => {
    const name = e.target.value;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    workspaceSlugInput.value = slug;
  });

  workspaceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    workspaceModalAlert.style.display = "none";

    const name = workspaceNameInput.value.trim();
    const slug = workspaceSlugInput.value.trim();

    if (!name || !slug) {
      workspaceModalAlert.textContent = "Please fill out all fields.";
      workspaceModalAlert.className = "alert alert-danger";
      workspaceModalAlert.style.display = "block";
      return;
    }

    try {
      const res = await apiFetch("/api/auth/workspaces", {
        method: "POST",
        body: { name, slug },
      });

      const body = await res.json();
      if (res.ok && body.success) {
        workspaceModal.classList.remove("active");
        if (body.newWorkspaceId) {
          setActiveTenantId(body.newWorkspaceId);
        }
        initDashboard();
      } else {
        workspaceModalAlert.textContent =
          body.message || "Failed to create workspace.";
        workspaceModalAlert.className = "alert alert-danger";
        workspaceModalAlert.style.display = "block";
      }
    } catch (err) {
      console.error("Workspace create error:", err);
      workspaceModalAlert.textContent = "Network error. Creation aborted.";
      workspaceModalAlert.className = "alert alert-danger";
      workspaceModalAlert.style.display = "block";
    }
  });

  // --- Add Employee Modal (Add by ID) ---
  if (addEmployeeTrigger) {
    addEmployeeTrigger.addEventListener("click", () => {
      employeeForm.reset();
      employeeModalAlert.style.display = "none";
      employeeModal.classList.add("active");
    });
  }

  const closeEmployeeModal = () => {
    employeeModal.classList.remove("active");
  };
  if (employeeModalCloseX)
    employeeModalCloseX.addEventListener("click", closeEmployeeModal);
  if (employeeModalCancelBtn)
    employeeModalCancelBtn.addEventListener("click", closeEmployeeModal);

  employeeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    employeeModalAlert.style.display = "none";

    const userId = employeeUserIdInput.value.trim();
    if (!userId || userId.length !== 24) {
      employeeModalAlert.textContent =
        "Please enter a valid 24-character User ID.";
      employeeModalAlert.className = "alert alert-danger";
      employeeModalAlert.style.display = "block";
      return;
    }

    try {
      const res = await apiFetch("/api/auth/employees", {
        method: "POST",
        body: { userId },
      });

      const body = await res.json();
      if (res.ok && body.success) {
        employeeModal.classList.remove("active");
        fetchUsersDirectory();
        alert(body.message || "Employee added successfully!");
      } else {
        employeeModalAlert.textContent =
          body.message || "Failed to add employee.";
        employeeModalAlert.className = "alert alert-danger";
        employeeModalAlert.style.display = "block";
      }
    } catch (err) {
      console.error("Add employee error:", err);
      employeeModalAlert.textContent = "Network error. Addition aborted.";
      employeeModalAlert.className = "alert alert-danger";
      employeeModalAlert.style.display = "block";
    }
  });

  // --- Add New User Modal (Direct Creation) ---
  if (addUserTrigger) {
    addUserTrigger.addEventListener("click", () => {
      addUserForm.reset();
      addUserModalAlert.style.display = "none";
      addUserModal.classList.add("active");
    });
  }

  const closeAddUserModal = () => {
    addUserModal.classList.remove("active");
  };
  if (addUserModalCloseX)
    addUserModalCloseX.addEventListener("click", closeAddUserModal);
  if (addUserModalCancelBtn)
    addUserModalCancelBtn.addEventListener("click", closeAddUserModal);

  addUserForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    addUserModalAlert.style.display = "none";

    const payload = {
      name: newUserNameInput.value.trim(),
      email: newUserEmailInput.value.trim(),
      password: newUserPasswordInput.value,
      role: newUserRoleSelect.value,
    };

    let isValid = true;
    if (!payload.name) {
      newUserNameInput.classList.add("is-invalid");
      isValid = false;
    }
    if (!payload.email) {
      newUserEmailInput.classList.add("is-invalid");
      isValid = false;
    }
    if (payload.password.length < 6) {
      newUserPasswordInput.classList.add("is-invalid");
      isValid = false;
    }

    if (!isValid) return;

    // ── Frontend Policy: Cannot assign a role equal to or higher than own ──
    if (!canActOn(activeRole, payload.role)) {
      addUserModalAlert.textContent = `You cannot assign the "${payload.role}" role — it equals or exceeds your own authority level.`;
      addUserModalAlert.className = "alert alert-danger";
      addUserModalAlert.style.display = "block";
      return;
    }

    try {
      const res = await apiFetch("/api/user-management/users", {
        method: "POST",
        body: payload,
      });

      const body = await res.json();
      if (res.ok && body.success) {
        addUserModal.classList.remove("active");
        fetchUsersDirectory();
        alert(body.message || "User created successfully!");
      } else {
        addUserModalAlert.textContent =
          body.message || "Failed to create user.";
        addUserModalAlert.className = "alert alert-danger";
        addUserModalAlert.style.display = "block";
      }
    } catch (err) {
      console.error("Add User error:", err);
      addUserModalAlert.textContent = "Network error. Creation aborted.";
      addUserModalAlert.className = "alert alert-danger";
      addUserModalAlert.style.display = "block";
    }
  });

  // --- Assign Role Modal ---
  function openEditRoleModal(userId, currentRole) {
    editRoleForm.reset();
    editRoleUserIdInput.value = userId;
    editRoleSelect.value = currentRole;
    editRoleTargetCurrentRole = currentRole; // track for submit validation
    editRoleModalAlert.style.display = "none";
    editRoleModal.classList.add("active");
  }

  const closeEditRoleModal = () => {
    editRoleModal.classList.remove("active");
  };
  if (editRoleModalCloseX)
    editRoleModalCloseX.addEventListener("click", closeEditRoleModal);
  if (editRoleModalCancelBtn)
    editRoleModalCancelBtn.addEventListener("click", closeEditRoleModal);

  editRoleForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    editRoleModalAlert.style.display = "none";

    const userId = editRoleUserIdInput.value;
    const role = editRoleSelect.value;

    // ── Frontend Policy: Cannot modify a user with equal/higher role ──
    if (editRoleTargetCurrentRole && !canActOn(activeRole, editRoleTargetCurrentRole)) {
      editRoleModalAlert.textContent = `You cannot modify a user with the "${editRoleTargetCurrentRole}" role — it equals or exceeds your authority level.`;
      editRoleModalAlert.className = "alert alert-danger";
      editRoleModalAlert.style.display = "block";
      return;
    }

    // ── Frontend Policy: Cannot assign a role equal to or higher than own ──
    if (!canActOn(activeRole, role)) {
      editRoleModalAlert.textContent = `You cannot assign the "${role}" role — it equals or exceeds your own authority level.`;
      editRoleModalAlert.className = "alert alert-danger";
      editRoleModalAlert.style.display = "block";
      return;
    }

    try {
      const res = await apiFetch(`/api/user-management/users/${userId}/role`, {
        method: "PUT",
        body: { role },
      });

      const body = await res.json();
      if (res.ok && body.success) {
        editRoleModal.classList.remove("active");
        fetchUsersDirectory();
        alert(body.message || "Role updated successfully!");
      } else {
        editRoleModalAlert.textContent =
          body.message || "Failed to update role.";
        editRoleModalAlert.className = "alert alert-danger";
        editRoleModalAlert.style.display = "block";
      }
    } catch (err) {
      console.error("Assign role error:", err);
      editRoleModalAlert.textContent = "Network error. Update aborted.";
      editRoleModalAlert.className = "alert alert-danger";
      editRoleModalAlert.style.display = "block";
    }
  });

  // --- Logout ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await apiFetch("/api/auth/logout", { method: "POST" });
        localStorage.removeItem("accessToken");
        localStorage.removeItem("activeTenantId");
        localStorage.removeItem("user");
        window.location.href = "/login.html";
      } catch (err) {
        console.error("Logout failed:", err);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("activeTenantId");
        localStorage.removeItem("user");
        window.location.href = "/login.html";
      }
    });
  }

  // Clean form input alerts on focus
  document.querySelectorAll(".form-control").forEach((input) => {
    input.addEventListener("focus", () => {
      input.classList.remove("is-invalid");
    });
  });

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});

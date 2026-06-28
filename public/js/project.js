import { apiFetch, getActiveTenantId } from './api.js';

// ─── Guard: must have project ID in URL ───────────────────────────────────────
const projectId = new URLSearchParams(window.location.search).get('id');
if (!projectId) window.location.href = '/index.html';

document.addEventListener('DOMContentLoaded', () => {

  // ─── Role Hierarchy (mirrors backend ROLE_HIERARCHY) ─────────────────────
  const ROLE_RANK = {
    'super admin': 5, admin: 4, 'project manager': 3,
    developer: 2, tester: 2, 'backend developer': 2,
    'frontend developer': 2, 'database administrator': 2,
  };

  /**
   * Returns true if actor has strictly MORE authority than target.
   * Super admin can act on anyone.
   */
  function canActOn(actorRole, targetRole) {
    if (actorRole === 'super admin') return true;
    return (ROLE_RANK[actorRole] || 0) > (ROLE_RANK[targetRole] || 0);
  }

  const isAdmin = (role) => role === 'super admin' || role === 'admin';

  // ─── State ───────────────────────────────────────────────────────────────
  let currentUser    = null;
  let activeRole     = 'developer';
  let currentProject = null;
  let teamLoaded     = false;
  let tasksList      = [];
  let projectMembers = [];

  // ─── DOM ─────────────────────────────────────────────────────────────────
  const topbarName     = document.getElementById('topbar-project-name');
  const topbarBadge    = document.getElementById('topbar-status-badge');
  const projectActions = document.getElementById('project-actions');
  const editProjectBtn = document.getElementById('edit-project-btn');
  const delProjectBtn  = document.getElementById('delete-project-btn');

  const overviewLoader  = document.getElementById('overview-loader');
  const overviewContent = document.getElementById('overview-content');

  const teamLoader    = document.getElementById('team-loader');
  const teamContent   = document.getElementById('team-content');
  const teamNoAccess  = document.getElementById('team-no-access');
  const teamTableBody = document.getElementById('team-table-body');
  const teamCountBadge= document.getElementById('team-count-badge');
  const statTeam      = document.getElementById('stat-team');
  const addMemberBtn  = document.getElementById('add-member-btn');
  const teamActionsHdr= document.getElementById('team-actions-header');

  // Add Member Modal
  const addMemberModal       = document.getElementById('add-member-modal');
  const addMemberModalAlert  = document.getElementById('add-member-modal-alert');
  const addMemberModalCloseX = document.getElementById('add-member-modal-close-x');
  const addMemberModalCancel = document.getElementById('add-member-modal-cancel');
  const addMemberLoader      = document.getElementById('add-member-loader');
  const memberPickList       = document.getElementById('member-pick-list');

  // Edit Project Modal
  const editProjectModal    = document.getElementById('edit-project-modal');
  const editProjectForm     = document.getElementById('edit-project-form');
  const editProjectAlert    = document.getElementById('edit-project-alert');
  const epModalCloseX       = document.getElementById('edit-project-modal-close-x');
  const epCancelBtn         = document.getElementById('ep-cancel-btn');
  const epNameInput         = document.getElementById('ep-name');
  const epDescInput         = document.getElementById('ep-description');
  const epTechInput         = document.getElementById('ep-techstack');
  const epBudgetInput       = document.getElementById('ep-budget');
  const epStatusSelect      = document.getElementById('ep-status');

  // Tasks Tab Elements
  const tasksLoader        = document.getElementById('tasks-loader');
  const tasksContent       = document.getElementById('tasks-content');
  const tasksTableBody     = document.getElementById('tasks-table-body');
  const tasksCountBadge    = document.getElementById('tasks-count-badge');
  const addTaskBtn         = document.getElementById('add-task-btn');
  const filterTaskStatus   = document.getElementById('filter-task-status');
  const filterTaskPriority = document.getElementById('filter-task-priority');

  // Add Task Modal Elements
  const addTaskModal       = document.getElementById('add-task-modal');
  const addTaskForm        = document.getElementById('add-task-form');
  const addTaskAlert       = document.getElementById('add-task-alert');
  const addTaskCloseX      = document.getElementById('add-task-modal-close-x');
  const addTaskCancel      = document.getElementById('add-task-cancel');
  const taskTitle          = document.getElementById('task-title');
  const taskDescription    = document.getElementById('task-description');
  const taskPriority       = document.getElementById('task-priority');
  const taskStatus         = document.getElementById('task-status');
  const taskAssignee       = document.getElementById('task-assignee');
  const taskDueDate        = document.getElementById('task-duedate');

  // Edit Task Modal Elements
  const editTaskModal      = document.getElementById('edit-task-modal');
  const editTaskForm       = document.getElementById('edit-task-form');
  const editTaskAlert      = document.getElementById('edit-task-alert');
  const editTaskCloseX     = document.getElementById('edit-task-modal-close-x');
  const editTaskCancel     = document.getElementById('edit-task-cancel');
  const editTaskId         = document.getElementById('edit-task-id');
  const etTitle            = document.getElementById('et-title');
  const etDescription      = document.getElementById('et-description');
  const etPriority         = document.getElementById('et-priority');
  const etStatus           = document.getElementById('et-status');
  const etAssignee         = document.getElementById('et-assignee');
  const etDueDate          = document.getElementById('et-duedate');

  // ─── Init ─────────────────────────────────────────────────────────────────
  init();

  async function init() {
    try {
      const res = await apiFetch('/api/auth/me');
      if (!res.ok) { window.location.href = '/login.html'; return; }
      const body = await res.json();
      currentUser = body.data;

      const activeId = getActiveTenantId();
      const membership = currentUser.memberships?.find(m => m.tenantId?._id === activeId);
      if (membership) activeRole = membership.role;

      await fetchProject();
      initTabs();
    } catch (err) {
      console.error('Init error:', err);
      window.location.href = '/login.html';
    }
  }

  // ─── Project ──────────────────────────────────────────────────────────────
  async function fetchProject() {
    try {
      const res = await apiFetch(`/api/projects/${projectId}`);
      if (!res.ok) { window.location.href = '/index.html'; return; }
      const body = await res.json();
      currentProject = body.data;
      renderProject();
    } catch (err) {
      console.error('Project fetch error:', err);
      window.location.href = '/index.html';
    }
  }

  function renderProject() {
    const p = currentProject;
    const budget  = `$${Number(p.budget || 0).toLocaleString()}`;
    const created = fmtDate(p.createdAt);
    const updated = fmtDate(p.updatedAt);

    topbarName.textContent = p.name;
    topbarBadge.textContent = p.status;
    topbarBadge.className = `badge ${statusClass(p.status)}`;

    document.getElementById('hero-project-name').textContent = p.name;
    document.getElementById('hero-description').textContent  = p.description;
    document.getElementById('hero-status-pill').textContent  = p.status;
    document.getElementById('hero-budget').textContent       = budget;
    document.getElementById('hero-techstack').textContent    = p.techStack;
    document.getElementById('hero-created').textContent      = created;
    document.getElementById('hero-updated').textContent      = updated;

    document.getElementById('stat-status').textContent = p.status;
    document.getElementById('stat-budget').textContent = budget;
    document.getElementById('stat-tech').textContent   = p.techStack;

    // Edit/Delete: admin, super admin, project manager
    if (['super admin', 'admin', 'project manager'].includes(activeRole)) {
      projectActions.style.display = 'flex';
    }

    document.title = `${p.name} | IT PMS`;
    overviewLoader.style.display = 'none';
    overviewContent.style.display = 'block';
  }

  // ─── Project Team Tab ─────────────────────────────────────────────────────
  // Shows ONLY users explicitly added to this project — not all workspace users.
  // Adding/removing members is restricted to admin/super admin only.

  async function fetchTeam() {
    teamLoader.style.display = 'flex';
    teamContent.style.display = 'none';
    teamNoAccess.style.display = 'none';

    try {
      const res = await apiFetch(`/api/projects/${projectId}/members`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 403) {
          teamLoader.style.display = 'none';
          teamNoAccess.style.display = 'block';
        } else {
          teamLoader.style.display = 'none';
          showTeamError(body.message || 'Failed to load project team.');
        }
        return;
      }
      const body = await res.json();
      renderTeam(body.data);
    } catch (err) {
      console.error('Team fetch error:', err);
      teamLoader.style.display = 'none';
      showTeamError('Network error loading project team.');
    }
  }

  function renderTeam(members) {
    teamLoader.style.display = 'none';
    teamContent.style.display = 'block';

    const count = members.length;
    teamCountBadge.textContent = `${count} Member${count !== 1 ? 's' : ''}`;
    statTeam.textContent = count;

    // Show Add Member button and Actions column only for admins
    if (isAdmin(activeRole)) {
      addMemberBtn.style.display = 'inline-flex';
      teamActionsHdr.style.display = '';
    }

    teamTableBody.innerHTML = '';

    if (count === 0) {
      const colspan = isAdmin(activeRole) ? 6 : 5;
      teamTableBody.innerHTML = `
        <tr>
          <td colspan="${colspan}" class="empty-state">
            <div class="empty-state-icon">👥</div>
            <p>No team members yet.${isAdmin(activeRole) ? ' Click "Add Member" to assign workspace users to this project.' : ''}</p>
          </td>
        </tr>`;
      return;
    }

    members.forEach(member => {
      const tr = document.createElement('tr');
      const isSelf      = member.userId === currentUser._id || member.userId === currentUser.id;
      const actorCanAct = canActOn(activeRole, member.workspaceRole);

      const statusBadge = member.status === 'archived'
        ? '<span class="badge badge-danger">ARCHIVED</span>'
        : '<span class="badge badge-success">ACTIVE</span>';

      // Remove button — only for admins with higher role authority
      let removeBtn = '';
      if (isAdmin(activeRole)) {
        if (isSelf) {
          removeBtn = `<button class="btn btn-secondary" disabled
            title="You cannot remove yourself from the project"
            style="padding:4px 10px;font-size:0.75rem;opacity:0.45;cursor:not-allowed;">Remove</button>`;
        } else if (!actorCanAct) {
          removeBtn = `<span title="Cannot remove a user with equal or higher role"
            style="font-size:0.72rem;color:var(--text-secondary);cursor:help;">🔒 Protected</span>`;
        } else {
          removeBtn = `<button class="btn remove-member-btn"
            data-id="${member.userId}"
            style="padding:4px 10px;font-size:0.75rem;background:var(--danger-color);color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;font-family:inherit;font-weight:600;">
            Remove</button>`;
        }
      }

      tr.innerHTML = `
        <td style="font-weight:500;">
          ${escapeHtml(member.name)}
          ${isSelf ? '<span style="font-size:0.7rem;color:var(--primary-color);margin-left:6px;">(You)</span>' : ''}
        </td>
        <td style="color:var(--text-secondary);font-size:0.9rem;">${escapeHtml(member.email)}</td>
        <td><span class="tech-stack-tag" style="text-transform:capitalize;">${escapeHtml(member.workspaceRole)}</span></td>
        <td>${statusBadge}</td>
        <td style="color:var(--text-secondary);font-size:0.85rem;">${fmtDate(member.addedAt)}</td>
        ${isAdmin(activeRole) ? `<td style="text-align:center;">${removeBtn}</td>` : ''}`;

      teamTableBody.appendChild(tr);
    });

    // Attach remove listeners
    teamTableBody.querySelectorAll('.remove-member-btn').forEach(btn => {
      btn.addEventListener('click', () => removeMember(btn.dataset.id));
    });
  }

  function showTeamError(message) {
    teamContent.style.display = 'block';
    teamTableBody.innerHTML = `
      <tr><td colspan="6" class="empty-state" style="color:var(--danger-color);">
        ⚠️ ${escapeHtml(message)}
      </td></tr>`;
  }

  async function removeMember(userId) {
    if (!confirm('Remove this user from the project team?')) return;
    try {
      const res  = await apiFetch(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
      const body = await res.json();
      if (res.ok) {
        fetchTeam();
        showToast(body.message || 'Member removed successfully.');
      } else {
        alert(body.message || 'Failed to remove member.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  }

  // ─── Add Member Modal ─────────────────────────────────────────────────────
  // Shows workspace users NOT already in this project.

  addMemberBtn.addEventListener('click', () => openAddMemberModal());

  function openAddMemberModal() {
    addMemberModalAlert.style.display = 'none';
    addMemberModalAlert.className = 'alert';
    memberPickList.style.display = 'none';
    addMemberLoader.style.display = 'flex';
    addMemberModal.classList.add('active');
    loadAvailableUsers();
  }

  const closeAddMemberModal = () => addMemberModal.classList.remove('active');
  addMemberModalCloseX.addEventListener('click', closeAddMemberModal);
  addMemberModalCancel.addEventListener('click', closeAddMemberModal);

  async function loadAvailableUsers() {
    try {
      // Fetch all workspace users
      const [wsRes, membersRes] = await Promise.all([
        apiFetch('/api/user-management/users'),
        apiFetch(`/api/projects/${projectId}/members`),
      ]);

      if (!wsRes.ok) {
        addMemberLoader.style.display = 'none';
        showModalAlert(addMemberModalAlert, 'Failed to load workspace users.');
        return;
      }

      const wsBody      = await wsRes.json();
      const membersBody = membersRes.ok ? await membersRes.json() : { data: [] };

      // Build set of already-in-project user IDs
      const inProjectIds = new Set((membersBody.data || []).map(m => m.userId?.toString()));

      // Filter: not in project + not archived + actor can act on them (role hierarchy)
      const available = wsBody.data.filter(u => {
        const uid = u.id?.toString();
        return !inProjectIds.has(uid) && u.status !== 'archived' && canActOn(activeRole, u.role);
      });

      addMemberLoader.style.display = 'none';
      memberPickList.style.display = 'block';
      renderPickList(available);
    } catch (err) {
      addMemberLoader.style.display = 'none';
      showModalAlert(addMemberModalAlert, 'Network error loading users.');
    }
  }

  function renderPickList(users) {
    memberPickList.innerHTML = '';

    if (users.length === 0) {
      memberPickList.innerHTML = `<div class="member-pick-empty">
        All eligible workspace users are already in this project, or there are no users you have authority to add.
      </div>`;
      return;
    }

    users.forEach(user => {
      const item = document.createElement('div');
      item.className = 'member-pick-item';
      item.innerHTML = `
        <div class="member-pick-info">
          <span class="member-pick-name">${escapeHtml(user.name)}</span>
          <span class="member-pick-role">${escapeHtml(user.email)} · <em>${escapeHtml(user.role)}</em></span>
        </div>
        <button class="btn btn-primary add-pick-btn" data-id="${user.id}"
          style="padding:5px 14px;font-size:0.78rem;">+ Add</button>`;
      memberPickList.appendChild(item);
    });

    memberPickList.querySelectorAll('.add-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => addMember(btn.dataset.id, btn));
    });
  }

  async function addMember(userId, btn) {
    // ── Frontend Policy: only admin/super admin can add ──
    if (!isAdmin(activeRole)) {
      showModalAlert(addMemberModalAlert, 'Access denied: Only administrators can add project members.');
      return;
    }

    btn.disabled = true;
    btn.textContent = '…';

    try {
      const res  = await apiFetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        body: { userId },
      });
      const body = await res.json();

      if (res.ok && body.success) {
        btn.textContent = '✓ Added';
        btn.style.background = 'var(--success-color)';
        // Remove item from list after short delay
        setTimeout(() => {
          btn.closest('.member-pick-item')?.remove();
          fetchTeam(); // refresh the team table
          // If list is now empty, show empty state
          if (memberPickList.querySelectorAll('.member-pick-item').length === 0) {
            memberPickList.innerHTML = `<div class="member-pick-empty">All eligible users have been added.</div>`;
          }
        }, 800);
        showToast(body.message || `Member added!`);
      } else {
        btn.disabled = false;
        btn.textContent = '+ Add';
        showModalAlert(addMemberModalAlert, body.message || 'Failed to add member.');
      }
    } catch (err) {
      btn.disabled = false;
      btn.textContent = '+ Add';
      showModalAlert(addMemberModalAlert, 'Network error. Please try again.');
    }
  }

  // ─── Edit Project Modal ───────────────────────────────────────────────────
  editProjectBtn.addEventListener('click', () => {
    if (!currentProject) return;
    epNameInput.value      = currentProject.name;
    epDescInput.value      = currentProject.description;
    epTechInput.value      = currentProject.techStack;
    epBudgetInput.value    = currentProject.budget;
    epStatusSelect.value   = currentProject.status;
    editProjectAlert.style.display = 'none';
    editProjectAlert.className = 'alert';
    editProjectModal.classList.add('active');
  });

  const closeEditProjectModal = () => editProjectModal.classList.remove('active');
  epModalCloseX.addEventListener('click', closeEditProjectModal);
  epCancelBtn.addEventListener('click', closeEditProjectModal);

  editProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    editProjectAlert.style.display = 'none';

    const payload = {
      name:        epNameInput.value.trim(),
      description: epDescInput.value.trim(),
      techStack:   epTechInput.value.trim(),
      budget:      Number(epBudgetInput.value),
      status:      epStatusSelect.value,
    };

    let valid = true;
    if (!payload.name)        { epNameInput.classList.add('is-invalid');   valid = false; }
    if (!payload.description) { epDescInput.classList.add('is-invalid');   valid = false; }
    if (!payload.techStack)   { epTechInput.classList.add('is-invalid');   valid = false; }
    if (isNaN(payload.budget) || payload.budget < 0) { epBudgetInput.classList.add('is-invalid'); valid = false; }
    if (!valid) return;

    // ── Frontend Policy: only admin/super admin/PM can edit project ──
    if (!['super admin', 'admin', 'project manager'].includes(activeRole)) {
      showModalAlert(editProjectAlert, 'Access denied: You do not have permission to edit this project.');
      return;
    }

    try {
      const res  = await apiFetch(`/api/projects/${projectId}`, { method: 'PUT', body: payload });
      const body = await res.json();
      if (res.ok && body.success) {
        currentProject = body.data;
        renderProject();
        closeEditProjectModal();
        showToast('Project updated successfully!');
      } else {
        showModalAlert(editProjectAlert, body.message || 'Update failed.');
      }
    } catch (err) {
      showModalAlert(editProjectAlert, 'Network error.');
    }
  });

  // ─── Delete Project ───────────────────────────────────────────────────────
  delProjectBtn.addEventListener('click', async () => {
    if (!currentProject) return;
    if (!confirm(`Permanently delete "${currentProject.name}"? This cannot be undone.`)) return;

    // ── Frontend Policy ──
    if (!isAdmin(activeRole)) {
      alert('Access denied: Only administrators can delete projects.');
      return;
    }

    try {
      const res = await apiFetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/index.html';
      } else {
        const body = await res.json();
        alert(body.message || 'Delete failed.');
      }
    } catch (err) {
      alert('Network error.');
    }
  });

  // ─── Tab Switching ────────────────────────────────────────────────────────
  function initTabs() {
    document.querySelectorAll('.tab-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${name}"]`)?.classList.add('active');
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${name}`)?.classList.add('active');

    // Lazy-load team on first visit
    if (name === 'team' && !teamLoaded) {
      teamLoaded = true;
      fetchTeam();
    }

    if (name === 'tasks') {
      fetchTasks();
    }
  }

  // ─── Project Tasks Tab ────────────────────────────────────────────────────
  async function fetchTasks() {
    tasksLoader.style.display = 'flex';
    tasksContent.style.display = 'none';

    try {
      const res = await apiFetch(`/api/tasks?projectId=${projectId}`);
      if (!res.ok) {
        tasksLoader.style.display = 'none';
        showToast('Failed to load tasks', true);
        return;
      }
      const body = await res.json();
      tasksList = body.data;
      
      // Also fetch project members if not already loaded to populate dropdowns
      if (projectMembers.length === 0) {
        const memRes = await apiFetch(`/api/projects/${projectId}/members`);
        if (memRes.ok) {
          const memBody = await memRes.json();
          projectMembers = memBody.data;
          populateAssigneeDropdowns();
        }
      }

      renderTasks();
    } catch (err) {
      console.error('Tasks fetch error:', err);
      tasksLoader.style.display = 'none';
      showToast('Network error loading tasks', true);
    }
  }

  function populateAssigneeDropdowns() {
    const optionsHtml = `
      <option value="">Unassigned</option>
      ${projectMembers.map(m => `<option value="${m.userId._id}">${escapeHtml(m.userId.name)} (${escapeHtml(m.userId.role)})</option>`).join('')}
    `;
    taskAssignee.innerHTML = optionsHtml;
    etAssignee.innerHTML = optionsHtml;
  }

  function renderTasks() {
    tasksLoader.style.display = 'none';
    tasksContent.style.display = 'block';

    const statusFilter = filterTaskStatus.value;
    const priorityFilter = filterTaskPriority.value;

    const filtered = tasksList.filter(t => {
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchPriority = !priorityFilter || t.priority === priorityFilter;
      return matchStatus && matchPriority;
    });

    tasksCountBadge.textContent = `${filtered.length} Task${filtered.length !== 1 ? 's' : ''}`;
    tasksTableBody.innerHTML = '';

    if (filtered.length === 0) {
      tasksTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            <div class="empty-state-icon">📋</div>
            <p>No tasks match the selected filters or none have been created.</p>
          </td>
        </tr>`;
      return;
    }

    filtered.forEach(task => {
      const tr = document.createElement('tr');
      
      let priorityClass = 'badge-info';
      if (task.priority === 'Critical') priorityClass = 'badge-danger';
      if (task.priority === 'High') priorityClass = 'badge-warning';
      if (task.priority === 'Medium') priorityClass = 'badge-info';
      if (task.priority === 'Low') priorityClass = 'badge-success';

      const dueDateStr = task.dueDate ? fmtDate(task.dueDate) : '—';
      const assigneeName = task.assignedTo ? task.assignedTo.name : '<em>Unassigned</em>';
      const isLead = ['super admin', 'admin', 'project manager'].includes(activeRole);
      const isAssignee = task.assignedTo && task.assignedTo._id.toString() === currentUser._id.toString();
      const isCreator = task.createdBy && task.createdBy._id.toString() === currentUser._id.toString();
      
      const canEdit = isLead || isAssignee || isCreator;
      const canDelete = isLead;

      let statusSelector = '';
      if (canEdit) {
        statusSelector = `
          <select class="form-control inline-status-select" data-id="${task._id}" style="padding:4px 8px;font-size:0.8rem;height:auto;background:transparent;width:120px;color:var(--text-primary);border:1px solid var(--border-glass);">
            <option value="Todo" ${task.status === 'Todo' ? 'selected' : ''} style="background:var(--background-panel);">Todo</option>
            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''} style="background:var(--background-panel);">In Progress</option>
            <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''} style="background:var(--background-panel);">Completed</option>
            <option value="On Hold" ${task.status === 'On Hold' ? 'selected' : ''} style="background:var(--background-panel);">On Hold</option>
          </select>
        `;
      } else {
        statusSelector = `<span class="badge badge-info">${task.status}</span>`;
      }

      let editBtn = '';
      let deleteBtn = '';

      if (canEdit) {
        editBtn = `<button class="btn btn-secondary edit-task-btn" data-id="${task._id}" style="padding:4px 8px;font-size:0.75rem;margin-right:5px;">Edit</button>`;
      }
      if (canDelete) {
        deleteBtn = `<button class="btn btn-danger delete-task-btn" data-id="${task._id}" style="padding:4px 8px;font-size:0.75rem;background:var(--danger-color);border:none;">Delete</button>`;
      }

      tr.innerHTML = `
        <td>
          <div style="font-weight:600;color:var(--text-primary);">${escapeHtml(task.title)}</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:2px;">${escapeHtml(task.description || 'No description')}</div>
        </td>
        <td>${statusSelector}</td>
        <td><span class="badge ${priorityClass}">${task.priority}</span></td>
        <td style="font-size:0.85rem;color:var(--text-primary);">${escapeHtml(assigneeName)}</td>
        <td style="font-size:0.85rem;color:var(--text-secondary);">${dueDateStr}</td>
        <td style="text-align:center;">
          <div style="display:flex;gap:5px;justify-content:center;align-items:center;">
            ${editBtn}
            ${deleteBtn}
          </div>
        </td>
      `;

      tasksTableBody.appendChild(tr);
    });

    tasksTableBody.querySelectorAll('.inline-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const taskId = e.target.dataset.id;
        const newStatus = e.target.value;
        await updateTaskStatusInline(taskId, newStatus);
      });
    });

    tasksTableBody.querySelectorAll('.edit-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.dataset.id;
        openEditTaskModal(taskId);
      });
    });

    tasksTableBody.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const taskId = btn.dataset.id;
        deleteTask(taskId);
      });
    });
  }

  async function updateTaskStatusInline(taskId, status) {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: { status }
      });
      const body = await res.json();
      if (res.ok && body.success) {
        showToast('Task status updated!');
        const idx = tasksList.findIndex(t => t._id === taskId);
        if (idx !== -1) {
          tasksList[idx].status = status;
        }
      } else {
        showToast(body.message || 'Failed to update status', true);
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      showToast('Network error updating status', true);
      fetchTasks();
    }
  }

  async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      const body = await res.json();
      if (res.ok && body.success) {
        showToast('Task deleted successfully');
        tasksList = tasksList.filter(t => t._id !== taskId);
        renderTasks();
      } else {
        alert(body.message || 'Failed to delete task');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  }

  // --- Add Task Modal Actions ---
  addTaskBtn.addEventListener('click', () => {
    addTaskForm.reset();
    addTaskAlert.style.display = 'none';
    addTaskAlert.className = 'alert';
    addTaskModal.classList.add('active');
  });

  const closeAddTaskModal = () => addTaskModal.classList.remove('active');
  addTaskCloseX.addEventListener('click', closeAddTaskModal);
  addTaskCancel.addEventListener('click', closeAddTaskModal);

  addTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    addTaskAlert.style.display = 'none';

    const payload = {
      title: taskTitle.value.trim(),
      description: taskDescription.value.trim(),
      priority: taskPriority.value,
      status: taskStatus.value,
      projectId: projectId,
      assignedTo: taskAssignee.value || null,
      dueDate: taskDueDate.value ? new Date(taskDueDate.value).toISOString() : null,
    };

    if (!payload.title) {
      taskTitle.classList.add('is-invalid');
      return;
    }

    try {
      const res = await apiFetch('/api/tasks', { method: 'POST', body: payload });
      const body = await res.json();
      if (res.ok && body.success) {
        showToast('Task created successfully!');
        closeAddTaskModal();
        fetchTasks();
      } else {
        showModalAlert(addTaskAlert, body.message || 'Creation failed.');
      }
    } catch (err) {
      showModalAlert(addTaskAlert, 'Network error.');
    }
  });

  // --- Edit Task Modal Actions ---
  function openEditTaskModal(taskId) {
    const task = tasksList.find(t => t._id === taskId);
    if (!task) return;

    editTaskId.value = task._id;
    etTitle.value = task.title;
    etDescription.value = task.description || '';
    etPriority.value = task.priority;
    etStatus.value = task.status;
    etAssignee.value = task.assignedTo ? task.assignedTo._id : '';
    etDueDate.value = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '';

    editTaskAlert.style.display = 'none';
    editTaskAlert.className = 'alert';

    const isLead = ['super admin', 'admin', 'project manager'].includes(activeRole);
    if (!isLead) {
      document.querySelectorAll('#edit-task-modal .class-full-fields').forEach(el => {
        el.style.opacity = '0.6';
        el.style.pointerEvents = 'none';
        const inputs = el.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.disabled = true);
      });
    } else {
      document.querySelectorAll('#edit-task-modal .class-full-fields').forEach(el => {
        el.style.opacity = '';
        el.style.pointerEvents = '';
        const inputs = el.querySelectorAll('input, select, textarea');
        inputs.forEach(input => input.disabled = false);
      });
    }

    editTaskModal.classList.add('active');
  }

  const closeEditTaskModal = () => editTaskModal.classList.remove('active');
  editTaskCloseX.addEventListener('click', closeEditTaskModal);
  editTaskCancel.addEventListener('click', closeEditTaskModal);

  editTaskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    editTaskAlert.style.display = 'none';

    const taskId = editTaskId.value;
    const isLead = ['super admin', 'admin', 'project manager'].includes(activeRole);

    let payload = {};
    if (isLead) {
      payload = {
        title: etTitle.value.trim(),
        description: etDescription.value.trim(),
        priority: etPriority.value,
        status: etStatus.value,
        assignedTo: etAssignee.value || null,
        dueDate: etDueDate.value ? new Date(etDueDate.value).toISOString() : null,
      };
      if (!payload.title) {
        etTitle.classList.add('is-invalid');
        return;
      }
    } else {
      payload = {
        status: etStatus.value
      };
    }

    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, { method: 'PUT', body: payload });
      const body = await res.json();
      if (res.ok && body.success) {
        showToast('Task updated successfully!');
        closeEditTaskModal();
        fetchTasks();
      } else {
        showModalAlert(editTaskAlert, body.message || 'Update failed.');
      }
    } catch (err) {
      showModalAlert(editTaskAlert, 'Network error.');
    }
  });

  filterTaskStatus.addEventListener('change', renderTasks);
  filterTaskPriority.addEventListener('change', renderTasks);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function statusClass(s) {
    const m = { 'Planning':'badge-planning','In Progress':'badge-inprogress','Completed':'badge-completed','On Hold':'badge-onhold' };
    return m[s] || 'badge-info';
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  }

  function showModalAlert(el, message) {
    el.textContent = message;
    el.className = 'alert alert-danger';
    el.style.display = 'block';
  }

  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.style.background = isError ? 'var(--danger-color)' : 'var(--success-color)';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  // Clear invalid on focus
  document.querySelectorAll('.form-control').forEach(i => {
    i.addEventListener('focus', () => i.classList.remove('is-invalid'));
  });
});

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
  }

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

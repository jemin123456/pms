let accessToken = null;
let activeTenantId = null;
let isRefreshing = false;
let refreshQueue = [];

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setActiveTenantId(id) {
  activeTenantId = id;
  if (id) {
    localStorage.setItem('activeTenantId', id);
  } else {
    localStorage.removeItem('activeTenantId');
  }
}

export function getActiveTenantId() {
  if (!activeTenantId) {
    activeTenantId = localStorage.getItem('activeTenantId');
  }
  return activeTenantId;
}

const processQueue = (error, token = null) => {
  refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  refreshQueue = [];
};

/**
 * Custom fetch wrapper that automatically appends Auth token,
 * attaches active Tenant ID workspace headers, handles 401 Unauthorized errors,
 * requests token refreshes in the background, and retries failed requests.
 */
export async function apiFetch(url, options = {}) {
  options.headers = options.headers || {};
  
  if (accessToken) {
    options.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Attach X-Tenant-ID header if available
  const tenantId = getActiveTenantId();
  if (tenantId) {
    options.headers['x-tenant-id'] = tenantId;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  options.credentials = 'include';

  try {
    let response = await fetch(url, options);

    if (response.status === 401 && !url.includes('/api/auth/login') && !url.includes('/api/auth/register') && !url.includes('/api/auth/refresh')) {
      if (isRefreshing) {
        try {
          const newToken = await new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          });
          options.headers['Authorization'] = `Bearer ${newToken}`;
          return await fetch(url, options);
        } catch (err) {
          throw err;
        }
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          accessToken = data.accessToken;
          isRefreshing = false;
          processQueue(null, accessToken);

          options.headers['Authorization'] = `Bearer ${accessToken}`;
          return await fetch(url, options);
        } else {
          isRefreshing = false;
          processQueue(new Error('Session Expired'));
          handleSessionExpired();
          return response;
        }
      } catch (refreshErr) {
        isRefreshing = false;
        processQueue(refreshErr);
        handleSessionExpired();
        throw refreshErr;
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch Error:', error);
    throw error;
  }
}

function handleSessionExpired() {
  accessToken = null;
  activeTenantId = null;
  localStorage.removeItem('activeTenantId');
  if (!window.location.pathname.endsWith('/login.html') && !window.location.pathname.endsWith('/register.html')) {
    window.location.href = '/login.html?expired=true';
  }
}

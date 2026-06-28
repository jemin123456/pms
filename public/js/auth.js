// Client-side Authentication Module
class AuthClient {
  constructor() {
    this.user = null;
    this.accessToken = null;
    this.subscribers = [];
  }

  // Subscribe to auth state updates (for UI rendering)
  onStateChange(callback) {
    this.subscribers.push(callback);
  }

  _notify() {
    this.subscribers.forEach(callback => callback(this.user));
  }

  // Check if session exists on load
  async checkSession() {
    // 1. Try to fetch /me with current access token
    if (this.accessToken) {
      try {
        await this.fetchUser();
        return;
      } catch (err) {
        // Continue to refresh
      }
    }

    // 2. Try to refresh token
    try {
      await this.refresh();
      await this.fetchUser();
    } catch (err) {
      // Clear session if both failed
      this.user = null;
      this.accessToken = null;
      this._notify();
    }
  }

  // Fetch current user details
  async fetchUser() {
    const res = await fetch('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to fetch user');
    }

    this.user = data.data.user;
    this._notify();
    return this.user;
  }

  // Register
  async register(name, email, password, roleName = 'Employee') {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, roleName }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    this.accessToken = data.data.accessToken;
    this.user = data.data.user;
    this._notify();
    return data;
  }

  // Login
  async login(email, password) {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    this.accessToken = data.data.accessToken;
    this.user = data.data.user;
    this._notify();
    return data;
  }

  // Logout
  async logout() {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      this.accessToken = null;
      this.user = null;
      this._notify();
    }
  }

  // Trigger silent refresh
  async refresh() {
    const res = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    this.accessToken = data.data.accessToken;
  }

  // Authorized fetch wrapper
  async fetchWithAuth(url, options = {}) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${this.accessToken}`;

    let response = await fetch(url, options);

    // If access token expired, try to refresh and retry once
    if (response.status === 401) {
      try {
        await this.refresh();
        options.headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, options);
      } catch (err) {
        // Refresh failed, logout
        this.logout();
        throw new Error('Session expired, please log in again.');
      }
    }

    return response;
  }
}

const auth = new AuthClient();
window.auth = auth;

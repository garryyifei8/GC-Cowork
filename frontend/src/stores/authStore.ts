import { create } from 'zustand';

interface UserInfo {
  user_id: string;
  username: string;
  role: string;
  department: string;
  display_name: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  init: () => Promise<void>;
}

const API_BASE = '/api';

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('access_token'),
  user: (() => {
    try {
      const raw = localStorage.getItem('user_info');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })(),
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) throw new Error(`Login failed: ${res.status}`);
      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_info', JSON.stringify(data.user));
      set({ token: data.access_token, user: data.user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    set({ token: null, user: null });
  },

  init: async () => {
    const existing = get().token;
    if (existing) {
      // Validate existing token
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${existing}` },
        });
        if (res.ok) return; // Token still valid
      } catch {
        // Token invalid, fall through to auto-login
      }
    }
    // Auto-login as admin for dev/demo
    try {
      await get().login('admin', 'admin123');
    } catch {
      // Silent fail — backend may not be running
    }
  },
}));

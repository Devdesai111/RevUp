import axios from 'axios';

const BASE = '/api/v1';

const api = axios.create({ baseURL: BASE });

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const login = (email, password) =>
  api.post('/auth/login', { email, password });

// ── Health ───────────────────────────────────────────────────────────────────
export const getHealth = () => api.get('/health');

// ── Admin ────────────────────────────────────────────────────────────────────
export const getAdminMetrics = () => api.get('/admin/metrics');
export const getAdminUsers   = (params) => api.get('/admin/users', { params });
export const calibrateUser   = (userId) => api.post(`/admin/calibrate/${userId}`);

export default api;

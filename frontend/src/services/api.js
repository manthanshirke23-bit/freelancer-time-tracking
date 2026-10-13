import axios from 'axios';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// One Axios instance for the whole app.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// ---- Login state helpers (the JWT and basic user info live in localStorage) ----
export const saveAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const isLoggedIn = () => Boolean(getToken());

// Turns an Axios error into a message that can be shown to the user.
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.request) return 'Cannot reach the server. Check that the backend is running.';
  return fallback;
};

// ---- Interceptors ----

// Attach "Authorization: Bearer <token>" to every request when logged in.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the server says the token is invalid/expired, log the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthForm) {
      clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

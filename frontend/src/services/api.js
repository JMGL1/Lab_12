import axios from 'axios';

/* ── Instancia de Axios con baseURL hacia el backend ── */
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

/* ── Interceptor de REQUEST: adjunta el token JWT automáticamente ── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('learnup_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Interceptor de RESPONSE: manejo global de errores ── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado → limpiar sesión
      localStorage.removeItem('learnup_token');
      localStorage.removeItem('learnup_usuario');
      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

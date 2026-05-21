import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario,    setUsuario]    = useState(null);
  const [token,      setToken]      = useState(null);
  const [cargando,   setCargando]   = useState(true);

  /* ── Inicializar desde localStorage ── */
  useEffect(() => {
    const tokenGuardado   = localStorage.getItem('learnup_token');
    const usuarioGuardado = localStorage.getItem('learnup_usuario');

    if (tokenGuardado && usuarioGuardado) {
      try {
        const u = JSON.parse(usuarioGuardado);
        setToken(tokenGuardado);
        setUsuario(u);
      } catch {
        localStorage.removeItem('learnup_token');
        localStorage.removeItem('learnup_usuario');
      }
    }
    setCargando(false);
  }, []);

  /* ── Login ── */
  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('learnup_token',   data.token);
    localStorage.setItem('learnup_usuario', JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  /* ── Logout ── */
  const logout = useCallback(() => {
    localStorage.removeItem('learnup_token');
    localStorage.removeItem('learnup_usuario');
    setToken(null);
    setUsuario(null);
  }, []);

  /* ── Actualizar datos del usuario localmente ── */
  const actualizarUsuario = useCallback((nuevosDatos) => {
    const actualizado = { ...usuario, ...nuevosDatos };
    localStorage.setItem('learnup_usuario', JSON.stringify(actualizado));
    setUsuario(actualizado);
  }, [usuario]);

  /* ── Computed values ── */
  const autenticado = !!usuario && !!token;
  const esAdmin     = usuario?.rol === 'administrador';
  const esInstructor = usuario?.rol === 'instructor';
  const esEstudiante = usuario?.rol === 'estudiante';

  return (
    <AuthContext.Provider value={{
      usuario,
      token,
      cargando,
      autenticado,
      esAdmin,
      esInstructor,
      esEstudiante,
      login,
      logout,
      actualizarUsuario
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

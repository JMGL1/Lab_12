import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

/* ── Orbes flotantes de fondo ── */
function BackgroundOrbs() {
  return (
    <div className="orbs" aria-hidden="true">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión. Verifica tus credenciales.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <BackgroundOrbs />

      <div className="login-container">
        {/* Panel izquierdo — Branding */}
        <div className="login-brand">
          <div className="brand-logo">L</div>
          <h1 className="brand-title">LearnUp</h1>
          <p className="brand-subtitle">
            Plataforma de talleres y cursos locales en Sucre, Bolivia
          </p>
          <div className="brand-features">
            {[
              { icon: '🎓', text: 'Aprende nuevas habilidades' },
              { icon: '📚', text: 'Encuentra instructores locales' },
              { icon: '🌟', text: 'Cursos presenciales verificados' },
            ].map((f, i) => (
              <div key={i} className="brand-feature">
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
          <div className="brand-roles">
            <p className="brand-roles-title">Acceso para:</p>
            <div className="brand-role-badges">
              <span className="role-pill admin">👑 Administrador</span>
              <span className="role-pill instructor">🏫 Instructor</span>
              <span className="role-pill student">🎒 Estudiante</span>
            </div>
          </div>
        </div>

        {/* Panel derecho — Formulario */}
        <div className="login-form-panel">
          <div className="login-card">
            <div className="login-header">
              <h2 className="login-title">Iniciar sesión</h2>
              <p className="login-description">Ingresa tus credenciales para continuar</p>
            </div>

            {error && (
              <div className="alert alert-error" role="alert">
                <span>⚠</span> {error}
              </div>
            )}

            <form id="login-form" onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Email */}
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">
                  Correo electrónico
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">✉</span>
                  <input
                    id="login-email"
                    type="email"
                    className="form-input with-icon"
                    placeholder="correo@ejemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="form-group">
                <label htmlFor="login-password" className="form-label">
                  Contraseña
                </label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    className="form-input with-icon with-toggle"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowPass(p => !p)}
                    tabIndex={-1}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={loading}
              >
                {loading ? (
                  <><div className="spinner spinner-sm" /> Iniciando sesión...</>
                ) : (
                  'Iniciar sesión →'
                )}
              </button>
            </form>

            <div className="login-footer">
              <p className="text-secondary" style={{fontSize: '13px', textAlign: 'center'}}>
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="login-link">Regístrate gratis</Link>
              </p>
              <div className="login-hint">
                <p>💡 Cuenta demo de administrador:</p>
                <code>admin@learnup.bo / Admin123!</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

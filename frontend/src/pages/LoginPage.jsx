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
          <div className="brand-logo" style={{ background: 'transparent', boxShadow: 'none' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#login_paint0)"/>
              <path d="M2 17L12 22L22 17" stroke="url(#login_paint1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="url(#login_paint2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="login_paint0" x1="2" y1="7" x2="22" y2="7" gradientUnits="userSpaceOnUse"><stop stopColor="#6366f1"/><stop offset="1" stopColor="#a855f7"/></linearGradient>
                <linearGradient id="login_paint1" x1="2" y1="19.5" x2="22" y2="19.5" gradientUnits="userSpaceOnUse"><stop stopColor="#06b6d4"/><stop offset="1" stopColor="#3b82f6"/></linearGradient>
                <linearGradient id="login_paint2" x1="2" y1="14.5" x2="22" y2="14.5" gradientUnits="userSpaceOnUse"><stop stopColor="#ec4899"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="brand-title" style={{ letterSpacing: '-0.04em' }}>LearnUp</h1>
          <p className="brand-subtitle">
            Plataforma educativa local en Sucre, Bolivia
          </p>
          <div className="brand-features">
            {[
              { icon: '🚀', text: 'Aprende nuevas habilidades' },
              { icon: '💡', text: 'Encuentra instructores locales' },
              { icon: '🎓', text: 'Cursos presenciales verificados' },
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

            <div className="login-footer" style={{ marginTop: '20px' }}>
              <p className="text-secondary" style={{fontSize: '13px', textAlign: 'center', marginBottom: '16px'}}>
                ¿Aún no tienes cuenta?{' '}
                <Link to="/register" className="login-link">Regístrate gratis</Link>
              </p>
              <div className="login-hint" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p>💡 Cuenta demo de administrador:</p>
                <code style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--primary-hover)', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: '4px', width: 'fit-content' }}>admin@learnup.bo / Admin123!</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

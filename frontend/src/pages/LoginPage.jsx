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

            <form id="login-form" className="login-form" noValidate>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
                Selecciona tu rol de acceso rápido para la demo:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ justifyContent: 'center', padding: '12px', fontSize: '15px' }}
                  onClick={(e) => { e.preventDefault(); setEmail('admin@learnup.bo'); setPassword('Admin123!'); login('admin@learnup.bo', 'Admin123!').then(()=>navigate('/dashboard')).catch(err=>setError(err.response?.data?.error||'Error')); }}
                  disabled={loading}
                >
                  <span style={{ marginRight: '8px' }}>👑</span> Entrar como Administrador
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ justifyContent: 'center', padding: '12px', fontSize: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onClick={(e) => { e.preventDefault(); setEmail('juan@learnup.bo'); setPassword('Instru123!'); login('juan@learnup.bo', 'Instru123!').then(()=>navigate('/dashboard')).catch(err=>setError(err.response?.data?.error||'Error')); }}
                  disabled={loading}
                >
                  <span style={{ marginRight: '8px' }}>🏫</span> Entrar como Instructor
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ justifyContent: 'center', padding: '12px', fontSize: '15px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                  onClick={(e) => { e.preventDefault(); setEmail('maria@correo.com'); setPassword('Estud123!'); login('maria@correo.com', 'Estud123!').then(()=>navigate('/dashboard')).catch(err=>setError(err.response?.data?.error||'Error')); }}
                  disabled={loading}
                >
                  <span style={{ marginRight: '8px' }}>🎒</span> Entrar como Estudiante
                </button>
              </div>
            </form>

            <div className="login-footer" style={{ marginTop: '32px' }}>
              <p className="text-secondary" style={{fontSize: '13px', textAlign: 'center'}}>
                ¿Aún no tienes cuenta?{' '}
                <Link to="/register" className="login-link">Regístrate gratis</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

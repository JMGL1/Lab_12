import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '', password: '', confirmar: '', rol: 'estudiante'
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const { nombre, apellido, email, telefono, password, confirmar, rol } = form;

    if (!nombre || !apellido || !email || !password) {
      return setError('Nombre, apellido, email y contraseña son obligatorios');
    }
    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }
    if (password !== confirmar) {
      return setError('Las contraseñas no coinciden');
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/register', { nombre, apellido, email, telefono, password, rol });
      // Iniciar sesión automáticamente después del registro
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar la cuenta. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }

  const rolConfig = {
    estudiante: { icon: '🎒', label: 'Estudiante', desc: 'Busca e inscríbete en talleres y cursos' },
    instructor:  { icon: '🏫', label: 'Instructor',  desc: 'Crea y gestiona tus propios talleres' },
  };

  return (
    <div className="login-page" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'32px 16px'}}>
      {/* Orbes de fondo */}
      <div className="orbs" aria-hidden="true">
        <div className="orb orb-1"/><div className="orb orb-2"/><div className="orb orb-3"/>
      </div>

      <div style={{width:'100%',maxWidth:'520px',position:'relative',zIndex:1}}>
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div className="brand-logo" style={{margin:'0 auto 16px',width:'52px',height:'52px',fontSize:'24px'}}>L</div>
          <h1 style={{fontSize:'26px',fontWeight:'800',color:'var(--text-primary)',marginBottom:'6px'}}>
            Crear cuenta
          </h1>
          <p style={{color:'var(--text-secondary)',fontSize:'14px'}}>
            Únete a LearnUp y conecta con la comunidad educativa local
          </p>
        </div>

        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',padding:'32px',backdropFilter:'blur(12px)'}}>

          {error && (
            <div className="alert alert-error" style={{marginBottom:'16px'}}>
              <span>⚠</span> {error}
            </div>
          )}

          {/* Selector de rol */}
          <div style={{marginBottom:'20px'}}>
            <p className="form-label" style={{marginBottom:'10px'}}>¿Cómo quieres usar LearnUp?</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
              {Object.entries(rolConfig).map(([key, cfg]) => (
                <label
                  key={key}
                  htmlFor={`rol-${key}`}
                  style={{
                    display:'flex', flexDirection:'column', gap:'4px', padding:'14px',
                    borderRadius:'var(--r-md)', cursor:'pointer', transition:'var(--t-fast)',
                    border: form.rol === key ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: form.rol === key ? 'var(--primary-light)' : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <input
                    type="radio" id={`rol-${key}`} name="rol" value={key}
                    checked={form.rol === key} onChange={handleChange}
                    style={{display:'none'}}
                  />
                  <span style={{fontSize:'22px'}}>{cfg.icon}</span>
                  <span style={{fontSize:'13px',fontWeight:'700',color:'var(--text-primary)'}}>{cfg.label}</span>
                  <span style={{fontSize:'11px',color:'var(--text-muted)',lineHeight:'1.4'}}>{cfg.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <form id="register-form" onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            {/* Nombre y Apellido */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reg-nombre" className="form-label">Nombre *</label>
                <input id="reg-nombre" name="nombre" type="text" className="form-input"
                  placeholder="Juan" value={form.nombre} onChange={handleChange} required disabled={loading}/>
              </div>
              <div className="form-group">
                <label htmlFor="reg-apellido" className="form-label">Apellido *</label>
                <input id="reg-apellido" name="apellido" type="text" className="form-input"
                  placeholder="Pérez" value={form.apellido} onChange={handleChange} required disabled={loading}/>
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">Correo electrónico *</label>
              <input id="reg-email" name="email" type="email" className="form-input"
                placeholder="correo@ejemplo.com" value={form.email} onChange={handleChange} required disabled={loading}/>
            </div>

            {/* Teléfono (opcional) */}
            <div className="form-group">
              <label htmlFor="reg-telefono" className="form-label">Teléfono <span style={{color:'var(--text-muted)'}}>(opcional)</span></label>
              <input id="reg-telefono" name="telefono" type="tel" className="form-input"
                placeholder="+591 70000000" value={form.telefono} onChange={handleChange} disabled={loading}/>
            </div>

            {/* Contraseña */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reg-password" className="form-label">Contraseña *</label>
                <div className="input-wrapper">
                  <input id="reg-password" name="password" type={showPass ? 'text' : 'password'}
                    className="form-input with-toggle" placeholder="Min. 6 caracteres"
                    value={form.password} onChange={handleChange} required disabled={loading}/>
                  <button type="button" className="input-toggle" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="reg-confirmar" className="form-label">Confirmar *</label>
                <input id="reg-confirmar" name="confirmar" type="password" className="form-input"
                  placeholder="Repetir contraseña" value={form.confirmar} onChange={handleChange} required disabled={loading}/>
              </div>
            </div>

            <button id="register-submit" type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} style={{marginTop:'8px'}}>
              {loading ? (
                <><div className="spinner spinner-sm"/> Creando cuenta...</>
              ) : (
                `Crear cuenta como ${rolConfig[form.rol]?.label} →`
              )}
            </button>
          </form>

          <p style={{textAlign:'center',fontSize:'13px',color:'var(--text-secondary)',marginTop:'20px'}}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{color:'var(--primary)',fontWeight:600}}>Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

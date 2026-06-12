import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import './PerfilPage.css';

function RolBadge({ rol }) {
  const map = {
    administrador: { cls: 'badge-danger',  label: '👑 Administrador', desc: 'Acceso total al sistema' },
    instructor:    { cls: 'badge-warning', label: '🏫 Instructor',    desc: 'Publica y gestiona talleres' },
    estudiante:    { cls: 'badge-info',    label: '🎒 Estudiante',    desc: 'Explora e inscríbete en talleres' },
  };
  const { cls, label, desc } = map[rol] || { cls: 'badge-secondary', label: rol, desc: '' };
  return (
    <div className="perfil-rol-card">
      <span className={`badge ${cls}`} style={{fontSize:'13px',padding:'6px 14px'}}>{label}</span>
      <p className="text-secondary" style={{fontSize:12,marginTop:6}}>{desc}</p>
    </div>
  );
}

function formatFecha(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-BO', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

export default function PerfilPage() {
  const { usuario, actualizarUsuario } = useAuth();

  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', password: '', confirmar: '', biografia: '', foto_perfil: ''
  });
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);
  const [perfil,   setPerfil]   = useState(null);

  // Cargar perfil actualizado desde el servidor
  useEffect(() => {
    api.get('/auth/me').then(r => {
      const u = r.data.usuario;
      setPerfil(u);
      setForm({ nombre: u.nombre, apellido: u.apellido, telefono: u.telefono || '', biografia: u.biografia || '', foto_perfil: u.foto_perfil || '', password: '', confirmar: '' });
    }).catch(() => {
      if (usuario) {
        setPerfil(usuario);
        setForm({ nombre: usuario.nombre, apellido: usuario.apellido, telefono: usuario.telefono || '', biografia: usuario.biografia || '', foto_perfil: usuario.foto_perfil || '', password: '', confirmar: '' });
      }
    });
  }, [usuario]);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, foto_perfil: ev.target.result }));
    reader.readAsDataURL(file);
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error)   setError('');
    if (success) setSuccess('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre || !form.apellido) {
      return setError('Nombre y apellido son obligatorios');
    }
    if (form.password && form.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres');
    }
    if (form.password && form.password !== form.confirmar) {
      return setError('Las contraseñas no coinciden');
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = { nombre: form.nombre.trim(), apellido: form.apellido.trim(), telefono: form.telefono.trim(), biografia: form.biografia.trim() };
      if (form.foto_perfil) payload.foto_perfil = form.foto_perfil;
      if (form.password) payload.password = form.password;

      const { data } = await api.put(`/usuarios/${perfil.id}`, payload);
      actualizarUsuario(data.usuario);
      setPerfil(p => ({ ...p, ...data.usuario }));
      setForm(f => ({ ...f, password: '', confirmar: '' }));
      setSuccess('Perfil actualizado exitosamente ✓');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  }

  if (!perfil) {
    return (
      <Layout>
        <div className="loading-screen" style={{minHeight:'60vh'}}>
          <div className="spinner spinner-lg"/>
          <p className="text-secondary">Cargando perfil...</p>
        </div>
      </Layout>
    );
  }

  const iniciales = `${perfil.nombre?.[0] || ''}${perfil.apellido?.[0] || ''}`.toUpperCase();

  return (
    <Layout>
      <div className="perfil-page">
        {/* Cabecera */}
        <div className="perfil-header">
          <div className="perfil-avatar-wrap">
            {perfil.foto_perfil ? (
              <img src={perfil.foto_perfil} alt="Avatar" style={{width:100, height:100, borderRadius:'50%', objectFit:'cover', border:'4px solid var(--bg-primary)'}} />
            ) : (
              <div className="avatar avatar-xl perfil-avatar">{iniciales}</div>
            )}
          </div>
          <div className="perfil-header-info">
            <h1 className="perfil-nombre">{perfil.nombre} {perfil.apellido}</h1>
            <p className="perfil-email">{perfil.email}</p>
            <RolBadge rol={perfil.rol} />
          </div>
          <div className="perfil-meta">
            <div className="perfil-meta-item">
              <span className="perfil-meta-label">Miembro desde</span>
              <span className="perfil-meta-value">{formatFecha(perfil.creado_en || perfil.created_at)}</span>
            </div>
            <div className="perfil-meta-item">
              <span className="perfil-meta-label">Estado</span>
              <span className={`badge ${perfil.activo ? 'badge-success' : 'badge-danger'}`}>
                {perfil.activo ? '● Activo' : '● Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Formulario de edición */}
        <div className="card perfil-form-card">
          <h2 style={{fontSize:18,fontWeight:700,marginBottom:20}}>Editar información personal</h2>

          {success && <div className="alert alert-success" style={{marginBottom:16}}><span>✓</span> {success}</div>}
          {error   && <div className="alert alert-error"   style={{marginBottom:16}}><span>⚠</span> {error}</div>}

          <form id="perfil-form" onSubmit={handleSubmit}>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Foto de Perfil</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {form.foto_perfil && (
                    <img src={form.foto_perfil} alt="Preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                  )}
                  <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} disabled={loading} style={{ flex: 1, padding: 8 }} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="perfil-nombre" className="form-label">Nombre *</label>
                  <input id="perfil-nombre" name="nombre" type="text" className="form-input"
                    value={form.nombre} onChange={handleChange} required disabled={loading}/>
                </div>
                <div className="form-group">
                  <label htmlFor="perfil-apellido" className="form-label">Apellido *</label>
                  <input id="perfil-apellido" name="apellido" type="text" className="form-input"
                    value={form.apellido} onChange={handleChange} required disabled={loading}/>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input type="email" className="form-input" value={perfil.email} disabled
                  style={{opacity:0.5,cursor:'not-allowed'}}/>
                <p style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>
                  El correo electrónico no se puede cambiar desde aquí
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="perfil-telefono" className="form-label">
                  Teléfono <span style={{color:'var(--text-muted)'}}>(opcional)</span>
                </label>
                <input id="perfil-telefono" name="telefono" type="tel" className="form-input"
                  value={form.telefono} onChange={handleChange} placeholder="+591 70000000" disabled={loading}/>
              </div>

              <div className="form-group">
                <label htmlFor="perfil-biografia" className="form-label">
                  Biografía / Descripción <span style={{color:'var(--text-muted)'}}>(opcional)</span>
                </label>
                <textarea id="perfil-biografia" name="biografia" className="form-input" rows="4"
                  value={form.biografia} onChange={handleChange} placeholder="Cuéntanos un poco sobre ti..." disabled={loading}/>
              </div>

              <hr className="divider"/>

              <h3 style={{fontSize:15,fontWeight:600,color:'var(--text-secondary)'}}>
                Cambiar contraseña <span style={{fontSize:12,fontWeight:400,color:'var(--text-muted)'}}>(opcional)</span>
              </h3>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="perfil-password" className="form-label">Nueva contraseña</label>
                  <div className="input-wrapper">
                    <input id="perfil-password" name="password" type={showPass ? 'text' : 'password'}
                      className="form-input with-toggle" value={form.password}
                      onChange={handleChange} placeholder="Min. 6 caracteres" disabled={loading}/>
                    <button type="button" className="input-toggle" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                      {showPass ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="perfil-confirmar" className="form-label">Confirmar contraseña</label>
                  <input id="perfil-confirmar" name="confirmar" type="password" className="form-input"
                    value={form.confirmar} onChange={handleChange} placeholder="Repetir contraseña" disabled={loading}/>
                </div>
              </div>

              <div style={{display:'flex',justifyContent:'flex-end'}}>
                <button id="save-perfil-btn" type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <><div className="spinner spinner-sm"/> Guardando...</> : '💾 Guardar cambios'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

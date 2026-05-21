import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import './UsuariosPage.css';

/* ── Helpers ── */
function getIniciales(nombre, apellido) {
  return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
}

function RolBadge({ rol }) {
  const map = {
    administrador: { cls: 'badge-danger',  label: 'Admin' },
    instructor:    { cls: 'badge-warning', label: 'Instructor' },
    estudiante:    { cls: 'badge-info',    label: 'Estudiante' },
  };
  const { cls, label } = map[rol] || { cls: 'badge-secondary', label: rol };
  return <span className={`badge ${cls}`}>{label}</span>;
}

function EstadoBadge({ activo }) {
  return activo
    ? <span className="badge badge-success">● Activo</span>
    : <span className="badge badge-danger">● Inactivo</span>;
}

function formatFecha(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ── Modal Crear / Editar Usuario ── */
function ModalUsuario({ usuario, onClose, onGuardar }) {
  const esEditar = !!usuario;
  const [form, setForm] = useState({
    nombre:   usuario?.nombre   || '',
    apellido: usuario?.apellido || '',
    email:    usuario?.email    || '',
    telefono: usuario?.telefono || '',
    rol:      usuario?.rol      || 'estudiante',
    activo:   usuario?.activo !== undefined ? usuario.activo : true,
    password: '',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre || !form.apellido || !form.email) return setError('Nombre, apellido y email son obligatorios');
    if (!esEditar && !form.password) return setError('La contraseña es obligatoria para nuevos usuarios');
    if (form.password && form.password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres');

    setLoading(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (esEditar) {
        const { data } = await api.put(`/usuarios/${usuario.id}`, payload);
        onGuardar(data.usuario, 'actualizado');
      } else {
        const { data } = await api.post('/usuarios', payload);
        onGuardar(data.usuario, 'creado');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el usuario');
    } finally { setLoading(false); }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{esEditar ? '✏️ Editar usuario' : '➕ Nuevo usuario'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="alert alert-error" style={{marginBottom:16}}><span>⚠</span> {error}</div>}
        <form id={esEditar ? 'edit-user-form' : 'create-user-form'} onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input name="nombre" className="form-input" value={form.nombre} onChange={handleChange} placeholder="Juan" required disabled={loading}/>
              </div>
              <div className="form-group">
                <label className="form-label">Apellido *</label>
                <input name="apellido" className="form-input" value={form.apellido} onChange={handleChange} placeholder="Pérez" required disabled={loading}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Correo electrónico *</label>
              <input name="email" type="email" className="form-input" value={form.email} onChange={handleChange} placeholder="correo@ejemplo.com" required disabled={loading}/>
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono <span style={{color:'var(--text-muted)'}}>(opcional)</span></label>
              <input name="telefono" type="tel" className="form-input" value={form.telefono} onChange={handleChange} placeholder="+591 70000000" disabled={loading}/>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Rol *</label>
                <select name="rol" className="form-select" value={form.rol} onChange={handleChange} disabled={loading}>
                  <option value="estudiante">🎒 Estudiante</option>
                  <option value="instructor">🏫 Instructor</option>
                  <option value="administrador">👑 Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <label className="toggle-label" htmlFor="toggle-activo">
                  <input id="toggle-activo" type="checkbox" name="activo" checked={form.activo} onChange={handleChange} disabled={loading}/>
                  <span className="toggle-slider"/>
                  <span style={{fontSize:13, color: form.activo ? 'var(--success)' : 'var(--danger)'}}>
                    {form.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">
                {esEditar ? 'Nueva contraseña' : 'Contraseña *'}{' '}
                {esEditar && <span style={{color:'var(--text-muted)'}}>(dejar vacío para no cambiar)</span>}
              </label>
              <input name="password" type="password" className="form-input" value={form.password} onChange={handleChange} placeholder="Min. 6 caracteres" required={!esEditar} disabled={loading}/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
            <button id={esEditar ? 'save-edit-btn' : 'save-create-btn'} type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner spinner-sm"/> Guardando...</> : esEditar ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal Eliminar ── */
function ModalEliminar({ usuario, onClose, onConfirmar }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleEliminar() {
    setLoading(true); setError('');
    try {
      await api.delete(`/usuarios/${usuario.id}`);
      onConfirmar(usuario.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el usuario');
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-header">
          <h3 className="modal-title">⚠️ Eliminar usuario</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{textAlign:'center',padding:'8px 0'}}>
            <div className="avatar avatar-xl" style={{margin:'0 auto 16px'}}>{getIniciales(usuario.nombre, usuario.apellido)}</div>
            <p style={{fontSize:16,fontWeight:600,color:'var(--text-primary)',marginBottom:6}}>{usuario.nombre} {usuario.apellido}</p>
            <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:16}}>{usuario.email}</p>
            <div className="alert alert-error">
              <span>🗑️</span>
              <span>Esta acción <strong>no se puede deshacer</strong>. El usuario será eliminado permanentemente.</span>
            </div>
          </div>
          {error && <div className="alert alert-error" style={{marginTop:12}}><span>⚠</span> {error}</div>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button id="confirm-delete-btn" className="btn btn-danger" onClick={handleEliminar} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm"/> Eliminando...</> : '🗑️ Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════════════════ */
export default function UsuariosPage() {
  const { usuario: yo } = useAuth();
  const [usuarios,   setUsuarios]   = useState([]);
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [buscar,     setBuscar]     = useState('');
  const [filtroRol,    setFiltroRol]    = useState('todos');
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total,      setTotal]      = useState(0);
  const [modalCrear,    setModalCrear]    = useState(false);
  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [toast,      setToast]      = useState(null);

  function mostrarToast(mensaje, tipo = 'success') {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  const cargarUsuarios = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 10 };
      if (filtroRol    !== 'todos') params.rol    = filtroRol;
      if (filtroActivo !== 'todos') params.activo = filtroActivo;
      if (buscar.trim()) params.buscar = buscar.trim();

      const [rU, rS] = await Promise.all([
        api.get('/usuarios', { params }),
        api.get('/usuarios/stats'),
      ]);
      setUsuarios(rU.data.usuarios);
      setTotal(rU.data.total);
      setTotalPages(rU.data.totalPages || 1);
      setStats(rS.data.stats);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los usuarios');
    } finally { setLoading(false); }
  }, [page, filtroRol, filtroActivo, buscar]);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);
  useEffect(() => { setPage(1); }, [filtroRol, filtroActivo, buscar]);

  function onGuardar(u, accion) {
    setModalCrear(false); setModalEditar(null);
    mostrarToast(`Usuario ${accion} exitosamente ✓`);
    cargarUsuarios();
  }

  function onEliminar(id) {
    setModalEliminar(null);
    mostrarToast('Usuario eliminado exitosamente ✓');
    cargarUsuarios();
  }

  async function handleToggle(u) {
    try {
      const { data } = await api.patch(`/usuarios/${u.id}/toggle`);
      mostrarToast(data.message);
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: data.usuario.activo } : x));
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al cambiar estado', 'error');
    }
  }

  return (
    <Layout>
      {toast && (
        <div className={`toast toast-${toast.tipo}`} role="alert">
          {toast.tipo === 'success' ? '✓' : '⚠'} {toast.mensaje}
        </div>
      )}
      {modalCrear    && <ModalUsuario onClose={() => setModalCrear(false)} onGuardar={onGuardar} />}
      {modalEditar   && <ModalUsuario usuario={modalEditar} onClose={() => setModalEditar(null)} onGuardar={onGuardar} />}
      {modalEliminar && <ModalEliminar usuario={modalEliminar} onClose={() => setModalEliminar(null)} onConfirmar={onEliminar} />}

      <div className="usuarios-page">
        {/* Cabecera */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Gestión de Usuarios</h1>
            <p className="page-subtitle">{total > 0 ? `${total} usuario${total !== 1 ? 's' : ''} en el sistema` : 'Cargando...'}</p>
          </div>
          <button id="open-create-user-btn" className="btn btn-primary" onClick={() => setModalCrear(true)}>
            ＋ Nuevo usuario
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-bar">
            {[
              { label: 'Total',        value: stats.total,        color: 'var(--primary)', icon: '👥' },
              { label: 'Activos',      value: stats.activos,      color: 'var(--success)', icon: '✅' },
              { label: 'Instructores', value: stats.instructores, color: 'var(--warning)', icon: '🏫' },
              { label: 'Estudiantes',  value: stats.estudiantes,  color: 'var(--info)',    icon: '🎒' },
            ].map((s, i) => (
              <div key={i} className="mini-stat">
                <span className="mini-stat-icon">{s.icon}</span>
                <span className="mini-stat-value" style={{color: s.color}}>{s.value}</span>
                <span className="mini-stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Filtros */}
        <div className="filters-bar">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input id="buscar-usuario" type="search" className="form-input search-input"
              placeholder="Buscar por nombre, apellido o email..."
              value={buscar} onChange={e => setBuscar(e.target.value)}/>
          </div>
          <select id="filtro-rol" className="form-select filter-select" value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
            <option value="todos">Todos los roles</option>
            <option value="administrador">👑 Admin</option>
            <option value="instructor">🏫 Instructor</option>
            <option value="estudiante">🎒 Estudiante</option>
          </select>
          <select id="filtro-estado" className="form-select filter-select" value={filtroActivo} onChange={e => setFiltroActivo(e.target.value)}>
            <option value="todos">Todos los estados</option>
            <option value="true">✅ Activos</option>
            <option value="false">🔴 Inactivos</option>
          </select>
          {(buscar || filtroRol !== 'todos' || filtroActivo !== 'todos') && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setBuscar(''); setFiltroRol('todos'); setFiltroActivo('todos'); }}>
              ✕ Limpiar
            </button>
          )}
        </div>

        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

        {/* Tabla */}
        <div className="table-wrapper">
          <table className="table" aria-label="Lista de usuarios">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registrado</th>
                <th style={{textAlign:'right'}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i}>
                    {[1,2,3,4,5,6].map(j => (
                      <td key={j}><div style={{height:20,borderRadius:4,background:'var(--bg-card)',animation:'pulse 1.5s infinite'}}/></td>
                    ))}
                  </tr>
                ))
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign:'center',padding:'48px',color:'var(--text-muted)'}}>
                    <div style={{fontSize:40,marginBottom:12}}>🔍</div>
                    <p style={{fontWeight:600,marginBottom:4}}>No se encontraron usuarios</p>
                    <p style={{fontSize:12}}>Intenta cambiar los filtros de búsqueda</p>
                  </td>
                </tr>
              ) : usuarios.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div className="avatar avatar-sm">{getIniciales(u.nombre, u.apellido)}</div>
                      <div>
                        <p style={{fontWeight:600,color:'var(--text-primary)',fontSize:13}}>{u.nombre} {u.apellido}</p>
                        {u.telefono && <p style={{fontSize:11,color:'var(--text-muted)'}}>{u.telefono}</p>}
                      </div>
                    </div>
                  </td>
                  <td><span style={{fontSize:13,color:'var(--text-secondary)'}}>{u.email}</span></td>
                  <td><RolBadge rol={u.rol}/></td>
                  <td><EstadoBadge activo={u.activo}/></td>
                    <td style={{fontSize:12,color:'var(--text-muted)'}}>{formatFecha(u.creado_en || u.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-ghost btn-icon action-btn" onClick={() => setModalEditar(u)} title="Editar" aria-label={`Editar ${u.nombre}`}>✏️</button>
                      {String(u.id) !== String(yo?.id) && (
                        <>
                          <button className="btn btn-ghost btn-icon action-btn" onClick={() => handleToggle(u)} title={u.activo ? 'Desactivar' : 'Activar'} aria-label={`${u.activo ? 'Desactivar' : 'Activar'} ${u.nombre}`}>
                            {u.activo ? '🔴' : '✅'}
                          </button>
                          <button className="btn btn-ghost btn-icon action-btn action-delete" onClick={() => setModalEliminar(u)} title="Eliminar" aria-label={`Eliminar ${u.nombre}`}>🗑️</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && usuarios.length > 0 && (
            <div className="pagination">
              <span className="pagination-info">Página {page} de {totalPages} · {total} usuarios</span>
              <div className="pagination-btns">
                <button className="page-btn" onClick={() => setPage(1)} disabled={page===1} aria-label="Primera">«</button>
                <button className="page-btn" onClick={() => setPage(p => p-1)} disabled={page===1} aria-label="Anterior">‹</button>
                {Array.from({length: Math.min(totalPages, 5)}).map((_,i) => {
                  const pn = Math.max(1, page-2) + i;
                  if (pn > totalPages) return null;
                  return <button key={pn} className={`page-btn ${pn===page?'active':''}`} onClick={() => setPage(pn)}>{pn}</button>;
                })}
                <button className="page-btn" onClick={() => setPage(p => p+1)} disabled={page===totalPages} aria-label="Siguiente">›</button>
                <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page===totalPages} aria-label="Última">»</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

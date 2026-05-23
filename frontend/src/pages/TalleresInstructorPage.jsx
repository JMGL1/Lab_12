import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import './TalleresInstructorPage.css';

const CATEGORIAS = ['Fotografía','Cocina','Arte','Música','Programación','Marketing','Artesanía','Carpintería','Deporte','Idiomas','Otros'];
const CAT_CONFIG = {
  'Fotografía':  { gradient: 'linear-gradient(135deg,#667eea,#764ba2)', icon: '📸' },
  'Cocina':      { gradient: 'linear-gradient(135deg,#f093fb,#f5576c)', icon: '🍳' },
  'Arte':        { gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)', icon: '🎨' },
  'Música':      { gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)', icon: '🎵' },
  'Programación':{ gradient: 'linear-gradient(135deg,#30cfd0,#667eea)', icon: '💻' },
  'Marketing':   { gradient: 'linear-gradient(135deg,#f7971e,#ffd200)', icon: '📊' },
  'Artesanía':   { gradient: 'linear-gradient(135deg,#f953c6,#b91d73)', icon: '🪡' },
  'Carpintería': { gradient: 'linear-gradient(135deg,#cd9f61,#8B4513)', icon: '🪚' },
  'Deporte':     { gradient: 'linear-gradient(135deg,#11998e,#38ef7d)', icon: '⚽' },
  'Idiomas':     { gradient: 'linear-gradient(135deg,#ee9ca7,#ffdde1)', icon: '🗣️' },
  'Otros':       { gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',  icon: '📚' },
};
function getCfg(cat) { return CAT_CONFIG[cat] || CAT_CONFIG['Otros']; }

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-BO', { day:'numeric', month:'long', year:'numeric' });
}

/* ── Modal Crear/Editar Taller ── */
function ModalTaller({ taller, onClose, onGuardar }) {
  const esEditar = !!taller;
  const hoy = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    titulo:       taller?.titulo       || '',
    descripcion:  taller?.descripcion  || '',
    categoria:    taller?.categoria    || 'Fotografía',
    fecha:        taller?.fecha        || '',
    hora:         taller?.hora         || '',
    duracion:     taller?.duracion     || '',
    precio:       taller?.precio       ?? 0,
    modalidad:    taller?.modalidad    || 'presencial',
    ubicacion:    taller?.ubicacion    || '',
    cupos_totales:taller?.cupos_totales|| 10,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.categoria || !form.fecha) return setError('Título, categoría y fecha son obligatorios');
    setLoading(true); setError('');
    try {
      let data;
      if (esEditar) {
        const res = await api.put(`/talleres/${taller.id}`, form);
        data = res.data;
      } else {
        const res = await api.post('/talleres', form);
        data = res.data;
      }
      onGuardar(data.taller, esEditar ? 'actualizado' : 'creado');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el taller');
    } finally { setLoading(false); }
  }

  const cfg = getCfg(form.categoria);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:560}}>
        {/* Preview del header */}
        <div className="taller-form-preview" style={{background: cfg.gradient}}>
          <span style={{fontSize:32}}>{cfg.icon}</span>
          <div>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:11,textTransform:'uppercase',letterSpacing:'0.06em'}}>Vista previa</p>
            <p style={{color:'#fff',fontWeight:700,fontSize:15}}>{form.titulo || 'Nombre del taller'}</p>
          </div>
        </div>

        <div className="modal-header" style={{borderTop:'1px solid var(--border)'}}>
          <h3 className="modal-title">{esEditar ? '✏️ Editar taller' : '➕ Nuevo taller'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {esEditar && (
          <div className="alert alert-warning" style={{margin:'16px 24px 0', fontSize: 13}}>
            <span>⚠️</span> <strong>Atención:</strong> Cualquier cambio que realices enviará este taller nuevamente a estado <strong>Pendiente</strong> para su revisión.
          </div>
        )}

        {error && <div className="alert alert-error" style={{margin:'16px 24px 0'}}><span>⚠</span> {error}</div>}

        <form id={esEditar ? 'edit-taller-form' : 'create-taller-form'} onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Categoría y Título */}
            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select name="categoria" className="form-select" value={form.categoria} onChange={handleChange} disabled={loading}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{getCfg(c).icon} {c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Título del taller *</label>
              <input name="titulo" className="form-input" value={form.titulo} onChange={handleChange} placeholder="Ej: Taller de Fotografía para Principiantes" required disabled={loading}/>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <textarea name="descripcion" className="form-input" value={form.descripcion} onChange={handleChange}
                placeholder="Describe qué aprenderán los estudiantes, requisitos previos, materiales necesarios..."
                rows={3} disabled={loading} style={{resize:'vertical'}}/>
            </div>

            {/* Fecha, Hora, Duración */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Fecha *</label>
                <input name="fecha" type="date" className="form-input" value={form.fecha} onChange={handleChange} min={hoy} required disabled={loading}/>
              </div>
              <div className="form-group">
                <label className="form-label">Hora</label>
                <input name="hora" type="time" className="form-input" value={form.hora} onChange={handleChange} disabled={loading}/>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duración</label>
                <input name="duracion" className="form-input" value={form.duracion} onChange={handleChange} placeholder="Ej: 3 horas, 2 días" disabled={loading}/>
              </div>
              <div className="form-group">
                <label className="form-label">Modalidad</label>
                <select name="modalidad" className="form-select" value={form.modalidad} onChange={handleChange} disabled={loading}>
                  <option value="presencial">🏢 Presencial</option>
                  <option value="virtual">💻 Virtual</option>
                  <option value="hibrido">🔄 Híbrido</option>
                </select>
              </div>
            </div>

            {/* Precio, Cupos, Ubicación */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Precio (Bs.)</label>
                <input name="precio" type="number" min="0" className="form-input" value={form.precio} onChange={handleChange} placeholder="0 = Gratuito" disabled={loading}/>
              </div>
              <div className="form-group">
                <label className="form-label">Cupos totales</label>
                <input name="cupos_totales" type="number" min="1" max="500" className="form-input" value={form.cupos_totales} onChange={handleChange} disabled={loading}/>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Ubicación</label>
              <input name="ubicacion" className="form-input" value={form.ubicacion} onChange={handleChange} placeholder="Ej: Centro Cultural Sucre, Calle Junín 123" disabled={loading}/>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
            <button id={esEditar ? 'save-edit-taller' : 'save-create-taller'} type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner spinner-sm"/> Guardando...</> : esEditar ? 'Guardar cambios' : '🚀 Publicar taller'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal de inscritos ── */
function ModalInscritos({ tallerId, tallerTitulo, onClose }) {
  const [inscritos, setInscritos] = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get(`/talleres/${tallerId}/inscritos`)
      .then(r => setInscritos(r.data.inscritos || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tallerId]);

  function formatWhatsApp(telefono) {
    if (!telefono) return null;
    const num = telefono.replace(/\D/g, '');
    return `https://wa.me/${num}?text=Hola,%20te%20contacto%20por%20el%20taller%20"${encodeURIComponent(tallerTitulo)}"`;
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:520}}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">👥 Estudiantes inscritos</h3>
            <p style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{tallerTitulo}</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{padding:'0 24px 24px', maxHeight:400, overflowY:'auto'}}>
          {loading ? (
            <div style={{display:'flex',justifyContent:'center',padding:32}}><div className="spinner"/></div>
          ) : inscritos.length === 0 ? (
            <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>
              <div style={{fontSize:36,marginBottom:12}}>👤</div>
              <p style={{fontWeight:600}}>Aún no hay inscritos</p>
              <p style={{fontSize:12,marginTop:4}}>Comparte tu taller para conseguir estudiantes</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:4,fontWeight:600}}>
                {inscritos.length} estudiante{inscritos.length !== 1 ? 's' : ''} inscrito{inscritos.length !== 1 ? 's' : ''}
              </p>
              {inscritos.map((i, idx) => (
                <div key={i.id} className="inscrito-item">
                  <div className="avatar avatar-sm">{i.estudiante?.nombre?.[0]}{i.estudiante?.apellido?.[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontWeight:600,fontSize:13,color:'var(--text-primary)'}}>{i.estudiante?.nombre} {i.estudiante?.apellido}</p>
                    <p style={{fontSize:11,color:'var(--text-muted)'}}>{i.estudiante?.email}</p>
                    {i.estudiante?.telefono && <p style={{fontSize:11,color:'var(--text-secondary)'}}>{i.estudiante.telefono}</p>}
                  </div>
                  {i.estudiante?.telefono && (
                    <a href={formatWhatsApp(i.estudiante.telefono)} target="_blank" rel="noopener noreferrer"
                      className="btn btn-success btn-sm">💬</a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modal Eliminar ── */
function ModalEliminar({ taller, onClose, onConfirmar }) {
  const [loading, setLoading] = useState(false);
  async function handleEliminar() {
    setLoading(true);
    try { await api.delete(`/talleres/${taller.id}`); onConfirmar(taller.id); }
    catch { setLoading(false); }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:400}}>
        <div className="modal-header"><h3 className="modal-title">⚠️ Eliminar taller</h3><button className="modal-close" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div style={{textAlign:'center',padding:'8px 0'}}>
            <div style={{fontSize:48,marginBottom:12}}>{getCfg(taller.categoria).icon}</div>
            <p style={{fontSize:16,fontWeight:700,color:'var(--text-primary)',marginBottom:4}}>{taller.titulo}</p>
            <div className="alert alert-error" style={{marginTop:16}}>
              <span>🗑️</span>
              <span>Se eliminará el taller y todas las inscripciones asociadas. Esta acción <strong>no se puede deshacer</strong>.</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleEliminar} disabled={loading}>
            {loading ? <><div className="spinner spinner-sm"/> Eliminando...</> : '🗑️ Eliminar taller'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   PÁGINA PRINCIPAL — MIS TALLERES (INSTRUCTOR)
════════════════════════════════════════════════════ */
export default function TalleresInstructorPage() {
  const [talleres, setTalleres] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [toast,    setToast]    = useState(null);
  const [modalCrear,    setModalCrear]    = useState(false);
  const [modalEditar,   setModalEditar]   = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalInscritos, setModalInscritos] = useState(null);

  function mostrarToast(msg, tipo = 'success') {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  const cargarTalleres = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/talleres/mis-talleres');
      setTalleres(data.talleres || []);
    } catch { setError('Error al cargar tus talleres'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargarTalleres(); }, [cargarTalleres]);

  function onGuardar(taller, accion) {
    setModalCrear(false); setModalEditar(null);
    mostrarToast(`Taller ${accion} exitosamente ✓`);
    cargarTalleres();
  }

  function onEliminar(id) {
    setModalEliminar(null);
    mostrarToast('Taller eliminado ✓');
    setTalleres(prev => prev.filter(t => t.id !== id));
  }

  // Estadísticas rápidas
  const stats = {
    total:    talleres.length,
    activos:  talleres.filter(t => t.activo).length,
    inscritos: talleres.reduce((sum, t) => sum + (t.cupos_totales - t.cupos_disponibles), 0),
    cupos:    talleres.reduce((sum, t) => sum + t.cupos_disponibles, 0),
  };

  return (
    <Layout>
      {toast && <div className={`toast toast-${toast.tipo}`}>{toast.tipo === 'success' ? '✓' : '⚠'} {toast.msg}</div>}
      {modalCrear    && <ModalTaller onClose={() => setModalCrear(false)} onGuardar={onGuardar} />}
      {modalEditar   && <ModalTaller taller={modalEditar} onClose={() => setModalEditar(null)} onGuardar={onGuardar} />}
      {modalEliminar && <ModalEliminar taller={modalEliminar} onClose={() => setModalEliminar(null)} onConfirmar={onEliminar} />}
      {modalInscritos && <ModalInscritos tallerId={modalInscritos.id} tallerTitulo={modalInscritos.titulo} onClose={() => setModalInscritos(null)} />}

      <div className="instructor-page">
        {/* Cabecera */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Mis Talleres</h1>
            <p className="page-subtitle">Gestiona y publica tus talleres</p>
          </div>
          <button id="open-create-taller-btn" className="btn btn-primary" onClick={() => setModalCrear(true)}>
            🚀 Publicar taller
          </button>
        </div>

        {/* Stats */}
        <div className="instructor-stats">
          {[
            { icon:'📚', label:'Talleres publicados', value: stats.total,    color:'99,102,241' },
            { icon:'✅', label:'Talleres activos',    value: stats.activos,  color:'16,185,129' },
            { icon:'👥', label:'Total inscritos',     value: stats.inscritos, color:'245,158,11' },
            { icon:'💺', label:'Cupos disponibles',   value: stats.cupos,    color:'6,182,212'  },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-icon" style={{background:`rgba(${s.color},0.12)`}}>
                <span>{s.icon}</span>
              </div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

        {/* Grid de mis talleres */}
        {loading ? (
          <div className="instructor-grid">
            {Array.from({length:3}).map((_,i) => <div key={i} className="taller-card-skeleton"><div className="skeleton-header"/><div className="skeleton-body"><div className="skeleton-line short"/><div className="skeleton-line"/><div className="skeleton-line medium"/></div></div>)}
          </div>
        ) : talleres.length === 0 ? (
          <div className="instructor-empty">
            <div className="instructor-empty-icon">📚</div>
            <h3>Aún no has publicado talleres</h3>
            <p>Empieza a compartir tus conocimientos con la comunidad</p>
            <button className="btn btn-primary" onClick={() => setModalCrear(true)} style={{marginTop:16}}>
              🚀 Publicar mi primer taller
            </button>
          </div>
        ) : (
          <div className="instructor-grid">
            {talleres.map(t => {
              const cfg   = getCfg(t.categoria);
              const inscritos = (t.cupos_totales || 0) - (t.cupos_disponibles || 0);
              const pasado = new Date(t.fecha) < new Date();
              return (
                <div key={t.id} className="instructor-taller-card">
                  {/* Header */}
                  <div className="instructor-card-header" style={{background: cfg.gradient}}>
                    <span className="instructor-card-icon">{cfg.icon}</span>
                    <div className="instructor-card-header-info">
                      <span className="instructor-card-cat">{t.categoria}</span>
                      {t.estado_validacion === 'pendiente' && <span className="badge badge-warning" style={{marginLeft:4}}>🟡 Pendiente</span>}
                      {t.estado_validacion === 'rechazado' && <span className="badge badge-danger" style={{marginLeft:4}}>🔴 Rechazado</span>}
                      {t.estado_validacion === 'aprobado'  && <span className="badge badge-success" style={{marginLeft:4}}>🟢 Aprobado</span>}
                      {!t.activo && <span className="badge-inactivo" style={{marginLeft:4}}>Pausado</span>}
                      {pasado   && <span className="badge-pasado" style={{marginLeft:4}}>Finalizado</span>}
                    </div>
                  </div>

                  {/* Cuerpo */}
                  <div className="instructor-card-body">
                    <h3 className="instructor-card-title">{t.titulo}</h3>
                    {t.descripcion && <p className="instructor-card-desc">{t.descripcion.slice(0,120)}...</p>}

                    <div className="instructor-card-meta">
                      <span>📅 {formatFecha(t.fecha)}</span>
                      {t.hora && <span>🕐 {t.hora}</span>}
                      <span>💰 {!t.precio || Number(t.precio) === 0 ? 'Gratuito' : `Bs. ${t.precio}`}</span>
                      {t.ubicacion && <span>📍 {t.ubicacion}</span>}
                    </div>

                    {/* Barra de cupos */}
                    <div className="cupos-bar-wrap">
                      <div className="cupos-bar-header">
                        <span style={{fontSize:12,color:'var(--text-secondary)'}}>Inscritos</span>
                        <span style={{fontSize:12,fontWeight:700,color:'var(--text-primary)'}}>{inscritos} / {t.cupos_totales}</span>
                      </div>
                      <div className="cupos-bar-track">
                        <div className="cupos-bar-fill" style={{
                          width: t.cupos_totales ? `${(inscritos / t.cupos_totales) * 100}%` : '0%',
                          background: t.cupos_disponibles === 0 ? 'var(--danger)' : t.cupos_disponibles <= 3 ? 'var(--warning)' : 'var(--success)',
                        }}/>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="instructor-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => setModalInscritos(t)}>
                      👥 Ver inscritos ({inscritos})
                    </button>
                    <div style={{display:'flex',gap:6}}>
                      <button className="btn btn-ghost btn-icon" onClick={() => setModalEditar(t)} title="Editar">✏️</button>
                      <button className="btn btn-ghost btn-icon" onClick={() => setModalEliminar(t)} title="Eliminar" style={{color:'var(--danger)'}}>🗑️</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

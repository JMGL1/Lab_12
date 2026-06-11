import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../services/api';
import './MisInscripcionesPage.css';

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
  'default':     { gradient: 'linear-gradient(135deg,#6366f1,#8b5cf6)',  icon: '📚' },
};
function getCfg(cat) { return CAT_CONFIG[cat] || CAT_CONFIG.default; }

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-BO', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function formatFechaInscripcion(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-BO', { day:'numeric', month:'short', year:'numeric' });
}

export default function MisInscripcionesPage() {
  const [inscripciones, setInscripciones] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [cancelando,    setCancelando]    = useState(null);
  const [toast,         setToast]         = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);

  function mostrarToast(msg, tipo = 'success') {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  const cargar = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/inscripciones/mis');
      setInscripciones(data.inscripciones || []);
    } catch { setError('Error al cargar tus inscripciones'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleCancelar(tallerId) {
    setCancelando(tallerId);
    try {
      const { data } = await api.delete(`/inscripciones/${tallerId}`);
      mostrarToast(data.message);
      setInscripciones(prev => prev.filter(i => i.taller_id !== tallerId && i.taller?.id !== tallerId));
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al cancelar', 'error');
    } finally { setCancelando(null); setConfirmCancel(null); }
  }

  const hoy = new Date().toISOString().split('T')[0];

  // Función para calificar
  async function calificarTaller(inscripcionId, nota) {
    try {
      const { data } = await api.post(`/inscripciones/${inscripcionId}/calificar`, { calificacion: nota });
      mostrarToast(data.message || 'Calificación enviada');
      setInscripciones(prev => prev.map(i => i.id === inscripcionId ? { ...i, calificacion: nota } : i));
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al calificar', 'error');
    }
  }

  // Separar en próximos y pasados
  const proximos = inscripciones.filter(i => (i.taller?.fecha || '') >= hoy);
  const pasados  = inscripciones.filter(i => (i.taller?.fecha || '') <  hoy);

  return (
    <Layout>
      {toast && <div className={`toast toast-${toast.tipo}`}>{toast.tipo === 'success' ? '✓' : '⚠'} {toast.msg}</div>}

      {/* Modal confirmación de cancelar */}
      {confirmCancel && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirmCancel(null)}>
          <div className="modal" style={{maxWidth:420}}>
            <div className="modal-header"><h3 className="modal-title">¿Cancelar inscripción?</h3><button className="modal-close" onClick={() => setConfirmCancel(null)}>✕</button></div>
            <div className="modal-body">
              <div className="alert alert-warning">
                <span>⚠️</span>
                <span>Se liberará tu cupo en <strong>"{confirmCancel.titulo}"</strong>. Esta acción no se puede deshacer.</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmCancel(null)}>Mantener inscripción</button>
              <button className="btn btn-danger" onClick={() => handleCancelar(confirmCancel.id)} disabled={cancelando === confirmCancel.id}>
                {cancelando === confirmCancel.id ? <><div className="spinner spinner-sm"/> Cancelando...</> : '🗑️ Cancelar inscripción'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="inscripciones-page">
        {/* Cabecera */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Mis Inscripciones</h1>
            <p className="page-subtitle">
              {inscripciones.length > 0
                ? `${inscripciones.length} taller${inscripciones.length !== 1 ? 'es' : ''} en total`
                : 'Tu historial de talleres'
              }
            </p>
          </div>
          <Link to="/explorar" className="btn btn-primary">
            🔍 Explorar más talleres
          </Link>
        </div>

        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

        {loading ? (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {Array.from({length:3}).map((_,i) => (
              <div key={i} className="inscripcion-card-skeleton">
                <div className="skeleton-col" style={{width:100,borderRadius:'var(--r-md)'}}/>
                <div style={{flex:1,padding:'16px',display:'flex',flexDirection:'column',gap:8}}>
                  <div className="skeleton-line short" style={{animation:'pulse 1.5s infinite'}}/>
                  <div className="skeleton-line" style={{animation:'pulse 1.5s infinite'}}/>
                </div>
              </div>
            ))}
          </div>
        ) : inscripciones.length === 0 ? (
          <div className="inscripciones-empty">
            <div style={{fontSize:64,marginBottom:16}}>🎒</div>
            <h3>Aún no estás inscrito en ningún taller</h3>
            <p>Explora el catálogo y encuentra talleres que te interesen</p>
            <Link to="/explorar" className="btn btn-primary" style={{marginTop:20}}>
              🔍 Explorar talleres disponibles
            </Link>
          </div>
        ) : (
          <>
            {/* Próximos talleres */}
            {proximos.length > 0 && (
              <section>
                <h2 className="seccion-titulo">
                  <span className="seccion-dot seccion-dot-green"/>
                  Próximos talleres ({proximos.length})
                </h2>
                <div className="inscripciones-list">
                  {proximos.map(i => {
                    const t = i.taller;
                    if (!t) return null;
                    const cfg = getCfg(t.categoria);
                    const whatsapp = t.instructor?.telefono
                      ? `https://wa.me/${t.instructor.telefono.replace(/\D/g,'')}?text=Hola,%20estoy%20inscrito%20en%20tu%20taller%20"${encodeURIComponent(t.titulo)}"`
                      : null;
                    return (
                      <div key={i.id} className="inscripcion-card">
                        {/* Franja de color */}
                        <div className="inscripcion-franja" style={{background: cfg.gradient}}>
                          <span style={{fontSize:32}}>{cfg.icon}</span>
                        </div>
                        {/* Contenido */}
                        <div className="inscripcion-content">
                          <div className="inscripcion-top">
                            <div>
                              <span className="taller-categoria-tag">{t.categoria}</span>
                              <h3 className="inscripcion-titulo">{t.titulo}</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                              <span className="badge badge-primary" style={{alignSelf:'flex-start',flexShrink:0}}>Próximo</span>
                              {i.estado_solicitud === 'pendiente' && <span className="badge badge-warning" style={{alignSelf:'flex-start',flexShrink:0}}>🟡 Pendiente</span>}
                              {i.estado_solicitud === 'aceptada' && <span className="badge badge-success" style={{alignSelf:'flex-start',flexShrink:0}}>🟢 Aceptada</span>}
                              {i.estado_solicitud === 'rechazada' && <span className="badge badge-danger" style={{alignSelf:'flex-start',flexShrink:0}}>🔴 Rechazada</span>}
                            </div>
                          </div>

                          <div className="inscripcion-meta">
                            <div className="inscripcion-meta-item"><span>📅</span><span>{formatFecha(t.fecha)}</span></div>
                            {t.hora     && <div className="inscripcion-meta-item"><span>🕐</span><span>{t.hora}</span></div>}
                            {t.duracion && <div className="inscripcion-meta-item"><span>⏱</span><span>{t.duracion}</span></div>}
                            {t.ubicacion && <div className="inscripcion-meta-item"><span>📍</span><span>{t.ubicacion}</span></div>}
                            <div className="inscripcion-meta-item"><span>💰</span><span style={{color:'var(--success)',fontWeight:600}}>{!t.precio || Number(t.precio)===0 ? 'Gratuito' : `Bs. ${t.precio}`}</span></div>
                            <div className="inscripcion-meta-item"><span>🗓</span><span style={{color:'var(--text-muted)'}}>Inscrito el {formatFechaInscripcion(i.inscrito_en)}</span></div>
                          </div>

                          {i.estado_solicitud === 'rechazada' && i.motivo_rechazo && (
                            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 6, fontSize: 13, marginBottom: 16 }}>
                              <strong>Motivo del rechazo: </strong> {i.motivo_rechazo}
                            </div>
                          )}

                          {/* Instructor */}
                          <div className="inscripcion-instructor">
                            <div className="avatar avatar-sm">{t.instructor?.nombre?.[0]}{t.instructor?.apellido?.[0]}</div>
                            <div>
                              <p style={{fontSize:13,fontWeight:600,color:'var(--text-primary)'}}>{t.instructor?.nombre} {t.instructor?.apellido}</p>
                              <p style={{fontSize:11,color:'var(--text-muted)'}}>{t.instructor?.email}</p>
                            </div>
                            {whatsapp && (
                              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm" style={{marginLeft:'auto'}}>
                                💬 Contactar
                              </a>
                            )}
                          </div>

                          {/* Estrellas de Calificación */}
                          {i.estado_solicitud === 'aceptada' && (
                            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {i.calificacion ? 'Tu calificación:' : 'Califica este taller:'}
                              </span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => !i.calificacion && calificarTaller(i.id, star)}
                                    style={{
                                      background: 'none', border: 'none', cursor: i.calificacion ? 'default' : 'pointer',
                                      fontSize: '20px', lineHeight: 1, padding: 0,
                                      color: (i.calificacion || 0) >= star ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                                      transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={e => { if (!i.calificacion) e.currentTarget.style.transform = 'scale(1.2)' }}
                                    onMouseLeave={e => { if (!i.calificacion) e.currentTarget.style.transform = 'scale(1)' }}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Botón cancelar */}
                        <button
                          className="inscripcion-cancelar"
                          onClick={() => setConfirmCancel({id: t.id, titulo: t.titulo})}
                          disabled={cancelando === t.id}
                          title="Cancelar inscripción"
                        >✕</button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Talleres pasados */}
            {pasados.length > 0 && (
              <section>
                <h2 className="seccion-titulo" style={{marginTop: proximos.length > 0 ? 16 : 0}}>
                  <span className="seccion-dot seccion-dot-gray"/>
                  Talleres realizados ({pasados.length})
                </h2>
                <div className="inscripciones-list">
                  {pasados.map(i => {
                    const t = i.taller;
                    if (!t) return null;
                    const cfg = getCfg(t.categoria);
                    return (
                      <div key={i.id} className="inscripcion-card inscripcion-pasada">
                        <div className="inscripcion-franja" style={{background: cfg.gradient, opacity:0.6}}>
                          <span style={{fontSize:32}}>{cfg.icon}</span>
                        </div>
                        <div className="inscripcion-content">
                          <div className="inscripcion-top">
                            <div>
                              <span className="taller-categoria-tag">{t.categoria}</span>
                              <h3 className="inscripcion-titulo">{t.titulo}</h3>
                            </div>
                            <span className="badge badge-secondary" style={{alignSelf:'flex-start',flexShrink:0}}>Finalizado</span>
                          </div>
                          <div className="inscripcion-meta">
                            <div className="inscripcion-meta-item"><span>📅</span><span>{formatFecha(t.fecha)}</span></div>
                            {t.ubicacion && <div className="inscripcion-meta-item"><span>📍</span><span>{t.ubicacion}</span></div>}
                          </div>
                          <div className="inscripcion-instructor">
                            <div className="avatar avatar-sm">{t.instructor?.nombre?.[0]}{t.instructor?.apellido?.[0]}</div>
                            <p style={{fontSize:13,color:'var(--text-secondary)'}}>{t.instructor?.nombre} {t.instructor?.apellido}</p>
                          </div>

                          {/* Estrellas de Calificación para talleres pasados */}
                          {i.estado_solicitud === 'aceptada' && (
                            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                {i.calificacion ? 'Tu calificación:' : 'Califica este taller:'}
                              </span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => !i.calificacion && calificarTaller(i.id, star)}
                                    style={{
                                      background: 'none', border: 'none', cursor: i.calificacion ? 'default' : 'pointer',
                                      fontSize: '20px', lineHeight: 1, padding: 0,
                                      color: (i.calificacion || 0) >= star ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                                      transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={e => { if (!i.calificacion) e.currentTarget.style.transform = 'scale(1.2)' }}
                                    onMouseLeave={e => { if (!i.calificacion) e.currentTarget.style.transform = 'scale(1)' }}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

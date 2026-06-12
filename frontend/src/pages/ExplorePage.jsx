import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import './ExplorePage.css';

const CATEGORIAS = ['Todos','Fotografía','Cocina','Arte','Música','Programación','Marketing','Artesanía','Carpintería','Deporte','Idiomas','Otros'];

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

function getCatConfig(cat) { return CAT_CONFIG[cat] || CAT_CONFIG.default; }

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha + 'T12:00:00').toLocaleDateString('es-BO', { weekday:'short', day:'numeric', month:'long' });
}

function formatPrecio(precio) {
  if (!precio || Number(precio) === 0) return 'Gratuito';
  return `Bs. ${Number(precio).toFixed(0)}`;
}

/* ── Componente Custom Dropdown para Ordenamiento ── */
function SortDropdown({ orden, setOrden }) {
  const [isOpen, setIsOpen] = useState(false);
  const options = [
    { value: 'recientes', label: 'Más recientes', icon: '⏱️' },
    { value: 'populares', label: 'Más populares', icon: '🔥' },
    { value: 'mejor_calificados', label: 'Mejor calificados', icon: '⭐' }
  ];

  const current = options.find(o => o.value === orden);

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn btn-secondary btn-sm" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <span>{current?.icon}</span>
        <span>{current?.label}</span>
        <span style={{ fontSize: 10, marginLeft: 4 }}>▼</span>
      </button>

      {isOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setIsOpen(false)} />
          <div style={{ 
            position: 'absolute', top: '100%', right: 0, marginTop: 8, width: 220,
            background: '#13132a', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px', padding: 6, zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99, 102, 241, 0.2)'
          }}>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setOrden(opt.value); setIsOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', background: orden === opt.value ? 'rgba(99,102,241,0.15)' : 'transparent',
                  border: 'none', borderRadius: '8px',
                  color: orden === opt.value ? 'var(--primary-hover)' : 'var(--text-primary)',
                  fontSize: 13, fontWeight: orden === opt.value ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left', transition: '0.2s'
                }}
                onMouseEnter={e => { if(orden !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if(orden !== opt.value) e.currentTarget.style.background = 'transparent' }}
              >
                <span>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Tarjeta de taller ── */
function TallerCard({ taller, onVerDetalle }) {
  const cfg   = getCatConfig(taller.categoria);
  const agotado = taller.cupos_disponibles <= 0;

  return (
    <div className="taller-card" onClick={() => onVerDetalle(taller)}>
      {/* Portada o Header con gradiente */}
      {taller.imagen_portada ? (
        <div className="taller-card-header" style={{ backgroundImage: `url(${taller.imagen_portada})`, backgroundSize: 'cover', backgroundPosition: 'center', height: 120 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
          <span className="taller-card-icon" style={{ zIndex: 2 }}>{cfg.icon}</span>
          <div className="taller-card-badges" style={{ zIndex: 2 }}>
            <span className="taller-precio-badge">
              {formatPrecio(taller.precio)}
            </span>
            {agotado && <span className="taller-agotado-badge">Sin cupos</span>}
          </div>
        </div>
      ) : (
        <div className="taller-card-header" style={{ background: cfg.gradient }}>
          <span className="taller-card-icon">{cfg.icon}</span>
          <div className="taller-card-badges">
            <span className="taller-precio-badge">
              {formatPrecio(taller.precio)}
            </span>
            {agotado && <span className="taller-agotado-badge">Sin cupos</span>}
          </div>
        </div>
      )}

      {/* Cuerpo */}
      <div className="taller-card-body">
        <span className="taller-categoria-tag">{taller.categoria}</span>
        <h3 className="taller-card-title">{taller.titulo}</h3>
        
        {/* Estrellas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8, fontSize: 13 }}>
          <span style={{ color: '#fbbf24' }}>★</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{taller.calificacion_promedio?.toFixed(1) || '5.0'}</span>
          <span style={{ color: 'var(--text-muted)' }}>({taller.num_calificaciones || 0} reviews)</span>
        </div>

        {taller.descripcion && (
          <p className="taller-card-desc">{taller.descripcion.slice(0, 100)}{taller.descripcion.length > 100 ? '...' : ''}</p>
        )}

        <div className="taller-card-meta">
          <div className="taller-meta-item">
            <span>📅</span>
            <span>{formatFecha(taller.fecha)}</span>
          </div>
          {taller.hora && (
            <div className="taller-meta-item">
              <span>🕐</span>
              <span>{taller.hora}</span>
            </div>
          )}
          {taller.ubicacion && (
            <div className="taller-meta-item">
              <span>📍</span>
              <span>{taller.ubicacion}</span>
            </div>
          )}
          {taller.duracion && (
            <div className="taller-meta-item">
              <span>⏱</span>
              <span>{taller.duracion}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="taller-card-footer">
        <div className="taller-instructor">
          {taller.instructor?.foto_perfil ? (
            <img src={taller.instructor.foto_perfil} alt="Instructor" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div className="avatar avatar-sm" style={{background:'var(--gradient-brand)', fontSize:10}}>
              {taller.instructor?.nombre?.[0]}{taller.instructor?.apellido?.[0]}
            </div>
          )}
          <span>{taller.instructor?.nombre} {taller.instructor?.apellido}</span>
        </div>
        <div className="taller-cupos">
          <span className={`cupos-badge ${agotado ? 'cupos-none' : taller.cupos_disponibles <= 3 ? 'cupos-low' : 'cupos-ok'}`}>
            {agotado ? '🔴 Agotado' : `${taller.cupos_disponibles} cupos`}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Modal de detalle + inscripción ── */
function ModalDetalle({ taller, onClose, onInscribirse, inscritoIds }) {
  const { esEstudiante } = useAuth();
  const cfg = getCatConfig(taller.categoria);
  const yaInscrito = inscritoIds.includes(Number(taller.id));
  const agotado = taller.cupos_disponibles <= 0;
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [mensajeSolicitud, setMensajeSolicitud] = useState('');
  const [comprobante, setComprobante] = useState('');

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setComprobante(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function handleInscribirse() {
    setLoading(true); setMsg(''); setIsError(false);
    try {
      const payload = {
        taller_id: taller.id,
        mensaje_solicitud: mensajeSolicitud
      };
      if (comprobante) {
        payload.comprobante_pago = comprobante;
      }

      const { data } = await api.post('/inscripciones', payload);
      setMsg(data.message);
      onInscribirse(taller.id);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Error al inscribirse');
      setIsError(true);
    } finally { setLoading(false); }
  }

  const whatsapp = taller.instructor?.telefono
    ? `https://wa.me/${taller.instructor.telefono.replace(/\D/g,'')}?text=Hola,%20me%20interesa%20el%20taller%20"${encodeURIComponent(taller.titulo)}"`
    : null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal taller-modal" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        {/* Header del modal con portada o gradiente */}
        {taller.imagen_portada ? (
          <div className="taller-modal-header" style={{ backgroundImage: `url(${taller.imagen_portada})`, backgroundSize: 'cover', backgroundPosition: 'center', height: 200, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.2))' }}></div>
            <span className="taller-modal-icon" style={{ zIndex: 2 }}>{cfg.icon}</span>
            <div style={{flex:1, zIndex: 2}}>
              <span className="taller-categoria-tag" style={{background:'rgba(255,255,255,0.2)',color:'#fff',borderColor:'rgba(255,255,255,0.3)'}}>
                {taller.categoria}
              </span>
              <h2 className="taller-modal-title" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{taller.titulo}</h2>
            </div>
            <button className="modal-close" onClick={onClose} style={{color:'rgba(255,255,255,0.8)', zIndex: 2}}>✕</button>
          </div>
        ) : (
          <div className="taller-modal-header" style={{ background: cfg.gradient }}>
            <span className="taller-modal-icon">{cfg.icon}</span>
            <div style={{flex:1}}>
              <span className="taller-categoria-tag" style={{background:'rgba(255,255,255,0.2)',color:'#fff',borderColor:'rgba(255,255,255,0.3)'}}>
                {taller.categoria}
              </span>
              <h2 className="taller-modal-title">{taller.titulo}</h2>
            </div>
            <button className="modal-close" onClick={onClose} style={{color:'rgba(255,255,255,0.8)'}}>✕</button>
          </div>
        )}

        <div className="taller-modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Descripción */}
          {taller.descripcion && (
            <div className="modal-section">
              <h4 className="modal-section-title">📋 Descripción</h4>
              <p style={{color:'var(--text-secondary)',lineHeight:1.7,fontSize:14}}>{taller.descripcion}</p>
            </div>
          )}

          {/* Detalles en grid */}
          <div className="modal-section">
            <h4 className="modal-section-title">📊 Detalles del taller</h4>
            <div className="taller-details-grid">
              <div className="detail-item"><span className="detail-icon">📅</span><div><p className="detail-label">Fecha</p><p className="detail-value">{formatFecha(taller.fecha)}</p></div></div>
              {taller.hora     && <div className="detail-item"><span className="detail-icon">🕐</span><div><p className="detail-label">Hora</p><p className="detail-value">{taller.hora}</p></div></div>}
              {taller.duracion && <div className="detail-item"><span className="detail-icon">⏱</span><div><p className="detail-label">Duración</p><p className="detail-value">{taller.duracion}</p></div></div>}
              <div className="detail-item"><span className="detail-icon">💰</span><div><p className="detail-label">Precio</p><p className="detail-value" style={{color:'var(--success)',fontWeight:700}}>{formatPrecio(taller.precio)}</p></div></div>
              <div className="detail-item"><span className="detail-icon">🖥</span><div><p className="detail-label">Modalidad</p><p className="detail-value" style={{textTransform:'capitalize'}}>{taller.modalidad}</p></div></div>
              <div className="detail-item"><span className="detail-icon">👥</span><div><p className="detail-label">Cupos disponibles</p><p className="detail-value" style={{color: agotado ? 'var(--danger)' : 'var(--success)'}}>{agotado ? 'Agotado' : `${taller.cupos_disponibles} / ${taller.cupos_totales}`}</p></div></div>
              {taller.ubicacion && <div className="detail-item" style={{gridColumn:'1/-1'}}><span className="detail-icon">📍</span><div><p className="detail-label">Ubicación</p><p className="detail-value">{taller.ubicacion}</p></div></div>}
            </div>
          </div>

          {/* Instructor */}
          <div className="modal-section">
            <h4 className="modal-section-title">👤 Acerca del Instructor</h4>
            <div className="instructor-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {taller.instructor?.foto_perfil ? (
                  <img src={taller.instructor.foto_perfil} alt="Instructor" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="avatar avatar-lg" style={{background:'var(--gradient-brand)'}}>
                    {taller.instructor?.nombre?.[0]}{taller.instructor?.apellido?.[0]}
                  </div>
                )}
                <div style={{flex:1}}>
                  <p style={{fontWeight:700,fontSize:16,color:'var(--text-primary)',marginBottom:4}}>
                    {taller.instructor?.nombre} {taller.instructor?.apellido}
                  </p>
                  <p style={{fontSize:13,color:'var(--text-secondary)'}}>{taller.instructor?.email}</p>
                </div>
              </div>
              
              {taller.instructor?.biografia && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {taller.instructor.biografia}
                </div>
              )}

              {whatsapp && (
                <div style={{ marginTop: 8 }}>
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm">
                    💬 Contactar por WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Aviso de pago */}
          <div className="pago-aviso">
            <span>💡</span>
            <p>El pago se coordina directamente con el instructor vía WhatsApp o presencialmente. LearnUp no procesa pagos.</p>
          </div>

          {/* Mensaje de resultado */}
          {msg && (
            <div className={`alert ${isError ? 'alert-error' : 'alert-success'}`}>
              <span>{isError ? '⚠' : '✓'}</span> {msg}
            </div>
          )}

            {/* Botón inscripción y Mensaje de Solicitud */}
            {esEstudiante && (
              <div style={{marginTop:8}}>
                {yaInscrito ? (
                  <div className="alert alert-success"><span>✓</span> Ya enviaste una solicitud para este taller</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Sección de pago opcional/requerido si el taller cobra */}
                    {taller.precio > 0 && (
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
                        <h5 style={{ fontSize: 14, marginBottom: 8 }}>💳 Pago de Inscripción</h5>
                        {taller.metodo_pago === 'efectivo' ? (
                          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Este curso acepta pago en efectivo presencialmente.</p>
                        ) : (
                          <>
                            {taller.qr_imagen && (
                              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                                <p style={{ fontSize: 12, marginBottom: 8 }}>Escanea para pagar (Bs. {taller.precio})</p>
                                <img src={taller.qr_imagen} alt="QR de Pago" style={{ maxWidth: 150, borderRadius: 8 }} />
                              </div>
                            )}
                            <label className="form-label" style={{ fontSize: 13 }}>Subir captura del comprobante (Opcional por ahora):</label>
                            <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} disabled={loading || agotado} style={{ padding: '8px' }} />
                            {comprobante && <img src={comprobante} alt="Preview" style={{ maxHeight: 80, borderRadius: 8, marginTop: 8 }} />}
                          </>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="form-label" style={{ fontSize: 13, marginBottom: 4 }}>
                        Mensaje para el instructor (Opcional):
                    </label>
                    <textarea 
                      className="form-input" 
                      rows="2" 
                      placeholder="Ej: Me gustaría inscribirme porque..."
                      value={mensajeSolicitud}
                      onChange={(e) => setMensajeSolicitud(e.target.value)}
                      disabled={loading || agotado}
                      style={{ resize: 'none' }}
                    />
                  </div>
                  <button className="btn btn-primary btn-full btn-lg" onClick={handleInscribirse} disabled={loading || agotado}>
                    {loading ? <><div className="spinner spinner-sm"/> Enviando solicitud...</> : agotado ? '🔴 Sin cupos disponibles' : '🎒 Solicitar inscripción'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   PÁGINA EXPLORAR TALLERES
════════════════════════════════════════════════════ */
export default function ExplorePage() {
  const { esEstudiante } = useAuth();
  const [talleres,    setTalleres]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [buscar,      setBuscar]      = useState('');
  const [categoria,   setCategoria]   = useState('Todos');
  const [orden,       setOrden]       = useState('recientes');
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [tallerSeleccionado, setTallerSeleccionado] = useState(null);
  const [inscritoIds, setInscritoIds] = useState([]);

  const cargarTalleres = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { page, limit: 9, orden };
      if (categoria !== 'Todos') params.categoria = categoria;
      if (buscar.trim()) params.buscar = buscar.trim();
      const { data } = await api.get('/talleres', { params });
      setTalleres(data.talleres || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch { setError('Error al cargar los talleres'); }
    finally { setLoading(false); }
  }, [page, categoria, buscar, orden]);

  useEffect(() => { cargarTalleres(); }, [cargarTalleres]);
  useEffect(() => { setPage(1); }, [categoria, buscar]);

  // Cargar mis inscripciones si es estudiante
  useEffect(() => {
    if (!esEstudiante) return;
    api.get('/inscripciones/mis').then(r => {
      setInscritoIds((r.data.inscripciones || []).map(i => Number(i.taller_id)));
    }).catch(() => {});
  }, [esEstudiante]);

  function onInscribirse(tallerId) {
    setInscritoIds(prev => [...prev, Number(tallerId)]);
    setTalleres(prev => prev.map(t =>
      t.id === tallerId ? { ...t, cupos_disponibles: t.cupos_disponibles - 1 } : t
    ));
  }

  return (
    <Layout>
      {tallerSeleccionado && (
        <ModalDetalle
          taller={tallerSeleccionado}
          onClose={() => setTallerSeleccionado(null)}
          onInscribirse={onInscribirse}
          inscritoIds={inscritoIds}
        />
      )}

      <div className="explore-page">
        {/* Hero */}
        <div className="explore-hero">
          <div className="explore-hero-content">
            <div className="explore-hero-badge">📍 Sucre, Bolivia</div>
            <h1 className="explore-hero-title">
              Descubre talleres<br/>
              <span className="gradient-text-explore">cerca de ti</span>
            </h1>
            <p className="explore-hero-sub">
              Encuentra instructores locales y aprende nuevas habilidades en tu comunidad
            </p>
            {/* Search */}
            <div className="explore-search">
              <span className="explore-search-icon">🔍</span>
              <input
                type="search"
                className="form-input explore-search-input"
                placeholder="Buscar talleres de fotografía, cocina, música..."
                value={buscar}
                onChange={e => setBuscar(e.target.value)}
              />
            </div>
          </div>
          <div className="explore-hero-deco" aria-hidden="true">
            <div className="hero-orb hero-orb-1"/>
            <div className="hero-orb hero-orb-2"/>
          </div>
        </div>

        {/* Filtros de categoría */}
        <div className="categoria-pills">
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              className={`categoria-pill ${categoria === cat ? 'active' : ''}`}
              onClick={() => setCategoria(cat)}
            >
              {cat !== 'Todos' && <span>{getCatConfig(cat).icon}</span>}
              {cat}
            </button>
          ))}
        </div>

        {/* Contador y estado */}
        <div className="explore-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <p className="explore-count" style={{ margin: 0 }}>
              {loading ? 'Buscando talleres...' : `${total} taller${total !== 1 ? 'es' : ''} disponible${total !== 1 ? 's' : ''}`}
              {categoria !== 'Todos' && ` en ${categoria}`}
            </p>
            {(buscar || categoria !== 'Todos') && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setBuscar(''); setCategoria('Todos'); }}>
                ✕ Limpiar filtros
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Ordenar por:</span>
            <SortDropdown orden={orden} setOrden={setOrden} />
          </div>
        </div>

        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

        {/* Grid de talleres */}
        {loading ? (
          <div className="talleres-grid">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="taller-card-skeleton">
                <div className="skeleton-header"/>
                <div className="skeleton-body">
                  <div className="skeleton-line short"/>
                  <div className="skeleton-line"/>
                  <div className="skeleton-line medium"/>
                </div>
              </div>
            ))}
          </div>
        ) : talleres.length === 0 ? (
          <div className="explore-empty">
            <div className="explore-empty-icon">🔍</div>
            <h3>No hay talleres disponibles</h3>
            <p>Prueba con otra categoría o amplía tu búsqueda</p>
            {esEstudiante && (
              <p style={{fontSize:13,color:'var(--text-muted)',marginTop:8}}>
                Los instructores irán publicando nuevos talleres próximamente
              </p>
            )}
          </div>
        ) : (
          <div className="talleres-grid">
            {talleres.map(t => (
              <TallerCard key={t.id} taller={t} onVerDetalle={setTallerSeleccionado} />
            ))}
          </div>
        )}

        {/* Paginación */}
        {!loading && totalPages > 1 && (
          <div className="pagination">
            <span className="pagination-info">Página {page} de {totalPages}</span>
            <div className="pagination-btns">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({length: totalPages}).map((_, i) => (
                <button key={i+1} className={`page-btn ${page === i+1 ? 'active' : ''}`} onClick={() => setPage(i+1)}>{i+1}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

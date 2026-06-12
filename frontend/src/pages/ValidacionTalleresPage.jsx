import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import './ValidacionTalleresPage.css';

export default function ValidacionTalleresPage() {
  const [talleres, setTalleres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Modales
  const [tallerDetalle, setTallerDetalle] = useState(null);
  const [tallerRechazar, setTallerRechazar] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const cargarPendientes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/talleres/pendientes');
      setTalleres(data.talleres || []);
    } catch (err) {
      setError('Error al cargar talleres pendientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPendientes();
  }, [cargarPendientes]);

  function mostrarToast(msg, tipo = 'success') {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleAprobar(id) {
    try {
      await api.patch(`/talleres/${id}/validacion`, { estado_validacion: 'aprobado' });
      mostrarToast(`Taller aprobado exitosamente`);
      setTalleres(prev => prev.filter(t => t.id !== id));
      setTallerDetalle(null);
    } catch (err) {
      mostrarToast(`Error al aprobar el taller`, 'error');
    }
  }

  async function handleRechazarSubmit(e) {
    e.preventDefault();
    if (!motivoRechazo.trim()) return;
    
    try {
      await api.patch(`/talleres/${tallerRechazar.id}/validacion`, { 
        estado_validacion: 'rechazado',
        motivo_rechazo: motivoRechazo.trim()
      });
      mostrarToast(`Taller rechazado con motivo`);
      setTalleres(prev => prev.filter(t => t.id !== tallerRechazar.id));
      setTallerRechazar(null);
      setTallerDetalle(null);
      setMotivoRechazo('');
    } catch (err) {
      mostrarToast(`Error al rechazar el taller`, 'error');
    }
  }

  return (
    <Layout>
      {toast && <div className={`toast toast-${toast.tipo}`}>
        {toast.tipo === 'success' ? '✓' : '⚠'} {toast.msg}
      </div>}

      <div className="validacion-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">Validación de Talleres</h1>
            <p className="page-subtitle">Revisa y aprueba los talleres pendientes (Administrador)</p>
          </div>
        </div>

        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

        {loading ? (
          <div className="validacion-grid">
            <div className="spinner" style={{margin:'40px auto'}} />
          </div>
        ) : talleres.length === 0 ? (
          <div className="validacion-empty">
            <div className="validacion-empty-icon">✅</div>
            <h3>¡Todo al día!</h3>
            <p>No hay talleres pendientes de validación en este momento.</p>
          </div>
        ) : (
          <div className="validacion-grid">
            {talleres.map(t => (
              <div key={t.id} className="validacion-card">
                <div className="validacion-card-header">
                  <span className="cat-badge">{t.categoria}</span>
                  <span className="date-badge">📅 {t.fecha}</span>
                </div>
                <div className="validacion-card-body">
                  <h3>{t.titulo}</h3>
                  <p className="instructor-info">👤 <strong>Instructor:</strong> {t.instructor?.nombre} {t.instructor?.apellido}</p>
                  <p className="desc-text">{t.descripcion?.substring(0, 80)}{t.descripcion?.length > 80 ? '...' : ''}</p>
                </div>
                <div className="validacion-card-actions">
                  <button className="btn btn-outline" style={{flex: 1}} onClick={() => setTallerDetalle(t)}>
                    👁️ Ver Detalles
                  </button>
                  <button className="btn btn-success" onClick={() => handleAprobar(t.id)}>
                    ✅ Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Detalles */}
      {tallerDetalle && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxWidth: '600px'}}>
            <div className="modal-header">
              <h3 className="modal-title">📄 Detalles del Taller</h3>
              <button className="modal-close" onClick={() => setTallerDetalle(null)}>✕</button>
            </div>
            <div className="modal-body" style={{padding: '24px'}}>
              <h2 style={{marginTop: 0}}>{tallerDetalle.titulo}</h2>
              <p style={{color: 'var(--text-secondary)'}}>{tallerDetalle.descripcion}</p>
              
              <div className="detalle-grid">
                <div className="detalle-item">
                  <span>Instructor</span>
                  <strong>{tallerDetalle.instructor?.nombre} {tallerDetalle.instructor?.apellido}</strong>
                </div>
                <div className="detalle-item">
                  <span>Categoría</span>
                  <strong>{tallerDetalle.categoria}</strong>
                </div>
                <div className="detalle-item">
                  <span>Fecha y Hora</span>
                  <strong>{tallerDetalle.fecha} {tallerDetalle.hora ? `- ${tallerDetalle.hora}` : ''}</strong>
                </div>
                <div className="detalle-item">
                  <span>Modalidad</span>
                  <strong style={{textTransform:'capitalize'}}>{tallerDetalle.modalidad}</strong>
                </div>
                <div className="detalle-item">
                  <span>Precio</span>
                  <strong>{tallerDetalle.precio > 0 ? `Bs. ${tallerDetalle.precio}` : 'Gratis'}</strong>
                </div>
                <div className="detalle-item">
                  <span>Cupos Totales</span>
                  <strong>{tallerDetalle.cupos_totales} lugares</strong>
                </div>
              </div>

              {/* Perfil del Instructor para Validar */}
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-secondary)' }}>👤 Perfil del Instructor</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {tallerDetalle.instructor?.foto_perfil ? (
                    <img src={tallerDetalle.instructor.foto_perfil} alt="Instructor" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div className="avatar avatar-lg" style={{background:'var(--gradient-brand)'}}>
                      {tallerDetalle.instructor?.nombre?.[0]}{tallerDetalle.instructor?.apellido?.[0]}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                      {tallerDetalle.instructor?.nombre} {tallerDetalle.instructor?.apellido}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>✉️ {tallerDetalle.instructor?.email}</p>
                    {tallerDetalle.instructor?.telefono && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>📞 {tallerDetalle.instructor.telefono}</p>
                    )}
                  </div>
                </div>
                {tallerDetalle.instructor?.biografia && (
                  <div style={{ marginTop: '16px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px' }}>
                    <strong>Biografía:</strong> <br/>
                    {tallerDetalle.instructor.biografia}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions" style={{display: 'flex', gap: '16px', padding: '16px 24px', background: 'var(--bg-alt)'}}>
              <button className="btn btn-danger" style={{flex: 1}} onClick={() => setTallerRechazar(tallerDetalle)}>
                ❌ Rechazar Taller
              </button>
              <button className="btn btn-success" style={{flex: 1}} onClick={() => handleAprobar(tallerDetalle.id)}>
                ✅ Aprobar Taller
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazo */}
      {tallerRechazar && (
        <div className="modal-overlay" style={{zIndex: 2000}}>
          <div className="modal-content" style={{maxWidth: '450px'}}>
            <div className="modal-header">
              <h3 className="modal-title" style={{color: '#ef4444'}}>❌ Rechazar Taller</h3>
              <button className="modal-close" onClick={() => { setTallerRechazar(null); setMotivoRechazo(''); }}>✕</button>
            </div>
            <form onSubmit={handleRechazarSubmit}>
              <div className="modal-body" style={{padding: '24px'}}>
                <p style={{marginBottom: '16px', color: 'var(--text-secondary)'}}>
                  Por favor ingresa el motivo del rechazo para que el instructor pueda corregirlo:
                </p>
                <div className="form-group">
                  <textarea 
                    className="form-control" 
                    rows="4"
                    placeholder="Ej. La descripción es muy corta, faltan detalles del contenido..."
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    required
                    autoFocus
                  ></textarea>
                </div>
              </div>
              <div className="modal-actions" style={{display: 'flex', gap: '16px', padding: '16px 24px', background: 'var(--bg-alt)'}}>
                <button type="button" className="btn btn-outline" style={{flex: 1}} onClick={() => { setTallerRechazar(null); setMotivoRechazo(''); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger" style={{flex: 1}}>
                  Confirmar Rechazo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

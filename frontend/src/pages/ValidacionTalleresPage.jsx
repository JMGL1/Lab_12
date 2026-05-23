import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import './ValidacionTalleresPage.css';

export default function ValidacionTalleresPage() {
  const [talleres, setTalleres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

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

  async function handleValidacion(id, estado) {
    try {
      await api.patch(`/talleres/${id}/validacion`, { estado_validacion: estado });
      mostrarToast(`Taller ${estado} exitosamente`);
      setTalleres(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      mostrarToast(`Error al cambiar el estado`, 'error');
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
                  <p className="desc-text">{t.descripcion}</p>
                  
                  <div className="meta-info">
                    <span><strong>Precio:</strong> {t.precio > 0 ? `Bs. ${t.precio}` : 'Gratis'}</span>
                    <span><strong>Modalidad:</strong> {t.modalidad}</span>
                  </div>
                </div>
                <div className="validacion-card-actions">
                  <button className="btn btn-danger" onClick={() => handleValidacion(t.id, 'rechazado')}>
                    ❌ Rechazar
                  </button>
                  <button className="btn btn-success" onClick={() => handleValidacion(t.id, 'aprobado')}>
                    ✅ Aprobar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

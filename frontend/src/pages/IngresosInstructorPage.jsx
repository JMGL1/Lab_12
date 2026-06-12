import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

export default function IngresosInstructorPage() {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarIngresos = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/inscripciones/ingresos');
      setIngresos(data.ingresos || []);
    } catch { 
      setError('Error al cargar tus ingresos'); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { cargarIngresos(); }, [cargarIngresos]);

  const totalIngresos = ingresos.reduce((sum, i) => sum + (Number(i.taller?.precio) || 0), 0);

  return (
    <Layout>
      <div className="instructor-page">
        <div className="page-header">
          <div>
            <h1 className="page-title">💰 Mis Ingresos</h1>
            <p className="page-subtitle">Estudiantes que han pagado por tus talleres</p>
          </div>
        </div>

        <div className="instructor-stats">
          <div className="stat-card" style={{ flex: 1, minWidth: 250 }}>
            <div className="stat-icon" style={{background:`rgba(16,185,129,0.12)`}}>
              <span>💰</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">Bs. {totalIngresos.toFixed(2)}</div>
              <div className="stat-label">Total Recaudado</div>
            </div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 250 }}>
            <div className="stat-icon" style={{background:`rgba(99,102,241,0.12)`}}>
              <span>👥</span>
            </div>
            <div className="stat-info">
              <div className="stat-value">{ingresos.length}</div>
              <div className="stat-label">Pagos verificados</div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error"><span>⚠</span> {error}</div>}

        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)', marginTop: 24 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}><div className="spinner"/></div>
          ) : ingresos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💸</div>
              <p style={{ fontWeight: 600 }}>Aún no tienes ingresos registrados</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Cuando aceptes los pagos de tus estudiantes, aparecerán aquí.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Estudiante</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Taller</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Fecha de Pago</th>
                    <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {ingresos.map(i => (
                    <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div className="avatar avatar-sm">{i.estudiante?.nombre?.[0]}{i.estudiante?.apellido?.[0]}</div>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{i.estudiante?.nombre} {i.estudiante?.apellido}</p>
                            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{i.estudiante?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>{i.taller?.titulo}</p>
                      </td>
                      <td style={{ padding: '16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                        {new Date(i.inscrito_en).toLocaleDateString('es-BO')}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className="badge badge-success">Bs. {i.taller?.precio}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

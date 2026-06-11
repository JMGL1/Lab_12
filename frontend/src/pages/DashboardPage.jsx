import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../services/api';
import './DashboardPage.css';

/* ── Saludo según la hora del día ── */
function getSaludo() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `rgba(${color}, 0.12)` }}>
        <span style={{fontSize:'22px'}}>{icon}</span>
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

/* ── Vista admin ── */
function AdminDashboard({ usuario }) {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/usuarios/stats')
      .then(r => setStats(r.data.stats))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-admin">
      <div className="dashboard-welcome">
        <div>
          <h1 className="dashboard-title">
            {getSaludo()}, <span className="gradient-text">{usuario.nombre}</span> 👋
          </h1>
          <p className="dashboard-subtitle">
            Panel Principal de Administración — LearnUp
          </p>
        </div>
        <span className="badge badge-danger" style={{fontSize:'13px', padding:'6px 14px'}}>
          👑 Administrador
        </span>
      </div>

      {/* Estadísticas */}
      <section>
        <h2 className="section-title">Resumen del sistema</h2>
        {loading ? (
          <div style={{display:'flex',gap:'16px'}}>
            {[1,2,3,4].map(i => (
              <div key={i} className="stat-card" style={{flex:1,animation:'pulse 1.5s infinite'}}>
                <div style={{width:48,height:48,borderRadius:'var(--r-md)',background:'var(--bg-card)'}}/>
                <div style={{flex:1}}>
                  <div style={{width:60,height:28,borderRadius:4,background:'var(--bg-card)',marginBottom:8}}/>
                  <div style={{width:80,height:12,borderRadius:4,background:'var(--bg-card)'}}/>
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="stats-grid">
            <StatCard icon="👥" label="Total usuarios" value={stats.total}           color="99,102,241" />
            <StatCard icon="✅" label="Activos"         value={stats.activos}         color="16,185,129" />
            <StatCard icon="🏫" label="Instructores"    value={stats.instructores}    color="245,158,11" />
            <StatCard icon="🎒" label="Estudiantes"     value={stats.estudiantes}     color="6,182,212"  />
          </div>
        ) : (
          <div className="alert alert-error">No se pudieron cargar las estadísticas</div>
        )}
      </section>

      {/* Accesos rápidos */}
      <section>
        <h2 className="section-title">Acciones rápidas</h2>
        <div className="quick-actions">
          <Link to="/usuarios" className="quick-action-card">
            <span className="quick-action-icon" style={{color: '#8b5cf6'}}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </span>
            <div>
              <p className="quick-action-title">Gestionar Usuarios</p>
              <p className="quick-action-desc">CRUD completo de usuarios del sistema</p>
            </div>
            <span className="quick-action-arrow">→</span>
          </Link>
          <Link to="/perfil" className="quick-action-card">
            <span className="quick-action-icon" style={{color: '#06b6d4'}}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </span>
            <div>
              <p className="quick-action-title">Mi Perfil</p>
              <p className="quick-action-desc">Edita tu información personal</p>
            </div>
            <span className="quick-action-arrow">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

/* ── Vista instructor ── */
function InstructorDashboard({ usuario }) {
  const [talleres, setTalleres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/talleres/instructor')
      .then(r => setTalleres(r.data.talleres))
      .catch(() => setTalleres([]))
      .finally(() => setLoading(false));
  }, []);

  const total = talleres.length;
  const aprobados = talleres.filter(t => t.estado_validacion === 'aprobado').length;
  const pendientes = talleres.filter(t => t.estado_validacion === 'pendiente').length;

  return (
    <div className="dashboard-role">
      <div className="dashboard-welcome">
        <div>
          <h1 className="dashboard-title">
            {getSaludo()}, <span className="gradient-text">{usuario.nombre}</span> 👋
          </h1>
          <p className="dashboard-subtitle">Bienvenido a tu Panel de Instructor</p>
        </div>
        <span className="badge badge-warning" style={{fontSize:'13px', padding:'6px 14px'}}>
          🏫 Instructor
        </span>
      </div>

      <div className="role-info-card">
        <div className="role-info-icon">🏫</div>
        <div>
          <h3>Panel de Instructor</h3>
          <p className="text-secondary" style={{marginTop:6,fontSize:14,lineHeight:1.6}}>
            Como instructor puedes crear y gestionar talleres, ver los estudiantes inscritos
            y gestionar los cupos disponibles. Aquí tienes un resumen rápido de tu actividad.
          </p>
        </div>
      </div>

      <h2 className="section-title">Resumen de Talleres</h2>
      {loading ? (
        <div className="spinner" style={{marginTop:20}}></div>
      ) : (
        <div className="stats-grid" style={{marginBottom: 32}}>
          <StatCard icon="🏫" label="Total Talleres" value={total} color="245,158,11" />
          <StatCard icon="🟢" label="Aprobados"      value={aprobados} color="16,185,129" />
          <StatCard icon="🟡" label="Pendientes"     value={pendientes} color="234,179,8" />
        </div>
      )}

      <div className="upcoming-features">
        <h2 className="section-title">Acciones rápidas</h2>
        <div className="quick-actions">
          <Link to="/mis-talleres" className="quick-action-card">
            <span className="quick-action-icon" style={{color: '#3b82f6'}}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </span>
            <div>
              <p className="quick-action-title">Mis Talleres</p>
              <p className="quick-action-desc">Gestiona tus talleres creados y su contenido</p>
            </div>
            <span className="quick-action-arrow">→</span>
          </Link>
          <Link to="/mis-talleres" className="quick-action-card">
            <span className="quick-action-icon" style={{color: '#10b981'}}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </span>
            <div>
              <p className="quick-action-title">Crear Nuevo Taller</p>
              <p className="quick-action-desc">Sube una nueva oferta de aprendizaje</p>
            </div>
            <span className="quick-action-arrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Vista estudiante ── */
function EstudianteDashboard({ usuario }) {
  return (
    <div className="dashboard-role">
      <div className="dashboard-welcome">
        <div>
          <h1 className="dashboard-title">
            {getSaludo()}, <span className="gradient-text">{usuario.nombre}</span> 👋
          </h1>
          <p className="dashboard-subtitle">Bienvenido a la plataforma LearnUp</p>
        </div>
        <span className="badge badge-info" style={{fontSize:'13px', padding:'6px 14px'}}>
          🎒 Estudiante
        </span>
      </div>

      <div className="role-info-card">
        <div className="role-info-icon" style={{filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'}}>🎓</div>
        <div>
          <h3>Panel Principal de Estudiante</h3>
          <p className="text-secondary" style={{marginTop:6,fontSize:14,lineHeight:1.6}}>
            Como estudiante puedes explorar el catálogo de talleres, ver detalles e inscribirte.
            Revisa tus opciones a continuación.
          </p>
        </div>
      </div>

      <div className="upcoming-features">
        <h2 className="section-title">Acciones rápidas</h2>
        <div className="quick-actions">
          <Link to="/explorar" className="quick-action-card">
            <span className="quick-action-icon" style={{color: '#f59e0b'}}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <div>
              <p className="quick-action-title">Explorar Catálogo</p>
              <p className="quick-action-desc">Busca nuevos talleres y oportunidades de aprendizaje</p>
            </div>
            <span className="quick-action-arrow">→</span>
          </Link>
          <Link to="/mis-inscripciones" className="quick-action-card">
            <span className="quick-action-icon" style={{color: '#ec4899'}}>
              <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </span>
            <div>
              <p className="quick-action-title">Mis Inscripciones</p>
              <p className="quick-action-desc">Revisa los talleres en los que te has anotado</p>
            </div>
            <span className="quick-action-arrow">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Componente principal ── */
export default function DashboardPage() {
  const { usuario, esAdmin, esInstructor } = useAuth();

  return (
    <Layout>
      {esAdmin       ? <AdminDashboard      usuario={usuario} /> :
       esInstructor  ? <InstructorDashboard usuario={usuario} /> :
                       <EstudianteDashboard usuario={usuario} />}
    </Layout>
  );
}

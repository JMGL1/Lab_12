import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Icons = {
  inicio:    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  users:     <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  profile:   <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"/></svg>,
  logout:    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  explore:   <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  talleres:  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  ingresos:  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  heart:     <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  check:     <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
};

function getIniciales(nombre, apellido) {
  return `${nombre?.[0] || ''}${apellido?.[0] || ''}`.toUpperCase();
}

function RolBadge({ rol }) {
  const config = {
    administrador: { label: 'Admin',      cls: 'badge-danger' },
    instructor:    { label: 'Instructor', cls: 'badge-warning' },
    estudiante:    { label: 'Estudiante', cls: 'badge-info' },
  };
  const { label, cls } = config[rol] || { label: rol, cls: 'badge-secondary' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export default function Layout({ children }) {
  const { usuario, esAdmin, esInstructor, esEstudiante, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() { logout(); navigate('/login'); }

  return (
    <div className="layout">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon" style={{ background: 'transparent', boxShadow: 'none' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#paint0_linear)"/>
              <path d="M2 17L12 22L22 17" stroke="url(#paint1_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="url(#paint2_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="paint0_linear" x1="2" y1="7" x2="22" y2="7" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1"/>
                  <stop offset="1" stopColor="#a855f7"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="2" y1="19.5" x2="22" y2="19.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#06b6d4"/>
                  <stop offset="1" stopColor="#3b82f6"/>
                </linearGradient>
                <linearGradient id="paint2_linear" x1="2" y1="14.5" x2="22" y2="14.5" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#ec4899"/>
                  <stop offset="1" stopColor="#8b5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-name" style={{ fontSize: 18, letterSpacing: '-0.03em' }}>LearnUp</span>
            <span className="logo-sub" style={{ color: 'var(--primary-hover)', fontWeight: 600 }}>Plataforma Educativa</span>
          </div>
        </div>

        {/* Navegación según rol */}
        <nav className="sidebar-nav">
          <p className="nav-section-label">General</p>
          <NavItem to="/dashboard" icon={Icons.inicio} label="Inicio" />

          {/* Administrador */}
          {esAdmin && (
            <>
              <p className="nav-section-label" style={{marginTop:12}}>Administración</p>
              <NavItem to="/usuarios"  icon={Icons.users}   label="Usuarios" />
              <NavItem to="/explorar"  icon={Icons.explore} label="Explorar Talleres" />
              <NavItem to="/validacion" icon={Icons.check}  label="Validar Talleres" />
            </>
          )}

          {/* Instructor */}
          {esInstructor && (
            <>
              <p className="nav-section-label" style={{marginTop:12}}>Instructor</p>
              <NavItem to="/mis-talleres" icon={Icons.talleres} label="Mis Talleres" />
              <NavItem to="/ingresos"     icon={Icons.ingresos} label="Mis Ingresos" />
            </>
          )}

          {/* Estudiante */}
          {esEstudiante && (
            <>
              <p className="nav-section-label" style={{marginTop:12}}>Aprendizaje</p>
              <NavItem to="/explorar"         icon={Icons.explore}  label="Explorar Talleres" />
              <NavItem to="/mis-inscripciones" icon={Icons.heart}   label="Mis Inscripciones" />
            </>
          )}

          <p className="nav-section-label" style={{marginTop:12}}>Cuenta</p>
          <NavItem to="/perfil" icon={Icons.profile} label="Mi Perfil" />
        </nav>

        {/* Footer con usuario */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar avatar-sm">{getIniciales(usuario?.nombre, usuario?.apellido)}</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">{usuario?.nombre} {usuario?.apellido}</p>
              <RolBadge rol={usuario?.rol} />
            </div>
          </div>
          <button className="btn btn-ghost btn-icon logout-btn" onClick={handleLogout} title="Cerrar sesión">
            {Icons.logout}
          </button>
        </div>
      </aside>

      <main className="layout-main">
        <div className="layout-content">{children}</div>
      </main>
    </div>
  );
}

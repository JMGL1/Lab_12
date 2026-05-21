import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Icons = {
  dashboard: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  users:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  profile:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  logout:    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  explore:   <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  talleres:  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  heart:     <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
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
          <div className="logo-icon">L</div>
          <div className="logo-text">
            <span className="logo-name">LearnUp</span>
            <span className="logo-sub">Plataforma Educativa</span>
          </div>
        </div>

        {/* Navegación según rol */}
        <nav className="sidebar-nav">
          <p className="nav-section-label">General</p>
          <NavItem to="/dashboard" icon={Icons.dashboard} label="Dashboard" />

          {/* Administrador */}
          {esAdmin && (
            <>
              <p className="nav-section-label" style={{marginTop:12}}>Administración</p>
              <NavItem to="/usuarios"  icon={Icons.users}   label="Usuarios" />
              <NavItem to="/explorar"  icon={Icons.explore} label="Explorar Talleres" />
            </>
          )}

          {/* Instructor */}
          {esInstructor && (
            <>
              <p className="nav-section-label" style={{marginTop:12}}>Instructor</p>
              <NavItem to="/mis-talleres" icon={Icons.talleres} label="Mis Talleres" />
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

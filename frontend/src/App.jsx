import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage              from './pages/LoginPage';
import RegisterPage           from './pages/RegisterPage';
import DashboardPage          from './pages/DashboardPage';
import UsuariosPage           from './pages/UsuariosPage';
import PerfilPage             from './pages/PerfilPage';
import ExplorePage            from './pages/ExplorePage';
import TalleresInstructorPage from './pages/TalleresInstructorPage';
import IngresosInstructorPage from './pages/IngresosInstructorPage';
import MisInscripcionesPage   from './pages/MisInscripcionesPage';
import ValidacionTalleresPage from './pages/ValidacionTalleresPage';

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="spinner spinner-lg" />
      <p className="text-secondary">Cargando LearnUp...</p>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { autenticado, cargando } = useAuth();
  if (cargando) return <LoadingScreen />;
  return autenticado ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { autenticado, esAdmin, cargando } = useAuth();
  if (cargando) return <LoadingScreen />;
  if (!autenticado) return <Navigate to="/login" replace />;
  if (!esAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function InstructorRoute({ children }) {
  const { autenticado, esInstructor, esAdmin, cargando } = useAuth();
  if (cargando) return <LoadingScreen />;
  if (!autenticado) return <Navigate to="/login" replace />;
  if (!esInstructor && !esAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function EstudianteRoute({ children }) {
  const { autenticado, esEstudiante, cargando } = useAuth();
  if (cargando) return <LoadingScreen />;
  if (!autenticado) return <Navigate to="/login" replace />;
  if (!esEstudiante) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { autenticado, cargando } = useAuth();
  if (cargando) return <LoadingScreen />;
  return autenticado ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Cualquier usuario autenticado */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/perfil"    element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />

      {/* Solo admin */}
      <Route path="/usuarios"  element={<AdminRoute><UsuariosPage /></AdminRoute>} />
      <Route path="/validacion" element={<AdminRoute><ValidacionTalleresPage /></AdminRoute>} />

      {/* Instructor (y admin puede ver también) */}
      <Route path="/mis-talleres" element={<InstructorRoute><TalleresInstructorPage /></InstructorRoute>} />
      <Route path="/ingresos" element={<InstructorRoute><IngresosInstructorPage /></InstructorRoute>} />

      {/* Estudiante */}
      <Route path="/mis-inscripciones" element={<EstudianteRoute><MisInscripcionesPage /></EstudianteRoute>} />

      {/* Explorar talleres — accesible por admin y estudiante */}
      <Route path="/explorar" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />

      {/* Redirecciones */}
      <Route path="/"  element={<Navigate to="/dashboard" replace />} />
      <Route path="*"  element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

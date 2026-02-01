import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import AttendancePage from './pages/AttendancePage';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import { Camera, LogOut } from 'lucide-react';

function NavBar() {
  const location = useLocation();
  // Don't show navbar on login page
  if (location.pathname === '/login') return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user_name');
    window.location.href = '/login';
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-5 py-2.5 rounded-full transition-all duration-300 text-sm font-semibold tracking-wide ${isActive
      ? 'bg-white text-slate-900 shadow-lg shadow-white/10 scale-105'
      : 'text-gray-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 glass-card px-2 py-2 flex justify-between items-center bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full w-[90%] max-w-4xl">
      <div className="flex items-center gap-2 pl-4">
        <div className="bg-indigo-500 rounded-full p-1.5">
          <Camera className="text-white" size={16} />
        </div>
        <span className="font-bold text-lg text-white tracking-tight">
          Selfie<span className="text-indigo-400">Attendance</span> <span className="text-xs text-yellow-400 ml-1">(v2.0)</span>
        </span>
      </div>

      <div className="flex gap-1 pr-1 items-center">
        <NavLink to="/attendance" className={navLinkClass}>
          <span>Attend</span>
        </NavLink>
        {localStorage.getItem('role') === 'HR' && (
          <>
            <NavLink to="/register" className={navLinkClass}>
              <span>Register</span>
            </NavLink>
            <NavLink to="/dashboard" className={navLinkClass}>
              <span>Dashboard</span>
            </NavLink>
          </>
        )}
        {localStorage.getItem('role') === 'EMPLOYEE' && (
          <NavLink to="/dashboard" className={navLinkClass}>
            <span>My History</span>
          </NavLink>
        )}
        <button onClick={handleLogout} className="p-2 ml-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-full transition-colors" title="Logout">
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <NavBar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/register"
            element={
              <PrivateRoute>
                <RegisterRouteWrapper />
              </PrivateRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <PrivateRoute>
                <AttendancePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

// Helper to check role dynamically
const RegisterRouteWrapper = () => {
  const role = localStorage.getItem('role');
  return role === 'HR' ? <RegisterPage /> : <Navigate to="/attendance" replace />;
};

export default App;

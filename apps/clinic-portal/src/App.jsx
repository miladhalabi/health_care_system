import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ReceptionDashboard from './pages/ReceptionDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Search from './pages/Search';
import Encounters from './pages/Encounters';
import Schedule from './pages/Schedule';
import MyRotation from './pages/MyRotation';
import useAuthStore from './store/useAuthStore';

function App() {
  const { isAuthenticated, user } = useAuthStore();

  const getDashboard = () => {
    if (user?.role === 'DOCTOR') return <DoctorDashboard />;
    if (user?.role === 'RECEPTIONIST') return <ReceptionDashboard />;
    return <Dashboard />;
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? getDashboard() : <Navigate to="/login" />} 
        />
        <Route 
          path="/schedule" 
          element={isAuthenticated ? <Schedule /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/rotation" 
          element={isAuthenticated ? <MyRotation /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/search" 
          element={isAuthenticated ? <Search /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/encounters" 
          element={isAuthenticated ? <Encounters /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} 
        />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;

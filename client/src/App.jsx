import { Navigate, Route, Routes } from 'react-router-dom'; import { useAuth, HOME } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import Landing from './pages/Landing'; import { Login, Signup, Pending } from './pages/Auth'; import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment'; import EquipmentDetail from './pages/EquipmentDetail'; import Calibration from './pages/Calibration'; import Verification from './pages/Verification';
import Review from './pages/Review'; import Maintenance from './pages/Maintenance'; import Compliance from './pages/Compliance'; import Alerts from './pages/Alerts';
import { Users, Audit, Activity, Profile } from './pages/Admin';
function Guard({ roles, children }) {
  const { user, loading } = useAuth(); if (loading) return <p className="p-4">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />; if (user.status === 'pending') return <Navigate to="/pending" replace />;
  return !roles || roles.includes(user.role) ? children : <Navigate to={HOME[user.role]} replace />;
}
const S = ['administrator', 'technician'], W = ['administrator', 'technician', 'auditor'], AA = ['administrator', 'auditor'];
export default function App() {
  const { user } = useAuth();
  return <Routes>
    <Route path="/" element={user && user.status === 'active' ? <Navigate to={HOME[user.role]} /> : <Landing />} />
    <Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} /><Route path="/pending" element={<Pending />} />
    <Route element={<Guard><DashboardLayout /></Guard>}>
      <Route path="/admin/dashboard" element={<Guard roles={['administrator']}><Dashboard /></Guard>} />
      <Route path="/technician/dashboard" element={<Guard roles={['technician']}><Dashboard /></Guard>} />
      <Route path="/auditor/dashboard" element={<Guard roles={['auditor']}><Dashboard /></Guard>} />
      <Route path="/student/dashboard" element={<Guard roles={['student']}><Dashboard /></Guard>} />
      <Route path="/admin/users" element={<Guard roles={['administrator']}><Users /></Guard>} />
      <Route path="/technician/equipment" element={<Guard roles={W}><Equipment /></Guard>} />
      <Route path="/student/equipment" element={<Guard roles={['student']}><Equipment /></Guard>} />
      <Route path="/equipment/:id" element={<EquipmentDetail />} />
      <Route path="/technician/calibration" element={<Guard roles={W}><Calibration /></Guard>} />
      <Route path="/student/calibration" element={<Guard roles={['student']}><Calibration /></Guard>} />
      <Route path="/technician/verification" element={<Guard roles={W}><Verification /></Guard>} />
      <Route path="/technician/review" element={<Guard roles={S}><Review mode="review" /></Guard>} />
      <Route path="/technician/quarantine" element={<Guard roles={W}><Review mode="quarantine" /></Guard>} />
      <Route path="/technician/maintenance" element={<Guard roles={W}><Maintenance /></Guard>} />
      <Route path="/compliance" element={<Compliance />} />
      <Route path="/alerts" element={<Guard roles={W}><Alerts /></Guard>} />
      <Route path="/audit" element={<Guard roles={AA}><Audit /></Guard>} />
      <Route path="/activity" element={<Guard roles={AA}><Activity /></Guard>} />
      <Route path="/profile" element={<Profile />} />
    </Route><Route path="*" element={<Navigate to="/" />} /></Routes>;
}

import { NavLink, Outlet, useNavigate } from 'react-router-dom'; import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext'; import api from '../services/api';
const MENU = {
  administrator: [['/admin/dashboard', 'Dashboard'], ['/admin/users', 'Users'], ['/technician/equipment', 'Equipment'], ['/technician/calibration', 'Calibrations'], ['/technician/review', 'Manual review'], ['/technician/quarantine', 'Quarantine'], ['/technician/maintenance', 'Maintenance'], ['/compliance', 'Compliance'], ['/alerts', 'Alerts'], ['/audit', 'Audit trail'], ['/activity', 'Technician activity']],
  technician: [['/technician/dashboard', 'Dashboard'], ['/technician/equipment', 'Equipment'], ['/technician/calibration', 'Calibrations'], ['/technician/review', 'Manual review'], ['/technician/quarantine', 'Quarantine'], ['/technician/maintenance', 'Maintenance'], ['/compliance', 'Compliance'], ['/alerts', 'Alerts']],
  auditor: [['/auditor/dashboard', 'Dashboard'], ['/technician/equipment', 'Equipment'], ['/technician/calibration', 'Calibrations'], ['/technician/quarantine', 'Quarantine'], ['/technician/maintenance', 'Maintenance'], ['/compliance', 'Compliance'], ['/alerts', 'Alerts'], ['/audit', 'Audit trail'], ['/activity', 'Technician activity']],
  student: [['/student/dashboard', 'Dashboard'], ['/student/equipment', 'Equipment'], ['/student/calibration', 'Calibration status'], ['/compliance', 'Compliance']] };
export function Sidebar({ role }) { return <aside className="sidebar"><div className="brand">◐ CalTrack</div>{MENU[role].map(([to, l]) => <NavLink key={to} to={to}>{l}</NavLink>)}</aside>; }
export function TopBar() {
  const { user, logout } = useAuth(), nav = useNavigate(), [n, setN] = useState(0);
  useEffect(() => { if (user.role !== 'student') api.get('/alerts').then(a => setN(a.filter(x => !x.is_read).length)).catch(() => {}); }, [user]);
  return <div className="topbar"><span className="text-muted">{user.name} · {user.role}</span><span className="d-flex gap-2 align-items-center">
    {user.role !== 'student' && <NavLink to="/alerts" className="btn btn-sm btn-outline-secondary">Alerts {n > 0 && <span className="badge bg-danger">{n}</span>}</NavLink>}
    <NavLink to="/profile" className="btn btn-sm btn-outline-secondary">Profile</NavLink>
    <button className="btn btn-sm btn-outline-brand" onClick={async () => { await logout(); nav('/'); }}>Log out</button></span></div>;
}
export default function DashboardLayout() { const { user } = useAuth(); return <div className="shell"><Sidebar role={user.role} /><div className="main"><TopBar /><div className="content"><Outlet /></div></div></div>; }

import { useState } from 'react'; import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth, HOME } from '../context/AuthContext'; import api from '../services/api'; import { Notice, useAction } from '../components/ui';
const Card = ({ title, children }) => <div className="authcard"><Link to="/" className="text-decoration-none">◐ CalTrack</Link><h2 className="mt-3 mb-3">{title}</h2>{children}</div>;
export function Login() {
  const { login, user } = useAuth(), nav = useNavigate(), [f, setF] = useState({ email: '', password: '' }), a = useAction();
  if (user) return <Navigate to={user.status === 'pending' ? '/pending' : HOME[user.role]} />;
  const submit = async e => { e.preventDefault(); const u = await a.run(() => login(f.email, f.password)); if (u) nav(u.status === 'pending' ? '/pending' : HOME[u.role]); };
  return <Card title="Log in"><Notice error={a.error} /><form onSubmit={submit}>
    <label className="form-label">Email</label><input className="form-control mb-3" type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
    <label className="form-label">Password</label><input className="form-control mb-3" type="password" required value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
    <button className="btn btn-brand w-100">Log in</button></form><p className="mt-3 mb-0 text-muted">No account? <Link to="/signup">Sign up</Link></p></Card>;
}
export function Signup() {
  const [f, setF] = useState({ name: '', email: '', id_number: '', department: '', role: 'technician', password: '', confirm: '' }), a = useAction(), [done, setDone] = useState('');
  const set = k => e => setF({ ...f, [k]: e.target.value });
  if (done) return <Card title="Request received"><p>{done}</p><Link to="/login" className="btn btn-brand">Go to log in</Link></Card>;
  return <Card title="Sign up"><Notice error={a.error} /><form onSubmit={async e => { e.preventDefault(); const r = await a.run(() => api.post('/auth/signup', f)); if (r) setDone(r.message); }}>
    {[['name', 'Full name'], ['email', 'Email', 'email'], ['id_number', 'Employee ID or student register number'], ['department', 'Department']].map(([k, l, t]) => <div key={k}><label className="form-label">{l}</label><input className="form-control mb-3" type={t || 'text'} required value={f[k]} onChange={set(k)} /></div>)}
    <label className="form-label">I am a</label><select className="form-select mb-3" value={f.role} onChange={set('role')}><option value="technician">Laboratory Technician</option><option value="auditor">Auditor</option><option value="student">Student</option></select>
    <label className="form-label">Password</label><input className="form-control" type="password" required value={f.password} onChange={set('password')} /><div className="form-text mb-3">At least 8 characters with upper case, lower case and a digit.</div>
    <label className="form-label">Confirm password</label><input className="form-control mb-3" type="password" required value={f.confirm} onChange={set('confirm')} />
    <button className="btn btn-brand w-100">Create account</button></form><p className="mt-3 mb-0 text-muted">Already registered? <Link to="/login">Log in</Link></p></Card>;
}
export function Pending() {
  const { user, logout } = useAuth(); const nav = useNavigate();
  if (user && user.status === 'active') return <Navigate to={HOME[user.role]} />;
  return <Card title="Waiting for approval"><p>Your account was created. An administrator must approve it before you can use CalTrack. Log in again once you have been approved.</p>
    <button className="btn btn-outline-brand" onClick={async () => { await logout(); nav('/login'); }}>Back to log in</button></Card>;
}

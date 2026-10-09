import { useEffect, useState } from 'react'; import api from '../services/api'; import { StatusBadge, Notice, useAction, Empty } from '../components/ui';
export function Users() {
  const [rows, setRows] = useState([]), a = useAction(), load = () => api.get('/users').then(setRows); useEffect(() => { load(); }, []);
  const [roles, setRoles] = useState({});
  const go = (fn, m) => async () => { await a.run(fn, m); load(); };
  return <><h1>Users</h1><Notice error={a.error} ok={a.ok} /><div className="panel p-0 table-responsive"><table className="table mb-0"><thead><tr><th>Name</th><th>Email</th><th>ID</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>
    {rows.map(u => <tr key={u.id}><td>{u.name}<div className="small text-muted">{u.department}</div></td><td>{u.email}</td><td className="mono">{u.id_number}</td>
      <td><select className="form-select form-select-sm" value={roles[u.id] || u.role} onChange={e => setRoles({ ...roles, [u.id]: e.target.value })}><option value="administrator">Administrator</option><option value="technician">Laboratory Technician</option><option value="auditor">Auditor</option><option value="student">Student</option></select></td>
      <td><StatusBadge value={u.status} /></td><td className="text-end text-nowrap">
        {u.status === 'pending' && <button className="btn btn-sm btn-brand me-1" onClick={go(() => api.patch(`/users/${u.id}/approve`, { role: roles[u.id] || u.role }), 'User approved.')}>Approve</button>}
        {u.status !== 'pending' && roles[u.id] && roles[u.id] !== u.role && <button className="btn btn-sm btn-outline-brand me-1" onClick={go(() => api.patch(`/users/${u.id}/role`, { role: roles[u.id] }), 'Role updated.')}>Save role</button>}
        {u.status === 'active' && <button className="btn btn-sm btn-outline-danger" onClick={go(() => api.patch(`/users/${u.id}/disable`), 'User disabled.')}>Disable</button>}</td></tr>)}</tbody></table></div></>;
}
export function Audit() {
  const [rows, setRows] = useState([]), [user, setUser] = useState(''), [action, setAction] = useState(''), load = () => api.get(`/audit?user=${encodeURIComponent(user)}&action=${encodeURIComponent(action)}`).then(setRows); useEffect(() => { load(); }, []);
  return <><h1>Audit trail</h1><p className="text-muted">Entries are append-only. Nobody, including administrators, can edit or delete them.</p><form className="d-flex gap-2 mb-3" onSubmit={e => { e.preventDefault(); load(); }}><input className="form-control" placeholder="User name" value={user} onChange={e => setUser(e.target.value)} /><input className="form-control" placeholder="Action, e.g. LOGIN" value={action} onChange={e => setAction(e.target.value.toUpperCase())} /><button className="btn btn-brand">Filter</button></form>
    <div className="panel p-0 table-responsive"><table className="table table-sm mb-0"><thead><tr><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>Detail</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td className="mono">{r.created_at}</td><td>{r.user_name}</td><td className="mono">{r.action}</td><td>{r.entity} {r.entity_id}</td><td>{r.detail}</td></tr>)}</tbody></table>{!rows.length && <Empty>No entries match.</Empty>}</div></>;
}
export function Activity() {
  const [rows, setRows] = useState([]); useEffect(() => { api.get('/activity').then(setRows); }, []);
  return <><h1>Technician activity</h1><div className="panel p-0"><table className="table mb-0"><thead><tr><th>Name</th><th>Calibrations</th><th>Average CRI</th><th>Sent to review or quarantine</th><th>Last entry</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.name}</td><td className="mono">{r.calibrations}</td><td className="mono">{r.avg_cri ?? '–'}</td><td className="mono">{r.flagged || 0}</td><td>{r.last_entry || '–'}</td></tr>)}</tbody></table></div></>;
}
export function Profile() {
  const [f, setF] = useState({ current: '', next: '' }), a = useAction();
  return <><h1>Profile</h1><form className="panel" style={{ maxWidth: 420 }} onSubmit={async e => { e.preventDefault(); const r = await a.run(() => api.post('/auth/change-password', f), 'Password changed.'); if (r) setF({ current: '', next: '' }); }}><h5>Change password</h5><Notice error={a.error} ok={a.ok} />
    <input className="form-control mb-2" type="password" placeholder="Current password" required value={f.current} onChange={e => setF({ ...f, current: e.target.value })} /><input className="form-control mb-3" type="password" placeholder="New password" required value={f.next} onChange={e => setF({ ...f, next: e.target.value })} /><button className="btn btn-brand">Change password</button></form></>;
}

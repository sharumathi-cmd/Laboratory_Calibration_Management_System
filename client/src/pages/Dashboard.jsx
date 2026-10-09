import { useEffect, useState } from 'react'; import { Link } from 'react-router-dom'; import api from '../services/api'; import { StatCard, StatusBadge, CRIIndicator, Notice } from '../components/ui'; import { useAuth } from '../context/AuthContext';
export default function Dashboard() {
  const { user } = useAuth(), [d, setD] = useState(null), [err, setErr] = useState('');
  useEffect(() => { api.get('/dashboard/summary').then(setD).catch(e => setErr(e.message)); }, []);
  if (err) return <Notice error={err} />; if (!d) return <p>Loading…</p>;
  const e = d.equipment, pct = e.total ? Math.round(100 * (e.calibrated || 0) / e.total) : 0;
  return <><h1 className="mb-3">Welcome, {user.name.split(' ')[0]}</h1>
    <div className="row g-3 mb-4"><div className="col-6 col-lg-3"><StatCard label="Equipment" value={e.total} /></div>
      <div className="col-6 col-lg-3"><StatCard kind="ok" label="Calibrated" value={e.calibrated || 0} /></div>
      <div className="col-6 col-lg-3"><StatCard kind="warn" label="Due soon" value={e.dueSoon || 0} /></div>
      <div className="col-6 col-lg-3"><StatCard kind="bad" label="Expired" value={e.expired || 0} /></div></div>
    <div className="panel"><h5>Compliance</h5><div className="progress" style={{ height: 12 }} role="progressbar" aria-valuenow={pct}><div className="progress-bar" style={{ width: pct + '%', background: 'var(--ok)' }} /></div><p className="text-muted mt-2 mb-0">{pct}% of instruments are within their calibration period.</p></div>
    {d.queues && <div className="row g-3 mb-3"><div className="col-md-4"><StatCard kind="warn" label="Waiting for manual review" value={d.queues.pending || 0} /></div><div className="col-md-4"><StatCard kind="bad" label="In quarantine" value={d.queues.quarantined || 0} /></div>
      {d.pendingUsers !== undefined && <div className="col-md-4"><Link to="/admin/users" className="text-decoration-none text-reset"><StatCard label="Sign-ups to approve" value={d.pendingUsers} /></Link></div>}</div>}
    {d.trend && d.trend.length > 0 && <div className="panel"><h5>Average CRI by month</h5><div className="d-flex align-items-end gap-3" style={{ height: 120 }}>{d.trend.map(t => <div key={t.month} className="text-center flex-fill"><div className="num small">{t.avg_cri}</div><div style={{ height: t.avg_cri, background: 'var(--brand)', borderRadius: 3 }} /><div className="small text-muted">{t.month}</div></div>)}</div></div>}
    {d.recent && <div className="panel"><h5>Latest calibrations</h5><table className="table"><thead><tr><th>Equipment</th><th>Date</th><th>CRI</th><th>Band</th><th>Decision</th></tr></thead><tbody>
      {d.recent.map(r => <tr key={r.id}><td>{r.code}</td><td>{r.calibration_date}</td><td><CRIIndicator value={r.cri} /></td><td>{r.band}</td><td><StatusBadge value={r.decision} /></td></tr>)}</tbody></table>
      {!d.recent.length && <p className="text-muted mb-0">No calibrations yet. Register equipment, then enter its first calibration.</p>}</div>}</>;
}

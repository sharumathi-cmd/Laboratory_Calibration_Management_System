import { useEffect, useState } from 'react'; import api from '../services/api'; import { StatusBadge, Empty } from '../components/ui';
export default function Alerts() {
  const [rows, setRows] = useState([]), load = () => api.get('/alerts').then(setRows); useEffect(() => { load(); }, []);
  return <><h1>Alerts</h1>{!rows.length && <Empty>No alerts. You will see one here when an instrument is due or expired.</Empty>}{rows.map(a => <div key={a.id} className="panel d-flex justify-content-between align-items-center" style={{ opacity: a.is_read ? .6 : 1 }}>
    <span><StatusBadge value={a.type} /> <span className="ms-2">{a.message}</span><span className="text-muted small ms-2">{a.created_at}</span></span>
    {!a.is_read && <button className="btn btn-sm btn-outline-brand" onClick={() => api.patch(`/alerts/${a.id}/read`).then(load)}>Mark as read</button>}</div>)}</>;
}

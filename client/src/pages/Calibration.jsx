import { useEffect, useState } from 'react'; import { Link, useNavigate } from 'react-router-dom'; import api from '../services/api'; import { StatusBadge, CRIIndicator, Notice, useAction, Empty } from '../components/ui'; import { useAuth } from '../context/AuthContext';
const today = () => new Date().toISOString().slice(0, 10);
export default function Calibration() {
  const { user } = useAuth(), nav = useNavigate(), canEnter = ['administrator', 'technician'].includes(user.role), student = user.role === 'student';
  const [list, setList] = useState([]), [eq, setEq] = useState([]), [show, setShow] = useState(false), a = useAction();
  const [f, setF] = useState({ equipment_id: '', calibration_date: today(), certificate_no: '', certificate_date: today(), certificate_serial: '', lab: '', agency: '', tolerance: '', remarks: '' });
  const [pts, setPts] = useState([{ standard: '', measured: '' }]), [file, setFile] = useState(null);
  useEffect(() => { api.get('/calibrations').then(setList); if (canEnter) api.get('/equipment').then(setEq); }, []);
  const tol = parseFloat(f.tolerance), set = k => e => setF({ ...f, [k]: e.target.value }), dev = p => (p.standard === '' || p.measured === '' ? null : +p.measured - +p.standard);
  const submit = async e => { e.preventDefault(); const fd = new FormData(); Object.entries(f).forEach(([k, v]) => fd.append(k, v)); fd.append('points', JSON.stringify(pts)); if (file) fd.append('certificate', file);
    const r = await a.run(() => api.post('/calibrations', fd)); if (r) nav('/technician/verification?id=' + r.id); };
  return <><div className="d-flex justify-content-between align-items-center mb-3"><h1 className="mb-0">{student ? 'Calibration status' : 'Calibrations'}</h1>{canEnter && <button className="btn btn-brand" onClick={() => setShow(!show)}>{show ? 'Close form' : 'Enter calibration'}</button>}</div>
    {show && <form className="panel" onSubmit={submit}><Notice error={a.error} /><div className="row g-3">
      <div className="col-md-4"><label className="form-label">Equipment *</label><select className="form-select" required value={f.equipment_id} onChange={set('equipment_id')}><option value="">Choose…</option>{eq.map(x => <option key={x.id} value={x.id}>{x.code} – {x.name}</option>)}</select></div>
      <div className="col-md-4"><label className="form-label">Calibration date *</label><input type="date" className="form-control" required value={f.calibration_date} onChange={set('calibration_date')} /></div>
      <div className="col-md-4"><label className="form-label">Tolerance (± units) *</label><input type="number" step="any" className="form-control" required value={f.tolerance} onChange={set('tolerance')} /></div>
      <div className="col-md-4"><label className="form-label">Certificate number *</label><input className="form-control" required value={f.certificate_no} onChange={set('certificate_no')} /></div>
      <div className="col-md-4"><label className="form-label">Date on certificate</label><input type="date" className="form-control" value={f.certificate_date} onChange={set('certificate_date')} /></div>
      <div className="col-md-4"><label className="form-label">Serial number on certificate</label><input className="form-control" value={f.certificate_serial} onChange={set('certificate_serial')} /></div>
      <div className="col-md-4"><label className="form-label">Calibration lab</label><input className="form-control" value={f.lab} onChange={set('lab')} /></div>
      <div className="col-md-4"><label className="form-label">Agency</label><input className="form-control" value={f.agency} onChange={set('agency')} /></div>
      <div className="col-md-4"><label className="form-label">Certificate file (PDF, JPG, PNG; 5 MB)</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="form-control" onChange={e => setFile(e.target.files[0])} /></div></div>
      <h5 className="mt-4">Test points</h5><table className="table table-sm"><thead><tr><th>Standard value</th><th>Measured value</th><th>Deviation</th><th></th></tr></thead><tbody>
        {pts.map((p, i) => { const d = dev(p), out = d !== null && tol > 0 && Math.abs(d) > tol; return <tr key={i}>
          <td><input type="number" step="any" className="form-control form-control-sm" required value={p.standard} onChange={e => setPts(pts.map((x, j) => j === i ? { ...x, standard: e.target.value } : x))} /></td>
          <td><input type="number" step="any" className="form-control form-control-sm" required value={p.measured} onChange={e => setPts(pts.map((x, j) => j === i ? { ...x, measured: e.target.value } : x))} /></td>
          <td className="mono" style={{ color: out ? 'var(--bad)' : undefined }}>{d === null ? '–' : d.toFixed(4)}{out && ' outside tolerance'}</td>
          <td>{pts.length > 1 && <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => setPts(pts.filter((_, j) => j !== i))}>Remove</button>}</td></tr>; })}</tbody></table>
      <button type="button" className="btn btn-sm btn-outline-brand me-2" onClick={() => setPts([...pts, { standard: '', measured: '' }])}>Add test point</button>
      <div className="mt-3"><label className="form-label">Remarks</label><textarea className="form-control mb-3" rows="2" value={f.remarks} onChange={set('remarks')} /><button className="btn btn-brand">Save and verify</button></div></form>}
    <div className="panel p-0 table-responsive"><table className="table mb-0"><thead><tr><th>Equipment</th><th>Date</th>{!student && <><th>Certificate</th><th>Technician</th><th>CRI</th></>}<th>Band</th><th>Decision</th>{!student && <th></th>}</tr></thead><tbody>
      {list.map(c => <tr key={c.id}><td>{c.code} <span className="text-muted">{c.equipment_name}</span></td><td>{c.calibration_date}</td>{!student && <><td className="mono">{c.certificate_no}</td><td>{c.technician}</td><td><CRIIndicator value={c.cri} /></td></>}<td>{c.band}</td><td><StatusBadge value={c.decision} /></td>{!student && <td><Link to={`/technician/verification?id=${c.id}`}>View checks</Link></td>}</tr>)}</tbody></table>
      {!list.length && <Empty>No calibrations recorded yet.</Empty>}</div></>;
}

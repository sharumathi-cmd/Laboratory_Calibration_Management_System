import { useEffect, useState } from 'react'; import { useSearchParams } from 'react-router-dom'; import api from '../services/api'; import { StatusBadge, CRIIndicator, Notice } from '../components/ui';
export default function Verification() {
  const [sp] = useSearchParams(), [c, setC] = useState(null), [err, setErr] = useState('');
  useEffect(() => { const go = id => api.get('/calibrations/' + id).then(setC).catch(e => setErr(e.message)); if (sp.get('id')) go(sp.get('id')); else api.get('/calibrations').then(l => l[0] ? go(l[0].id) : setErr('No calibrations to verify yet.')); }, [sp]);
  if (err) return <Notice error={err} />; if (!c) return <p>Loading…</p>;
  return <><h1>Verification result</h1><div className="panel"><p className="mb-1">{c.code} {c.equipment_name} · calibrated {c.calibration_date} by {c.technician}</p>
    <div className="d-flex gap-3 align-items-center"><span className="fs-2 num">{c.cri}</span><CRIIndicator value={c.cri} /><span>{c.band}</span><StatusBadge value={c.decision} /></div>
    {c.review_note && <p className="mt-2 mb-0 text-muted">Review by {c.reviewer}: {c.review_note}</p>}</div>
    <div className="panel"><h5>The 7 checks</h5>{c.checks.map(k => <div className={`check ${k.status}`} key={k.id}><div className="d-flex justify-content-between"><b>{k.check_no}. {k.name}</b><span className="mono small">weight {k.weight} · score {k.score} · <StatusBadge value={k.status} /></span></div><div className="text-muted small">{k.reason}</div></div>)}
      <p className="text-muted small mb-0">CRI = sum of (weight × score) ÷ 100. Any test point outside tolerance caps CRI at 49.</p></div>
    <div className="panel"><h5>Test points</h5><table className="table table-sm mb-0"><thead><tr><th>Standard</th><th>Measured</th><th>Deviation</th><th>Tolerance</th><th>Result</th></tr></thead><tbody>{c.points.map(p => <tr key={p.id}><td className="mono">{p.standard_value}</td><td className="mono">{p.measured_value}</td><td className="mono">{p.deviation.toFixed(4)}</td><td className="mono">±{p.tolerance}</td><td><StatusBadge value={p.within_tolerance ? 'Passed' : 'Failed'} /></td></tr>)}</tbody></table></div></>;
}

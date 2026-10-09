import { Link } from 'react-router-dom';
const Gauge = () => <svg viewBox="0 0 300 190" role="img" aria-label="Calibration reliability gauge showing 92">
  <path d="M30 160 A120 120 0 0 1 270 160" fill="none" stroke="#d9e0de" strokeWidth="18" strokeLinecap="round" />
  <path d="M30 160 A120 120 0 0 1 150 40" fill="none" stroke="#b42318" strokeWidth="18" strokeLinecap="round" opacity=".85" />
  <path d="M150 40 A120 120 0 0 1 222 56" fill="none" stroke="#a96a0a" strokeWidth="18" opacity=".85" />
  <path d="M222 56 A120 120 0 0 1 270 160" fill="none" stroke="#0f7a4a" strokeWidth="18" strokeLinecap="round" />
  <g className="needle" style={{ transformOrigin: '150px 160px', transform: 'rotate(58deg)' }}><line x1="150" y1="160" x2="150" y2="62" stroke="#1b2a2f" strokeWidth="4" strokeLinecap="round" /></g>
  <circle cx="150" cy="160" r="9" fill="#1b2a2f" /><text x="150" y="150" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="12" fill="#5d6f75" dy="22">CRI 92 · Highly Reliable</text></svg>;
export default function Landing() {
  return <div><nav className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom bg-white"><strong>◐ CalTrack</strong>
    <span className="d-flex gap-2"><Link to="/login" className="btn btn-outline-brand btn-sm">Log in</Link><Link to="/signup" className="btn btn-brand btn-sm">Sign up</Link></span></nav>
    <section className="hero"><div><h1>Know which lab instruments you can still trust.</h1>
      <p>CalTrack records every calibration, scores how reliable it looks against the instrument's own history, and warns you before anything falls out of date.</p>
      <Link to="/signup" className="btn btn-brand me-2">Create an account</Link><Link to="/login" className="btn btn-outline-brand">Log in</Link></div><Gauge /></section>
    <section className="feat">{[['Equipment register', 'One record per instrument, with its full calibration and maintenance timeline.'], ['Reliability score', 'Seven checks compare each result with the instrument’s fingerprint and explain the score in plain words.'], ['Compliance scheduler', 'Daily checks mark instruments Calibrated, Due Soon or Expired and send alerts.'], ['Audit trail', 'Every approval, review and release is logged and cannot be edited.']].map(([t, d]) => <div key={t} className="panel mb-0"><h5>{t}</h5><p className="text-muted mb-0">{d}</p></div>)}</section></div>;
}

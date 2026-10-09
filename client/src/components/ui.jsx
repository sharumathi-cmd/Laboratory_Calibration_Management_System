import { useState } from 'react';
const tone = { Calibrated: 'ok', 'Due Soon': 'warn', Expired: 'bad', accepted: 'ok', pending_review: 'warn', quarantined: 'bad', rejected: 'bad', Passed: 'ok', Warning: 'warn', Failed: 'bad', active: 'ok', pending: 'warn', disabled: 'bad', 'Highly Reliable': 'ok', Reliable: 'info', 'Manual Review': 'warn', Unreliable: 'bad' };
export const StatusBadge = ({ value }) => value ? <span className={`sbadge ${tone[value] || ''}`}>{String(value).replace('_', ' ')}</span> : null;
export const StatCard = ({ label, value, kind = '' }) => <div className={`statcard ${kind}`}><div className="v">{value ?? '–'}</div><div className="l">{label}</div></div>;
export const CRIIndicator = ({ value }) => { if (value == null) return <span className="text-muted">–</span>; const c = value >= 70 ? 'var(--ok)' : value >= 50 ? 'var(--warn)' : 'var(--bad)';
  return <span className="cri"><span className="num">{value}</span><span className="bar"><i style={{ width: value + '%', background: c }} /></span></span>; };
export const Modal = ({ title, onClose, children }) => <div className="modal-bg" onClick={onClose}><div className="modal-box" onClick={e => e.stopPropagation()}><h5 className="mb-3">{title}</h5>{children}</div></div>;
export const Notice = ({ error, ok }) => error ? <div className="alert alert-danger py-2">{error}</div> : ok ? <div className="alert alert-success py-2">{ok}</div> : null;
export const Empty = ({ children }) => <p className="text-muted my-4 text-center">{children}</p>;
export function useAction() { const [error, setE] = useState(''), [ok, setO] = useState(''); const run = async (fn, msg) => { setE(''); setO(''); try { const r = await fn(); if (msg) setO(msg); return r; } catch (e) { setE(e.message); } }; return { error, ok, run }; }

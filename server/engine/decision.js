const band = cri => (cri >= 90 ? 'Highly Reliable' : cri >= 70 ? 'Reliable' : cri >= 50 ? 'Manual Review' : 'Unreliable');
// learning: DCF has n < 3. If any non-historical check warns, send to manual review.
function decide(cri, checks = [], learning = false) {
  const b = band(cri);
  if (cri < 50) return { band: b, decision: 'quarantined' };
  if (cri < 70) return { band: b, decision: 'pending_review' };
  if (learning && checks.some(c => c.no !== 1 && c.status !== 'Passed')) return { band: b, decision: 'pending_review' };
  return { band: b, decision: 'accepted' };
}
module.exports = { band, decide };

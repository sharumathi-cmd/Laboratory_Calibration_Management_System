async function req(method, url, body) {
  const opt = { method, credentials: 'include', headers: {} };
  if (body instanceof FormData) opt.body = body; else if (body) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body); }
  const r = await fetch('/api' + url, opt); const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || 'Request failed (' + r.status + ')'); return data;
}
export default { get: u => req('GET', u), post: (u, b) => req('POST', u, b), put: (u, b) => req('PUT', u, b), patch: (u, b) => req('PATCH', u, b) };

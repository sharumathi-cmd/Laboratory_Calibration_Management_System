import { createContext, useContext, useEffect, useState } from 'react'; import api from '../services/api';
const Ctx = createContext(null); export const useAuth = () => useContext(Ctx);
export const HOME = { administrator: '/admin/dashboard', technician: '/technician/dashboard', auditor: '/auditor/dashboard', student: '/student/dashboard' };
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const login = async (email, password) => { const u = await api.post('/auth/login', { email, password }); setUser(u); return u; };
  const logout = async () => { await api.post('/auth/logout'); setUser(null); };
  return <Ctx.Provider value={{ user, loading, login, logout }}>{children}</Ctx.Provider>;
}

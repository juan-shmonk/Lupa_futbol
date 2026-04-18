import { useState, useEffect } from 'react';
import { User, Lock, Shield, Save, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProfileForm { full_name: string; phone: string; city: string; state: string; }

const ROLE_LABELS: Record<string, string> = {
  admin_plataforma: 'Admin Plataforma',
  director_liga: 'Director de Liga',
  arbitro: 'Árbitro',
  jugador: 'Jugador',
};
const STATUS_LABELS: Record<string, string> = { active: 'Activo', pending: 'Pendiente', suspended: 'Suspendido' };
const STATUS_COLORS: Record<string, string> = { active: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', suspended: 'bg-red-100 text-red-700' };

export function Settings() {
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [profileForm, setProfileForm] = useState<ProfileForm>({ full_name: '', phone: '', city: '', state: '' });
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // Admin user management
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userMsg, setUserMsg] = useState('');

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setProfile(prof);
    setUserRole(prof?.role || '');
    setProfileForm({
      full_name: prof?.full_name || '',
      phone: prof?.phone || '',
      city: prof?.city || '',
      state: prof?.state || '',
    });
    if (prof?.role === 'admin_plataforma') fetchAllUsers();
  };

  const fetchAllUsers = async () => {
    setUsersLoading(true);
    const { data } = await supabase.from('profiles').select('id, full_name, email, role, status, city, created_at').order('created_at', { ascending: false });
    setAllUsers(data || []);
    setUsersLoading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    if (!profile?.id) return;
    const { error } = await supabase.from('profiles').update({
      full_name: profileForm.full_name,
      phone: profileForm.phone || null,
      city: profileForm.city || null,
      state: profileForm.state || null,
    }).eq('id', profile.id);

    if (!error) {
      setProfileMsg({ type: 'success', text: 'Perfil actualizado correctamente.' });
    } else {
      setProfileMsg({ type: 'error', text: error.message });
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwForm.new !== pwForm.confirm) { setPwMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' }); return; }
    if (pwForm.new.length < 6) { setPwMsg({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' }); return; }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.new });
    if (!error) {
      setPwMsg({ type: 'success', text: 'Contraseña actualizada correctamente.' });
      setPwForm({ current: '', new: '', confirm: '' });
    } else {
      setPwMsg({ type: 'error', text: error.message });
    }
    setChangingPw(false);
  };

  const handleChangeStatus = async (userId: string, newStatus: string) => {
    const { error } = await supabase.from('profiles').update({ status: newStatus }).eq('id', userId);
    if (!error) {
      await supabase.from('audit_logs').insert({ user_id: profile?.id, action: `set_status_${newStatus}`, table_name: 'profiles', record_id: userId }).catch(() => {});
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      setUserMsg(`Estado actualizado a "${STATUS_LABELS[newStatus]}"`);
      setTimeout(() => setUserMsg(''), 3000);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    if (!error) {
      await supabase.from('audit_logs').insert({ user_id: profile?.id, action: 'change_role', table_name: 'profiles', record_id: userId, new_value: newRole }).catch(() => {});
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role?.includes(userSearch.toLowerCase())
  );

  const Msg = ({ msg }: { msg: { type: string; text: string } | null }) => {
    if (!msg) return null;
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
        {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        {msg.text}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Configuración</h2>
        <p className="text-sm text-slate-500 mt-1">Administra tu cuenta y preferencias</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <User className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Información del Perfil</h3>
          {profile && (
            <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[profile.status] || 'bg-slate-100 text-slate-600'}`}>
              {ROLE_LABELS[profile.role] || profile.role}
            </span>
          )}
        </div>
        <div className="p-6">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
                <input required type="text"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={profileForm.full_name} onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
                <input type="email" disabled
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed"
                  value={profile?.email || ''} />
                <p className="text-xs text-slate-400 mt-1">El correo no puede cambiarse desde aquí</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input type="tel" placeholder="Ej: 55 1234 5678"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
                <input type="text" placeholder="Ej: León"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={profileForm.city} onChange={e => setProfileForm({ ...profileForm, city: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                <input type="text" placeholder="Ej: Guanajuato"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={profileForm.state} onChange={e => setProfileForm({ ...profileForm, state: e.target.value })} />
              </div>
            </div>
            <Msg msg={profileMsg} />
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <Lock className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Cambiar Contraseña</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { key: 'new' as const, label: 'Nueva contraseña' },
              { key: 'confirm' as const, label: 'Confirmar nueva contraseña' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <div className="relative">
                  <input type={showPw[key] ? 'text' : 'password'} placeholder="••••••••" required minLength={6}
                    className="w-full px-3 py-2.5 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={pwForm[key]} onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })} />
                  <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            <Msg msg={pwMsg} />
            <button type="submit" disabled={changingPw}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              <Lock className="w-4 h-4" /> {changingPw ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>

      {/* Admin: User Management */}
      {userRole === 'admin_plataforma' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-900">Gestión de Usuarios</h3>
              <span className="text-xs text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">{allUsers.length} usuarios</span>
            </div>
          </div>
          <div className="p-4">
            {userMsg && (
              <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4" /> {userMsg}
              </div>
            )}
            <input type="text" placeholder="Buscar por nombre, email o rol..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm mb-4"
              value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            {usersLoading ? (
              <div className="text-center py-8 text-slate-400">Cargando usuarios...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredUsers.map(u => (
                  <div key={u.id} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border ${u.status === 'suspended' ? 'bg-red-50 border-red-100' : u.status === 'pending' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${u.role === 'admin_plataforma' ? 'bg-red-500' : u.role === 'director_liga' ? 'bg-purple-500' : u.role === 'arbitro' ? 'bg-amber-500' : 'bg-green-500'}`}>
                        {u.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{u.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select value={u.role} onChange={e => handleChangeRole(u.id, e.target.value)}
                        disabled={u.id === profile?.id}
                        className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-40">
                        {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[u.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[u.status] || u.status}
                      </span>
                      {u.id !== profile?.id && (
                        <div className="flex gap-1">
                          {u.status !== 'active' && (
                            <button onClick={() => handleChangeStatus(u.id, 'active')}
                              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs transition-colors">
                              Activar
                            </button>
                          )}
                          {u.status !== 'suspended' && (
                            <button onClick={() => handleChangeStatus(u.id, 'suspended')}
                              className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors">
                              Suspender
                            </button>
                          )}
                          {u.status !== 'pending' && u.role === 'arbitro' && (
                            <button onClick={() => handleChangeStatus(u.id, 'pending')}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-xs transition-colors">
                              Pendiente
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-slate-400 py-6 text-sm">Sin resultados</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

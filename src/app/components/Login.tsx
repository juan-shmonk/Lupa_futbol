import { useState } from 'react';
import { Trophy, Mail, Lock, User, Phone, Key, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

type View = 'login' | 'role-select' | 'register-lider' | 'register-arbitro' | 'premium-code' | 'premium-register';

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

export function Login({ onLogin }: LoginProps) {
  const [view, setView] = useState<View>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  const [liderForm, setLiderForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '', phone: '', team_name: '',
  });

  const [arbitroForm, setArbitroForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '', phone: '',
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [premiumTeam, setPremiumTeam] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [premiumForm, setPremiumForm] = useState({
    roster_id: '', email: '', password: '', confirm_password: '',
  });

  const reset = (nextView: View) => { setError(''); setView(nextView); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });
    if (error) setError('Correo o contraseña incorrectos');
    else onLogin();
    setLoading(false);
  };

  const handleRegisterLider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (liderForm.password !== liderForm.confirm_password) { setError('Las contraseñas no coinciden'); return; }
    if (liderForm.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    if (!liderForm.team_name.trim()) { setError('El nombre del equipo es requerido'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email: liderForm.email,
      password: liderForm.password,
      options: {
        data: {
          full_name: liderForm.full_name,
          phone: liderForm.phone,
          role: 'lider_equipo',
          team_name_request: liderForm.team_name,
        },
      },
    });
    if (error) { setError(error.message); }
    else {
      alert('¡Solicitud enviada! Tu cuenta quedará pendiente de aprobación por el director de la liga.');
      reset('login');
    }
    setLoading(false);
  };

  const handleRegisterArbitro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (arbitroForm.password !== arbitroForm.confirm_password) { setError('Las contraseñas no coinciden'); return; }
    if (arbitroForm.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email: arbitroForm.email,
      password: arbitroForm.password,
      options: {
        data: {
          full_name: arbitroForm.full_name,
          phone: arbitroForm.phone,
          role: 'arbitro',
        },
      },
    });
    if (error) { setError(error.message); }
    else {
      alert('¡Solicitud enviada! Tu cuenta quedará pendiente de aprobación por el administrador.');
      reset('login');
    }
    setLoading(false);
  };

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) { setError('Ingresa el código de verificación'); return; }
    setLoading(true);
    setError('');
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('id, name, codigo_expira_en')
      .eq('codigo_verificacion', verificationCode.trim().toUpperCase())
      .eq('plan', 'premium')
      .single();

    if (teamErr || !team) {
      setError('Código inválido o no encontrado. Verifica que sea correcto.');
      setLoading(false);
      return;
    }
    if (new Date(team.codigo_expira_en) < new Date()) {
      setError('Este código ha expirado. Pide a tu líder que genere uno nuevo.');
      setLoading(false);
      return;
    }
    const { data: rosterData } = await supabase
      .from('team_roster')
      .select('id, nombre_completo, numero_jersey, posicion, profile_id')
      .eq('team_id', team.id)
      .order('nombre_completo');

    const available = (rosterData || []).filter(r => !r.profile_id);
    if (available.length === 0) {
      setError('No quedan jugadores disponibles en el roster de este equipo. Contacta a tu líder.');
      setLoading(false);
      return;
    }
    setPremiumTeam(team);
    setRoster(available);
    reset('premium-register');
    setLoading(false);
  };

  const handleRegisterPremium = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!premiumForm.roster_id) { setError('Selecciona tu nombre del roster'); return; }
    if (premiumForm.password !== premiumForm.confirm_password) { setError('Las contraseñas no coinciden'); return; }
    if (premiumForm.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    const selectedEntry = roster.find(r => r.id === premiumForm.roster_id);
    if (!selectedEntry) { setError('Selección inválida'); return; }
    setLoading(true);
    setError('');
    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email: premiumForm.email,
      password: premiumForm.password,
      options: {
        data: {
          full_name: selectedEntry.nombre_completo,
          role: 'jugador',
          status: 'active',
        },
      },
    });
    if (signUpErr || !authData.user) {
      setError(signUpErr?.message || 'Error al crear cuenta');
      setLoading(false);
      return;
    }
    const userId = authData.user.id;
    const { error: playerErr } = await supabase.from('players').insert({
      profile_id: userId,
      team_id: premiumTeam.id,
      position: selectedEntry.posicion || null,
      jersey_number: selectedEntry.numero_jersey || null,
    });
    if (playerErr) {
      setError('Error al asignarte al equipo: ' + playerErr.message);
      setLoading(false);
      return;
    }
    const { error: rosterErr } = await supabase.from('team_roster').update({ profile_id: userId }).eq('id', selectedEntry.id);
    if (rosterErr) {
      // El jugador quedó en players pero el roster no se vinculó — el líder lo verá como pendiente
      console.warn('team_roster link failed:', rosterErr.message);
    }
    alert(`¡Bienvenido, ${selectedEntry.nombre_completo}! Inicia sesión con tu correo y contraseña.`);
    reset('login');
    setLoading(false);
  };

  // ── VIEWS ──────────────────────────────────────────────────────────────────

  if (view === 'premium-register' && premiumTeam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Crear cuenta</h2>
            <p className="text-slate-500 text-sm mt-1">
              Equipo: <span className="font-semibold text-blue-600">{premiumTeam.name}</span>
            </p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleRegisterPremium} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">¿Cuál es tu nombre en el roster? *</label>
              <select required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={premiumForm.roster_id} onChange={e => setPremiumForm({ ...premiumForm, roster_id: e.target.value })}>
                <option value="">Selecciona tu nombre...</option>
                {roster.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.nombre_completo}{r.numero_jersey ? ` (#${r.numero_jersey})` : ''}{r.posicion ? ` — ${r.posicion}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={premiumForm.email} onChange={e => setPremiumForm({ ...premiumForm, email: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" required placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={premiumForm.password} onChange={e => setPremiumForm({ ...premiumForm, password: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" required placeholder="Repite tu contraseña"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={premiumForm.confirm_password} onChange={e => setPremiumForm({ ...premiumForm, confirm_password: e.target.value })} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
          <button onClick={() => reset('premium-code')} className="text-slate-500 hover:text-slate-700 text-sm text-center w-full mt-4">
            ← Cambiar código
          </button>
        </div>
      </div>
    );
  }

  if (view === 'premium-code') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
              <Key className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Jugador Premium</h2>
            <p className="text-slate-500 text-sm mt-1">Ingresa el código que te dio tu líder de equipo</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleValidateCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código de verificación</label>
              <input type="text" required placeholder="Ej: AB3X9KQ2" maxLength={8}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl font-mono tracking-widest uppercase"
                value={verificationCode} onChange={e => setVerificationCode(e.target.value.toUpperCase())} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Validando...' : 'Validar código'}
            </button>
          </form>
          <button onClick={() => reset('role-select')} className="text-slate-500 hover:text-slate-700 text-sm text-center w-full mt-4">
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  if (view === 'register-arbitro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-amber-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Registro de Árbitro</h2>
            <p className="text-slate-500 text-sm mt-1">Tu solicitud será revisada por el director</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleRegisterArbitro} className="space-y-4">
            {[
              { label: 'Nombre completo', key: 'full_name', type: 'text', icon: <User className="w-4 h-4 text-slate-400" />, placeholder: 'Tu nombre completo' },
              { label: 'Correo electrónico', key: 'email', type: 'email', icon: <Mail className="w-4 h-4 text-slate-400" />, placeholder: 'tu@correo.com' },
              { label: 'Teléfono', key: 'phone', type: 'tel', icon: <Phone className="w-4 h-4 text-slate-400" />, placeholder: 'Opcional' },
              { label: 'Contraseña', key: 'password', type: 'password', icon: <Lock className="w-4 h-4 text-slate-400" />, placeholder: 'Mínimo 6 caracteres' },
              { label: 'Confirmar contraseña', key: 'confirm_password', type: 'password', icon: <Lock className="w-4 h-4 text-slate-400" />, placeholder: 'Repite tu contraseña' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">{f.icon}</span>
                  <input type={f.type} required={f.key !== 'phone'} placeholder={f.placeholder}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    value={(arbitroForm as any)[f.key]} onChange={e => setArbitroForm({ ...arbitroForm, [f.key]: e.target.value })} />
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
            </button>
          </form>
          <button onClick={() => reset('role-select')} className="text-slate-500 hover:text-slate-700 text-sm text-center w-full mt-4">
            ← Cambiar tipo
          </button>
        </div>
      </div>
    );
  }

  if (view === 'register-lider') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-purple-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
              <Building className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Líder de Equipo</h2>
            <p className="text-slate-500 text-sm mt-1">El director validará tu solicitud y asignará un plan</p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleRegisterLider} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" required placeholder="Tu nombre completo"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={liderForm.full_name} onChange={e => setLiderForm({ ...liderForm, full_name: e.target.value })} /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del equipo *</label>
              <div className="relative"><Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" required placeholder="Ej: Tigres FC"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={liderForm.team_name} onChange={e => setLiderForm({ ...liderForm, team_name: e.target.value })} /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={liderForm.email} onChange={e => setLiderForm({ ...liderForm, email: e.target.value })} /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="tel" placeholder="Opcional"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={liderForm.phone} onChange={e => setLiderForm({ ...liderForm, phone: e.target.value })} /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" required placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={liderForm.password} onChange={e => setLiderForm({ ...liderForm, password: e.target.value })} /></div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" required placeholder="Repite tu contraseña"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={liderForm.confirm_password} onChange={e => setLiderForm({ ...liderForm, confirm_password: e.target.value })} /></div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Enviando solicitud...' : 'Enviar solicitud'}
            </button>
          </form>
          <button onClick={() => reset('role-select')} className="text-slate-500 hover:text-slate-700 text-sm text-center w-full mt-4">
            ← Cambiar tipo
          </button>
        </div>
      </div>
    );
  }

  if (view === 'role-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Trophy className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Lupa Fútbol</h1>
            <p className="text-green-100 text-lg">¿Cómo quieres registrarte?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => reset('register-lider')}
              className="bg-white p-8 rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1 group text-left">
              <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <Building className="w-8 h-8 text-purple-600 group-hover:text-white" />
              </div>
              <h3 className="text-slate-900 mb-2 text-center font-semibold">Líder de Equipo</h3>
              <p className="text-sm text-slate-600 text-center">Registra tu equipo. El director asigna tu plan (Estándar o Premium).</p>
            </button>
            <button onClick={() => reset('register-arbitro')}
              className="bg-white p-8 rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1 group text-left">
              <div className="w-16 h-16 bg-amber-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                <Trophy className="w-8 h-8 text-amber-600 group-hover:text-white" />
              </div>
              <h3 className="text-slate-900 mb-2 text-center font-semibold">Árbitro</h3>
              <p className="text-sm text-slate-600 text-center">Tu solicitud queda pendiente de aprobación por el administrador.</p>
            </button>
            <button onClick={() => { reset('premium-code'); setVerificationCode(''); }}
              className="bg-white p-8 rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1 group text-left">
              <div className="w-16 h-16 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <Key className="w-8 h-8 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-slate-900 mb-2 text-center font-semibold">Jugador Premium</h3>
              <p className="text-sm text-slate-600 text-center">Regístrate con el código que te dio tu líder de equipo.</p>
            </button>
          </div>
          <button onClick={() => reset('login')} className="text-white text-center w-full mt-6 hover:text-green-100">
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Lupa Fútbol</h1>
          <p className="text-slate-500 mt-1">Inicia sesión en tu cuenta</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="email" required placeholder="tu@correo.com"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate.400" />
              <input type="password" required placeholder="Tu contraseña"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => reset('role-select')} className="text-green-600 hover:text-green-700 text-sm font-medium">
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
      </div>
    </div>
  );
}

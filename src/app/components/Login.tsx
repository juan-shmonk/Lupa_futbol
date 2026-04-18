import { useState } from 'react';
import { Trophy, Mail, Lock, User, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [view, setView] = useState<'login' | 'register' | 'role-select'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<'jugador' | 'arbitro' | null>(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '', phone: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });
    if (error) {
      setError('Correo o contraseña incorrectos');
    } else {
      onLogin();
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) { setError('Selecciona un rol'); return; }
    if (registerForm.password !== registerForm.confirm_password) {
      setError('Las contraseñas no coinciden'); return;
    }
    if (registerForm.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres'); return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email: registerForm.email,
      password: registerForm.password,
      options: {
        data: {
          full_name: registerForm.full_name,
          phone: registerForm.phone,
          role: selectedRole,
        }
      }
    });
    if (error) {
      setError(error.message);
    } else {
      setError('');
      alert(
        selectedRole === 'jugador'
          ? '¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.'
          : '¡Registro enviado! Tu cuenta quedará pendiente de aprobación.'
      );
      setView('login');
    }
    setLoading(false);
  };

  if (view === 'role-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Trophy className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl text-white mb-2">Lupa Fútbol</h1>
            <p className="text-green-100 text-lg">¿Cómo quieres registrarte?</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => { setSelectedRole('jugador'); setView('register'); }}
              className="bg-white p-8 rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-16 h-16 bg-green-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                <User className="w-8 h-8 text-green-600 group-hover:text-white" />
              </div>
              <h3 className="text-slate-900 mb-2 text-center font-semibold">Jugador</h3>
              <p className="text-sm text-slate-600 text-center">
                Regístrate libremente. Tu cuenta se activa al confirmar tu correo.
              </p>
            </button>
            <button
              onClick={() => { setSelectedRole('arbitro'); setView('register'); }}
              className="bg-white p-8 rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                <Trophy className="w-8 h-8 text-amber-600 group-hover:text-white" />
              </div>
              <h3 className="text-slate-900 mb-2 text-center font-semibold">Árbitro</h3>
              <p className="text-sm text-slate-600 text-center">
                Tu solicitud queda pendiente de aprobación por el administrador.
              </p>
            </button>
          </div>
          <button onClick={() => setView('login')} className="text-white text-center w-full mt-6 hover:text-green-100">
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-green-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Crear cuenta</h2>
            <p className="text-slate-500 text-sm mt-1">
              Registro como <span className="font-semibold text-green-600 capitalize">{selectedRole}</span>
            </p>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" required placeholder="Tu nombre completo"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={registerForm.full_name}
                  onChange={e => setRegisterForm({...registerForm, full_name: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" required placeholder="tu@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={registerForm.email}
                  onChange={e => setRegisterForm({...registerForm, email: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="tel" placeholder="Opcional"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={registerForm.phone}
                  onChange={e => setRegisterForm({...registerForm, phone: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" required placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={registerForm.password}
                  onChange={e => setRegisterForm({...registerForm, password: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" required placeholder="Repite tu contraseña"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={registerForm.confirm_password}
                  onChange={e => setRegisterForm({...registerForm, confirm_password: e.target.value})} />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
          </form>
          <button onClick={() => setView('role-select')} className="text-slate-500 hover:text-slate-700 text-sm text-center w-full mt-4">
            ← Cambiar rol
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
                value={loginForm.email}
                onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" required placeholder="Tu contraseña"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50">
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setView('role-select')}
            className="text-green-600 hover:text-green-700 text-sm font-medium">
            ¿No tienes cuenta? Regístrate
          </button>
        </div>
      </div>
    </div>
  );
}
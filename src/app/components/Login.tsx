import { useState } from 'react';
import { Trophy, Mail, Lock, User, Phone, MapPin, Calendar } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
  const [view, setView] = useState<'login' | 'register' | 'role-select'>('login');
  const [selectedRole, setSelectedRole] = useState<'player' | 'referee' | 'manager' | null>(null);

  if (view === 'role-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Trophy className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-4xl text-white mb-2">FútbolPro</h1>
            <p className="text-green-100 text-lg">Selecciona tu rol en la plataforma</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                setSelectedRole('player');
                onLogin();
              }}
              className="bg-white p-8 rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-16 h-16 bg-green-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-green-500 transition-colors">
                <User className="w-8 h-8 text-green-600 group-hover:text-white" />
              </div>
              <h3 className="text-slate-900 mb-2">Jugador</h3>
              <p className="text-sm text-slate-600">
                Consulta tus estadísticas, historial de partidos y mejora tu reputación deportiva
              </p>
            </button>

            <button
              onClick={() => {
                setSelectedRole('referee');
                onLogin();
              }}
              className="bg-white p-8 rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                <Trophy className="w-8 h-8 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-slate-900 mb-2">Árbitro</h3>
              <p className="text-sm text-slate-600">
                Registra eventos de partidos, goles, tarjetas y mantén control del juego
              </p>
            </button>

            <button
              onClick={() => {
                setSelectedRole('manager');
                onLogin();
              }}
              className="bg-white p-8 rounded-2xl hover:shadow-2xl transition-all hover:-translate-y-1 group"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                <Calendar className="w-8 h-8 text-purple-600 group-hover:text-white" />
              </div>
              <h3 className="text-slate-900 mb-2">Encargado de Liga</h3>
              <p className="text-sm text-slate-600">
                Administra equipos, programa partidos y valida resultados oficiales
              </p>
            </button>
          </div>

          <button
            onClick={() => setView('login')}
            className="text-white text-center w-full mt-6 hover:text-green-100"
          >
            ← Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-slate-900 mb-2">Crear Cuenta</h2>
              <p className="text-sm text-slate-500">Únete a la comunidad de fútbol amateur</p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Juan Pérez García"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="55 1234 5678"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Ciudad</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <select className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option>Selecciona tu ciudad</option>
                    <option>CDMX</option>
                    <option>Guadalajara</option>
                    <option>Monterrey</option>
                    <option>León</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => setView('role-select')}
                className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Continuar
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setView('login')}
                className="text-sm text-slate-600 hover:text-green-600"
              >
                ¿Ya tienes cuenta? <span className="font-medium">Inicia sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl text-slate-900 mb-2">FútbolPro</h1>
            <p className="text-slate-500">Plataforma de Gestión de Fútbol Amateur</p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm text-slate-700 mb-2">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-slate-700 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-slate-600">Recordarme</span>
              </label>
              <button type="button" className="text-sm text-green-600 hover:text-green-700">
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <button
              type="button"
              onClick={onLogin}
              className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setView('register')}
              className="text-sm text-slate-600 hover:text-green-600"
            >
              ¿No tienes cuenta? <span className="font-medium">Regístrate aquí</span>
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              Sistema profesional de gestión para ligas de fútbol amateur en México
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

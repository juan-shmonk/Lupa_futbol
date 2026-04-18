import { User, Bell, Lock, Shield, Globe } from 'lucide-react';

export function Settings() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2>Configuración</h2>
        <p className="text-sm text-slate-500 mt-1">Administra tu cuenta y preferencias</p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <User className="w-5 h-5 text-slate-600" />
          <h3>Información del Perfil</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-2">Nombre Completo</label>
              <input
                type="text"
                defaultValue="Juan Pérez"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-2">Correo Electrónico</label>
              <input
                type="email"
                defaultValue="juan@ejemplo.com"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-2">Teléfono</label>
              <input
                type="tel"
                defaultValue="55 1234 5678"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-2">Ciudad</label>
              <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                <option>CDMX</option>
                <option>Guadalajara</option>
                <option>Monterrey</option>
                <option>León</option>
              </select>
            </div>
          </div>
          <button className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <Bell className="w-5 h-5 text-slate-600" />
          <h3>Notificaciones</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Recordatorios de Partidos</p>
              <p className="text-sm text-slate-500">Recibe notificaciones antes de cada partido</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-green-500 rounded" />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Actualizaciones de Rankings</p>
              <p className="text-sm text-slate-500">Notificaciones cuando cambies de posición</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-green-500 rounded" />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Solicitudes de Equipos</p>
              <p className="text-sm text-slate-500">Invitaciones para unirte a equipos</p>
            </div>
            <input type="checkbox" className="w-5 h-5 text-green-500 rounded" />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900">Comunicados de Liga</p>
              <p className="text-sm text-slate-500">Anuncios importantes de tu liga</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-green-500 rounded" />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <Lock className="w-5 h-5 text-slate-600" />
          <h3>Seguridad</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-2">Contraseña Actual</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-2">Nueva Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-2">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Actualizar Contraseña
          </button>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <Shield className="w-5 h-5 text-slate-600" />
          <h3>Privacidad</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Perfil Público</p>
              <p className="text-sm text-slate-500">Permite que otros jugadores vean tu perfil</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-green-500 rounded" />
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-100">
            <div>
              <p className="font-medium text-slate-900">Mostrar Estadísticas</p>
              <p className="text-sm text-slate-500">Visible en rankings públicos</p>
            </div>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-green-500 rounded" />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900">Contacto Directo</p>
              <p className="text-sm text-slate-500">Permite que equipos te contacten</p>
            </div>
            <input type="checkbox" className="w-5 h-5 text-green-500 rounded" />
          </div>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <Globe className="w-5 h-5 text-slate-600" />
          <h3>Preferencias de Sistema</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-2">Idioma</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option>Español (México)</option>
              <option>English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-2">Zona Horaria</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
              <option>GMT-6 (Ciudad de México)</option>
              <option>GMT-7 (Tijuana)</option>
              <option>GMT-5 (Cancún)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

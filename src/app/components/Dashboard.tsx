import { Users, Shield, Calendar, TrendingUp, Trophy, Award, Activity, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const statsData = [
  { id: 'ene-2026', month: 'Ene', partidos: 45, goles: 120 },
  { id: 'feb-2026', month: 'Feb', partidos: 52, goles: 145 },
  { id: 'mar-2026', month: 'Mar', partidos: 48, goles: 132 },
  { id: 'abr-2026', month: 'Abr', partidos: 38, goles: 95 },
];

export function Dashboard() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Jugadores Registrados</p>
              <h3 className="text-3xl mt-2">1,248</h3>
              <p className="text-sm text-green-600 mt-1">+12% este mes</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Equipos Activos</p>
              <h3 className="text-3xl mt-2">86</h3>
              <p className="text-sm text-green-600 mt-1">+5 nuevos</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Partidos Programados</p>
              <h3 className="text-3xl mt-2">38</h3>
              <p className="text-sm text-slate-500 mt-1">Próximos 7 días</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Partidos Finalizados</p>
              <h3 className="text-3xl mt-2">183</h3>
              <p className="text-sm text-green-600 mt-1">Esta temporada</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="mb-4">Actividad Mensual</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="partidos" fill="#22c55e" radius={[8, 8, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="mb-4">Tendencia de Goles</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={statsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Line type="monotone" dataKey="goles" stroke="#f59e0b" strokeWidth={3} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Players and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Scorers */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3>Goleadores Destacados</h3>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {[
              { name: 'Carlos Hernández', team: 'Tigres FC', goals: 18, avatar: 'CH' },
              { name: 'Miguel Ángel Torres', team: 'Real Unidos', goals: 15, avatar: 'MT' },
              { name: 'Javier Rodríguez', team: 'Deportivo León', goals: 14, avatar: 'JR' },
              { name: 'Luis Martínez', team: 'FC Guerreros', goals: 12, avatar: 'LM' },
            ].map((player, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                    {player.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{player.name}</p>
                    <p className="text-sm text-slate-500">{player.team}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{player.goals}</p>
                  <p className="text-xs text-slate-500">goles</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Referees */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3>Árbitros Mejor Calificados</h3>
            <Award className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-3">
            {[
              { name: 'Roberto Sánchez', matches: 42, rating: 4.8 },
              { name: 'Fernando López', matches: 38, rating: 4.7 },
              { name: 'Antonio Ramírez', matches: 35, rating: 4.6 },
              { name: 'Jorge Morales', matches: 31, rating: 4.5 },
            ].map((referee, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    {referee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{referee.name}</p>
                    <p className="text-sm text-slate-500">{referee.matches} partidos</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-slate-900">{referee.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-amber-900">Partidos Pendientes de Validación</h4>
            <p className="text-sm text-amber-700 mt-1">
              Hay 3 partidos esperando validación del encargado de liga. Revisa la sección de partidos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

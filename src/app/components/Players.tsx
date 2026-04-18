import { useState } from 'react';
import { Search, Filter, UserPlus, Eye, Edit, Trophy, Award, Target, TrendingUp, Calendar } from 'lucide-react';

const playersData = [
  { id: 1, name: 'Carlos Hernández', alias: 'El Tanque', position: 'Delantero', age: 28, team: 'Tigres FC', city: 'CDMX', matches: 45, goals: 18, yellowCards: 3, redCards: 0, reputation: 4.8, avatar: 'CH' },
  { id: 2, name: 'Miguel Ángel Torres', alias: 'Miguelito', position: 'Mediocampista', age: 25, team: 'Real Unidos', city: 'Guadalajara', matches: 42, goals: 15, yellowCards: 5, redCards: 1, reputation: 4.6, avatar: 'MT' },
  { id: 3, name: 'Javier Rodríguez', alias: 'El Jefe', position: 'Defensa', age: 30, team: 'Deportivo León', city: 'León', matches: 48, goals: 3, yellowCards: 8, redCards: 0, reputation: 4.7, avatar: 'JR' },
  { id: 4, name: 'Luis Martínez', alias: 'Luisito', position: 'Portero', age: 27, team: 'FC Guerreros', city: 'Monterrey', matches: 40, goals: 0, yellowCards: 2, redCards: 0, reputation: 4.9, avatar: 'LM' },
  { id: 5, name: 'Roberto Sánchez', alias: 'Beto', position: 'Delantero', age: 26, team: 'Águilas FC', city: 'CDMX', matches: 38, goals: 12, yellowCards: 4, redCards: 0, reputation: 4.5, avatar: 'RS' },
];

interface PlayersProps {
  onNavigate: (view: string, data?: any) => void;
}

export function Players({ onNavigate }: PlayersProps) {
  const [view, setView] = useState<'list' | 'profile'>('list');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const viewProfile = (player: any) => {
    setSelectedPlayer(player);
    setView('profile');
  };

  if (view === 'profile' && selectedPlayer) {
    return <PlayerProfile player={selectedPlayer} onBack={() => setView('list')} />;
  }

  const filteredPlayers = playersData.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>Jugadores Registrados</h2>
          <p className="text-sm text-slate-500 mt-1">Gestiona perfiles y estadísticas de jugadores</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <UserPlus className="w-5 h-5" />
          Nuevo Jugador
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, alias o equipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>Todas las posiciones</option>
            <option>Portero</option>
            <option>Defensa</option>
            <option>Mediocampista</option>
            <option>Delantero</option>
          </select>
          <select className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>Todas las ciudades</option>
            <option>CDMX</option>
            <option>Guadalajara</option>
            <option>Monterrey</option>
            <option>León</option>
          </select>
        </div>
      </div>

      {/* Players Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Jugador</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Posición</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Equipo</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Ciudad</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Partidos</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Goles</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Tarjetas</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Reputación</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                        {player.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{player.name}</p>
                        <p className="text-sm text-slate-500">{player.alias}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{player.position}</td>
                  <td className="px-6 py-4 text-slate-700">{player.team}</td>
                  <td className="px-6 py-4 text-slate-700">{player.city}</td>
                  <td className="px-6 py-4 text-center text-slate-900">{player.matches}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg">
                      <Target className="w-4 h-4" />
                      {player.goals}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-yellow-600">🟨 {player.yellowCards}</span>
                      <span className="text-red-600">🟥 {player.redCards}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium text-slate-900">{player.reputation}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => viewProfile(player)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                        <Edit className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Players Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {filteredPlayers.map((player) => (
          <div key={player.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                  {player.avatar}
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{player.name}</h4>
                  <p className="text-sm text-slate-500">{player.alias}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{player.reputation}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Trophy className="w-4 h-4" />
                {player.position}
              </div>
              <div className="text-slate-600">{player.team}</div>
              <div className="text-slate-600">{player.city}</div>
              <div className="flex items-center gap-2 text-green-600">
                <Target className="w-4 h-4" />
                {player.goals} goles
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => viewProfile(player)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                <Eye className="w-4 h-4" />
                Ver Perfil
              </button>
              <button className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700">
                <Edit className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerProfile({ player, onBack }: { player: any; onBack: () => void }) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <button onClick={onBack} className="text-slate-600 hover:text-slate-900 mb-4">
        ← Volver a jugadores
      </button>

      {/* Profile Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-3xl backdrop-blur-sm">
            {player.avatar}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-white">{player.name}</h2>
            <p className="text-green-100 mt-1">"{player.alias}"</p>
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center md:justify-start">
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
                <Trophy className="w-4 h-4" />
                {player.position}
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
                <Calendar className="w-4 h-4" />
                {player.age} años
              </div>
              <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-lg">
                <Award className="w-4 h-4" />
                {player.reputation} reputación
              </div>
            </div>
          </div>
          <button className="px-6 py-2 bg-white text-green-600 rounded-lg hover:bg-green-50">
            Editar Perfil
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <p className="text-sm text-slate-500">Partidos Jugados</p>
          <p className="text-3xl mt-2">{player.matches}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <p className="text-sm text-slate-500">Goles</p>
          <p className="text-3xl text-green-600 mt-2">{player.goals}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <p className="text-sm text-slate-500">Tarjetas Amarillas</p>
          <p className="text-3xl text-yellow-600 mt-2">{player.yellowCards}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
          <p className="text-sm text-slate-500">Tarjetas Rojas</p>
          <p className="text-3xl text-red-600 mt-2">{player.redCards}</p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="mb-4">Información Personal</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Nombre Completo:</span>
              <span className="font-medium">{player.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Alias:</span>
              <span className="font-medium">{player.alias}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Edad:</span>
              <span className="font-medium">{player.age} años</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Posición:</span>
              <span className="font-medium">{player.position}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-600">Equipo Actual:</span>
              <span className="font-medium">{player.team}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-600">Ciudad:</span>
              <span className="font-medium">{player.city}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="mb-4">Historial Reciente</h3>
          <div className="space-y-3">
            {[
              { date: '15 Abr 2026', vs: 'Real Unidos', result: 'V 3-1', goals: 2 },
              { date: '12 Abr 2026', vs: 'Deportivo León', result: 'E 2-2', goals: 1 },
              { date: '08 Abr 2026', vs: 'FC Guerreros', result: 'D 1-2', goals: 0 },
              { date: '05 Abr 2026', vs: 'Águilas FC', result: 'V 4-0', goals: 1 },
            ].map((match, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">vs {match.vs}</p>
                  <p className="text-sm text-slate-500">{match.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">{match.result}</p>
                  <p className="text-sm text-green-600">{match.goals} gol{match.goals !== 1 ? 'es' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reputation Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3>Reputación Deportiva</h3>
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            <span className="text-2xl font-bold">{player.reputation}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Puntualidad</p>
            <p className="text-xl mt-1">4.9</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Fair Play</p>
            <p className="text-xl mt-1">4.7</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-slate-600">Rendimiento</p>
            <p className="text-xl mt-1">4.8</p>
          </div>
        </div>
      </div>
    </div>
  );
}

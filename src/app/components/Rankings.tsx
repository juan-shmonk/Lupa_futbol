import { Trophy, TrendingUp, Award, Medal, Target, Star } from 'lucide-react';

const playersRanking = [
  { rank: 1, name: 'Carlos Hernández', team: 'Tigres FC', position: 'Delantero', goals: 18, matches: 45, avg: 0.40, reputation: 4.8 },
  { rank: 2, name: 'Miguel Ángel Torres', team: 'Real Unidos', position: 'Mediocampista', goals: 15, matches: 42, avg: 0.36, reputation: 4.6 },
  { rank: 3, name: 'Javier Rodríguez', team: 'Deportivo León', position: 'Defensa', goals: 14, matches: 48, avg: 0.29, reputation: 4.7 },
  { rank: 4, name: 'Luis Martínez', team: 'FC Guerreros', position: 'Delantero', goals: 12, matches: 40, avg: 0.30, reputation: 4.9 },
  { rank: 5, name: 'Roberto Sánchez', team: 'Águilas FC', position: 'Delantero', goals: 12, matches: 38, avg: 0.32, reputation: 4.5 },
];

const refereesRanking = [
  { rank: 1, name: 'Roberto Sánchez', matches: 42, rating: 4.8, punctuality: 4.9, fairness: 4.7, clarity: 4.8 },
  { rank: 2, name: 'Fernando López', matches: 38, rating: 4.7, punctuality: 4.8, fairness: 4.6, clarity: 4.7 },
  { rank: 3, name: 'Antonio Ramírez', matches: 35, rating: 4.6, punctuality: 4.5, fairness: 4.7, clarity: 4.6 },
  { rank: 4, name: 'Jorge Morales', matches: 31, rating: 4.5, punctuality: 4.6, fairness: 4.4, clarity: 4.5 },
];

const teamsRanking = [
  { rank: 1, name: 'Tigres FC', played: 24, won: 18, drawn: 4, lost: 2, gf: 56, ga: 18, gd: 38, points: 58 },
  { rank: 2, name: 'Real Unidos', played: 24, won: 16, drawn: 5, lost: 3, gf: 52, ga: 22, gd: 30, points: 53 },
  { rank: 3, name: 'Deportivo León', played: 24, won: 14, drawn: 6, lost: 4, gf: 48, ga: 25, gd: 23, points: 48 },
  { rank: 4, name: 'FC Guerreros', played: 24, won: 12, drawn: 7, lost: 5, gf: 42, ga: 28, gd: 14, points: 43 },
  { rank: 5, name: 'Águilas FC', played: 24, won: 10, drawn: 6, lost: 8, gf: 38, ga: 32, gd: 6, points: 36 },
];

export function Rankings() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2>Rankings y Estadísticas</h2>
        <p className="text-sm text-slate-500 mt-1">Rankings oficiales de jugadores, árbitros y equipos</p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg">
            Jugadores
          </button>
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
            Árbitros
          </button>
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
            Equipos
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
          <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option>Temporada 2026</option>
            <option>Temporada 2025</option>
          </select>
          <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option>Todas las ligas</option>
            <option>Liga Centro MX</option>
            <option>Liga Norte</option>
          </select>
          <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option>Todos los estados</option>
            <option>CDMX</option>
            <option>Jalisco</option>
            <option>Nuevo León</option>
          </select>
          <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
            <option>Todas las posiciones</option>
            <option>Portero</option>
            <option>Defensa</option>
            <option>Mediocampista</option>
            <option>Delantero</option>
          </select>
        </div>
      </div>

      {/* Players Ranking */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center gap-3">
          <Trophy className="w-6 h-6" />
          <h3 className="text-white">Ranking de Goleadores</h3>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Pos</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Jugador</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Equipo</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Posición</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Partidos</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Goles</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Promedio</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Reputación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {playersRanking.map((player) => (
                <tr key={player.rank} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {player.rank <= 3 ? (
                      <div className="flex items-center gap-2">
                        <Medal className={`w-6 h-6 ${
                          player.rank === 1 ? 'text-yellow-500' :
                          player.rank === 2 ? 'text-slate-400' :
                          'text-amber-600'
                        }`} />
                        <span className="font-bold">{player.rank}</span>
                      </div>
                    ) : (
                      <span className="font-medium text-slate-600">{player.rank}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{player.name}</td>
                  <td className="px-6 py-4 text-slate-700">{player.team}</td>
                  <td className="px-6 py-4 text-slate-700">{player.position}</td>
                  <td className="px-6 py-4 text-center text-slate-900">{player.matches}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg font-bold">
                      <Target className="w-4 h-4" />
                      {player.goals}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-900">{player.avg.toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{player.reputation}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden p-4 space-y-4">
          {playersRanking.map((player) => (
            <div key={player.rank} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {player.rank <= 3 && (
                    <Medal className={`w-6 h-6 ${
                      player.rank === 1 ? 'text-yellow-500' :
                      player.rank === 2 ? 'text-slate-400' :
                      'text-amber-600'
                    }`} />
                  )}
                  <div>
                    <p className="font-bold text-slate-900">#{player.rank} {player.name}</p>
                    <p className="text-sm text-slate-500">{player.team}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{player.reputation}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-sm text-slate-500">Partidos</p>
                  <p className="font-bold text-slate-900">{player.matches}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Goles</p>
                  <p className="font-bold text-green-600">{player.goals}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Promedio</p>
                  <p className="font-bold text-slate-900">{player.avg.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referees Ranking */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center gap-3">
          <Award className="w-6 h-6" />
          <h3 className="text-white">Ranking de Árbitros</h3>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Pos</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Árbitro</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Partidos</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Calificación</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Puntualidad</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Imparcialidad</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Claridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {refereesRanking.map((referee) => (
                <tr key={referee.rank} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    {referee.rank <= 3 ? (
                      <div className="flex items-center gap-2">
                        <Medal className={`w-6 h-6 ${
                          referee.rank === 1 ? 'text-yellow-500' :
                          referee.rank === 2 ? 'text-slate-400' :
                          'text-amber-600'
                        }`} />
                        <span className="font-bold">{referee.rank}</span>
                      </div>
                    ) : (
                      <span className="font-medium text-slate-600">{referee.rank}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{referee.name}</td>
                  <td className="px-6 py-4 text-center text-slate-900">{referee.matches}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold">
                      <Star className="w-4 h-4" />
                      {referee.rating}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-900">{referee.punctuality}</td>
                  <td className="px-6 py-4 text-center text-slate-900">{referee.fairness}</td>
                  <td className="px-6 py-4 text-center text-slate-900">{referee.clarity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden p-4 space-y-4">
          {refereesRanking.map((referee) => (
            <div key={referee.rank} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                {referee.rank <= 3 && (
                  <Medal className={`w-6 h-6 ${
                    referee.rank === 1 ? 'text-yellow-500' :
                    referee.rank === 2 ? 'text-slate-400' :
                    'text-amber-600'
                  }`} />
                )}
                <div className="flex-1">
                  <p className="font-bold text-slate-900">#{referee.rank} {referee.name}</p>
                  <p className="text-sm text-slate-500">{referee.matches} partidos</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-blue-500" />
                  <span className="font-bold text-lg">{referee.rating}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <p className="text-slate-500">Puntualidad</p>
                  <p className="font-medium">{referee.punctuality}</p>
                </div>
                <div>
                  <p className="text-slate-500">Imparcialidad</p>
                  <p className="font-medium">{referee.fairness}</p>
                </div>
                <div>
                  <p className="text-slate-500">Claridad</p>
                  <p className="font-medium">{referee.clarity}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teams Ranking */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white flex items-center gap-3">
          <TrendingUp className="w-6 h-6" />
          <h3 className="text-white">Tabla de Posiciones</h3>
        </div>

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Pos</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Equipo</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">PJ</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">PG</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">PE</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">PP</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">GF</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">GC</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">DG</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {teamsRanking.map((team) => (
                <tr key={team.rank} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-900">{team.rank}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{team.name}</td>
                  <td className="px-6 py-4 text-center text-slate-700">{team.played}</td>
                  <td className="px-6 py-4 text-center text-green-600">{team.won}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{team.drawn}</td>
                  <td className="px-6 py-4 text-center text-red-600">{team.lost}</td>
                  <td className="px-6 py-4 text-center text-slate-700">{team.gf}</td>
                  <td className="px-6 py-4 text-center text-slate-700">{team.ga}</td>
                  <td className="px-6 py-4 text-center text-slate-900">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold">
                      {team.points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden p-4 space-y-4">
          {teamsRanking.map((team) => (
            <div key={team.rank} className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">#{team.rank} {team.name}</p>
                  <p className="text-sm text-slate-500">{team.played} partidos jugados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{team.points}</p>
                  <p className="text-xs text-slate-500">puntos</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-sm">
                <div>
                  <p className="text-slate-500">PG</p>
                  <p className="font-medium text-green-600">{team.won}</p>
                </div>
                <div>
                  <p className="text-slate-500">PE</p>
                  <p className="font-medium">{team.drawn}</p>
                </div>
                <div>
                  <p className="text-slate-500">PP</p>
                  <p className="font-medium text-red-600">{team.lost}</p>
                </div>
                <div>
                  <p className="text-slate-500">GF</p>
                  <p className="font-medium">{team.gf}</p>
                </div>
                <div>
                  <p className="text-slate-500">GC</p>
                  <p className="font-medium">{team.ga}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-900">
          <strong>Nota:</strong> Los rankings se actualizan automáticamente después de cada partido validado por el encargado de liga.
        </p>
      </div>
    </div>
  );
}

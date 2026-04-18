import { useState } from 'react';
import { Shield, Users, Plus, Trophy, TrendingUp, Target } from 'lucide-react';

const teamsData = [
  { id: 1, name: 'Tigres FC', logo: '🐯', league: 'Liga Centro MX', manager: 'Juan Pérez', players: 18, played: 24, won: 18, drawn: 4, lost: 2, gf: 56, ga: 18, points: 58 },
  { id: 2, name: 'Real Unidos', logo: '⚡', league: 'Liga Centro MX', manager: 'Carlos Gómez', players: 20, played: 24, won: 16, drawn: 5, lost: 3, gf: 52, ga: 22, points: 53 },
  { id: 3, name: 'Deportivo León', logo: '🦁', league: 'Liga Centro MX', manager: 'Miguel Silva', players: 19, played: 24, won: 14, drawn: 6, lost: 4, gf: 48, ga: 25, points: 48 },
  { id: 4, name: 'FC Guerreros', logo: '⚔️', league: 'Liga Centro MX', manager: 'Roberto Díaz', players: 17, played: 24, won: 12, drawn: 7, lost: 5, gf: 42, ga: 28, points: 43 },
];

const squadPlayers = [
  { id: 1, name: 'Carlos Hernández', position: 'Delantero', number: 9, goals: 18, matches: 24 },
  { id: 2, name: 'Miguel Torres', position: 'Mediocampista', number: 10, goals: 8, matches: 24 },
  { id: 3, name: 'Javier Rodríguez', position: 'Defensa', number: 4, goals: 2, matches: 23 },
  { id: 4, name: 'Luis Martínez', position: 'Portero', number: 1, goals: 0, matches: 24 },
  { id: 5, name: 'Roberto Sánchez', position: 'Delantero', number: 11, goals: 12, matches: 22 },
];

export function Teams() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  if (view === 'detail' && selectedTeam) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <button onClick={() => setView('list')} className="text-slate-600 hover:text-slate-900 mb-4">
          ← Volver a equipos
        </button>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center text-4xl">
              {selectedTeam.logo}
            </div>
            <div>
              <h2 className="text-white">{selectedTeam.name}</h2>
              <p className="text-blue-100">{selectedTeam.league}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-blue-100 text-sm">Posición</p>
              <p className="text-2xl">1°</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-blue-100 text-sm">Puntos</p>
              <p className="text-2xl">{selectedTeam.points}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-blue-100 text-sm">Partidos</p>
              <p className="text-2xl">{selectedTeam.played}</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-blue-100 text-sm">Jugadores</p>
              <p className="text-2xl">{selectedTeam.players}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="mb-4">Estadísticas del Equipo</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Partidos Jugados</span>
                <span className="font-bold">{selectedTeam.played}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Victorias</span>
                <span className="font-bold text-green-600">{selectedTeam.won}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Empates</span>
                <span className="font-bold text-slate-600">{selectedTeam.drawn}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Derrotas</span>
                <span className="font-bold text-red-600">{selectedTeam.lost}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Goles a Favor</span>
                <span className="font-bold text-green-600">{selectedTeam.gf}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Goles en Contra</span>
                <span className="font-bold text-red-600">{selectedTeam.ga}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">Diferencia de Goles</span>
                <span className="font-bold text-green-600">+{selectedTeam.gf - selectedTeam.ga}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="mb-4">Información del Equipo</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Encargado</span>
                <span className="font-medium">{selectedTeam.manager}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Liga</span>
                <span className="font-medium">{selectedTeam.league}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Total de Jugadores</span>
                <span className="font-medium">{selectedTeam.players}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600">Puntos Totales</span>
                <span className="font-bold text-blue-600">{selectedTeam.points}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3>Plantilla de Jugadores</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              <Plus className="w-4 h-4" />
              Agregar Jugador
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm text-slate-600">#</th>
                  <th className="px-6 py-3 text-left text-sm text-slate-600">Jugador</th>
                  <th className="px-6 py-3 text-left text-sm text-slate-600">Posición</th>
                  <th className="px-6 py-3 text-center text-sm text-slate-600">Partidos</th>
                  <th className="px-6 py-3 text-center text-sm text-slate-600">Goles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {squadPlayers.map((player) => (
                  <tr key={player.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="w-8 h-8 bg-blue-100 rounded-full inline-flex items-center justify-center text-blue-700 font-bold text-sm">
                        {player.number}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{player.name}</td>
                    <td className="px-6 py-4 text-slate-700">{player.position}</td>
                    <td className="px-6 py-4 text-center text-slate-900">{player.matches}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded">
                        <Target className="w-4 h-4" />
                        {player.goals}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>Equipos</h2>
          <p className="text-sm text-slate-500 mt-1">Administra equipos y plantillas</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <Plus className="w-5 h-5" />
          Nuevo Equipo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamsData.map((team) => (
          <div key={team.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-3xl">
                {team.logo}
              </div>
              <div>
                <h3 className="text-slate-900">{team.name}</h3>
                <p className="text-sm text-slate-500">{team.league}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-sm text-slate-600">PJ</p>
                <p className="font-bold text-slate-900">{team.played}</p>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-slate-600">Pts</p>
                <p className="font-bold text-blue-600">{team.points}</p>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded-lg">
                <p className="text-sm text-slate-600">Jug</p>
                <p className="font-bold text-slate-900">{team.players}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-slate-100">
              <span className="text-slate-600">Encargado:</span>
              <span className="font-medium text-slate-900">{team.manager}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-center mb-4">
              <div>
                <p className="text-slate-500">Victorias</p>
                <p className="font-medium text-green-600">{team.won}</p>
              </div>
              <div>
                <p className="text-slate-500">Empates</p>
                <p className="font-medium text-slate-600">{team.drawn}</p>
              </div>
              <div>
                <p className="text-slate-500">Derrotas</p>
                <p className="font-medium text-red-600">{team.lost}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedTeam(team);
                setView('detail');
              }}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Ver Detalle
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

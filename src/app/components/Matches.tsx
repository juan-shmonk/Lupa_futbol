import { useState } from 'react';
import { Calendar, MapPin, Clock, Eye, Edit, CheckCircle, AlertCircle, Users, Target, UserX } from 'lucide-react';

const matchesData = [
  { id: 1, date: '2026-04-20', time: '16:00', field: 'Campo Municipal Norte', teamA: 'Tigres FC', teamB: 'Real Unidos', scoreA: null, scoreB: null, status: 'Programado', referee: 'Roberto Sánchez', validated: false },
  { id: 2, date: '2026-04-20', time: '18:00', field: 'Estadio La Cantera', teamA: 'Deportivo León', teamB: 'FC Guerreros', scoreA: null, scoreB: null, status: 'Programado', referee: 'Fernando López', validated: false },
  { id: 3, date: '2026-04-18', time: '16:00', field: 'Campo Central', teamA: 'Águilas FC', teamB: 'Tigres FC', scoreA: 2, scoreB: 3, status: 'Finalizado', referee: 'Roberto Sánchez', validated: false },
  { id: 4, date: '2026-04-17', time: '17:30', field: 'Campo Municipal Sur', teamA: 'Real Unidos', teamB: 'Deportivo León', scoreA: 2, scoreB: 2, status: 'Finalizado', referee: 'Antonio Ramírez', validated: true },
  { id: 5, date: '2026-04-15', time: '19:00', field: 'Estadio La Cantera', teamA: 'FC Guerreros', teamB: 'Águilas FC', scoreA: 1, scoreB: 2, status: 'Finalizado', referee: 'Jorge Morales', validated: true },
];

interface MatchesProps {
  onNavigate: (view: string) => void;
}

export function Matches({ onNavigate }: MatchesProps) {
  const [view, setView] = useState<'list' | 'detail' | 'referee-panel'>('list');
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'finished' | 'pending'>('all');

  const filteredMatches = matchesData.filter(match => {
    if (filter === 'upcoming') return match.status === 'Programado';
    if (filter === 'finished') return match.status === 'Finalizado';
    if (filter === 'pending') return match.status === 'Finalizado' && !match.validated;
    return true;
  });

  if (view === 'detail' && selectedMatch) {
    return <MatchDetail match={selectedMatch} onBack={() => setView('list')} />;
  }

  if (view === 'referee-panel' && selectedMatch) {
    return <RefereePanel match={selectedMatch} onBack={() => setView('list')} />;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>Gestión de Partidos</h2>
          <p className="text-sm text-slate-500 mt-1">Programa, registra y valida partidos</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <Calendar className="w-5 h-5" />
          Programar Partido
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-green-500 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg ${filter === 'upcoming' ? 'bg-green-500 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
        >
          Programados
        </button>
        <button
          onClick={() => setFilter('finished')}
          className={`px-4 py-2 rounded-lg ${filter === 'finished' ? 'bg-green-500 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
        >
          Finalizados
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-white border border-amber-300 text-amber-700'}`}
        >
          <AlertCircle className="w-4 h-4" />
          Pendientes Validación
        </button>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {filteredMatches.map((match) => (
          <div key={match.id} className="bg-white p-4 lg:p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    match.status === 'Programado' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {match.status}
                  </span>
                  {match.status === 'Finalizado' && !match.validated && (
                    <span className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Pendiente Validación
                    </span>
                  )}
                  {match.validated && (
                    <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Validado
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-4">
                  <div className="text-right md:text-right">
                    <p className="font-bold text-lg text-slate-900">{match.teamA}</p>
                  </div>
                  <div className="text-center">
                    {match.scoreA !== null ? (
                      <div className="text-3xl font-bold text-green-600">
                        {match.scoreA} - {match.scoreB}
                      </div>
                    ) : (
                      <div className="text-xl text-slate-400">VS</div>
                    )}
                  </div>
                  <div className="text-left md:text-left">
                    <p className="font-bold text-lg text-slate-900">{match.teamB}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(match.date).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {match.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {match.field}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {match.referee}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedMatch(match);
                    setView('detail');
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Eye className="w-4 h-4" />
                  Ver Detalle
                </button>
                {match.status === 'Programado' && (
                  <button
                    onClick={() => {
                      setSelectedMatch(match);
                      setView('referee-panel');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <Edit className="w-4 h-4" />
                    Registrar
                  </button>
                )}
                {match.status === 'Finalizado' && !match.validated && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                    <CheckCircle className="w-4 h-4" />
                    Validar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchDetail({ match, onBack }: { match: any; onBack: () => void }) {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <button onClick={onBack} className="text-slate-600 hover:text-slate-900 mb-4">
        ← Volver a partidos
      </button>

      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <h2>Detalle del Partido</h2>
          <span className={`px-4 py-2 rounded-lg ${
            match.status === 'Programado' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
          }`}>
            {match.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mb-6">
          <div className="text-center md:text-right">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto md:ml-auto md:mr-0 mb-3 flex items-center justify-center">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-slate-900">{match.teamA}</h3>
          </div>
          <div className="text-center">
            {match.scoreA !== null ? (
              <div className="text-5xl font-bold text-green-600">
                {match.scoreA} - {match.scoreB}
              </div>
            ) : (
              <div className="text-3xl text-slate-400">VS</div>
            )}
          </div>
          <div className="text-center md:text-left">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto md:mr-auto md:ml-0 mb-3 flex items-center justify-center">
              <Users className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-slate-900">{match.teamB}</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm text-slate-500">Fecha</p>
              <p className="font-medium">{new Date(match.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm text-slate-500">Hora</p>
              <p className="font-medium">{match.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm text-slate-500">Campo</p>
              <p className="font-medium">{match.field}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-sm text-slate-500">Árbitro</p>
              <p className="font-medium">{match.referee}</p>
            </div>
          </div>
        </div>
      </div>

      {match.status === 'Finalizado' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="mb-4">Eventos del Partido</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Gol - Carlos Hernández</p>
                    <p className="text-sm text-slate-500">{match.teamA}</p>
                  </div>
                </div>
                <span className="text-sm font-medium">15'</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-yellow-400 rounded" />
                  <div>
                    <p className="font-medium">Tarjeta Amarilla - Miguel Torres</p>
                    <p className="text-sm text-slate-500">{match.teamB}</p>
                  </div>
                </div>
                <span className="text-sm font-medium">32'</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Gol - Luis Martínez</p>
                    <p className="text-sm text-slate-500">{match.teamB}</p>
                  </div>
                </div>
                <span className="text-sm font-medium">58'</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200">
            <h3 className="mb-4">Historial de Validación</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900">Registro inicial</p>
                  <p className="text-sm text-slate-500">Por: Roberto Sánchez (Árbitro)</p>
                  <p className="text-xs text-slate-400">18 Abr 2026, 18:15</p>
                </div>
              </div>
              {match.validated && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Validado</p>
                    <p className="text-sm text-green-700">Por: Juan Pérez (Encargado)</p>
                    <p className="text-xs text-green-600">18 Abr 2026, 19:30</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RefereePanel({ match, onBack }: { match: any; onBack: () => void }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <button onClick={onBack} className="text-slate-600 hover:text-slate-900 mb-4">
        ← Volver a partidos
      </button>

      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-white mb-2">Panel del Árbitro</h2>
        <p className="text-blue-100">{match.teamA} vs {match.teamB}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Register Goal */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-green-600" />
            Registrar Gol
          </h3>
          <div className="space-y-3">
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg">
              <option>Seleccionar equipo</option>
              <option>{match.teamA}</option>
              <option>{match.teamB}</option>
            </select>
            <input
              type="text"
              placeholder="Nombre del jugador"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Minuto del gol"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
            <button className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
              Registrar Gol
            </button>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="mb-4 flex items-center gap-2">
            <UserX className="w-6 h-6 text-yellow-600" />
            Registrar Tarjeta
          </h3>
          <div className="space-y-3">
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg">
              <option>Tipo de tarjeta</option>
              <option>Tarjeta Amarilla</option>
              <option>Tarjeta Roja</option>
            </select>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg">
              <option>Seleccionar equipo</option>
              <option>{match.teamA}</option>
              <option>{match.teamB}</option>
            </select>
            <input
              type="text"
              placeholder="Nombre del jugador"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Minuto"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
            />
            <textarea
              placeholder="Motivo (opcional)"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              rows={2}
            />
            <button className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
              Registrar Tarjeta
            </button>
          </div>
        </div>
      </div>

      {/* Final Score */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h3 className="mb-4">Registrar Resultado Final</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-sm text-slate-600 mb-2">{match.teamA}</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-2xl font-bold"
            />
          </div>
          <div className="text-center text-3xl text-slate-400">-</div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">{match.teamB}</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-2xl font-bold"
            />
          </div>
        </div>
        <textarea
          placeholder="Observaciones del partido (opcional)"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg mt-4"
          rows={3}
        />
        <button className="w-full mt-4 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
          Finalizar y Guardar Partido
        </button>
      </div>
    </div>
  );
}

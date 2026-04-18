import { Trophy, Star, Award, TrendingUp } from 'lucide-react';

const refereesData = [
  { id: 1, name: 'Roberto Sánchez', league: 'Liga Centro MX', matches: 42, rating: 4.8, punctuality: 4.9, fairness: 4.7, clarity: 4.8, avatar: 'RS' },
  { id: 2, name: 'Fernando López', league: 'Liga Centro MX', matches: 38, rating: 4.7, punctuality: 4.8, fairness: 4.6, clarity: 4.7, avatar: 'FL' },
  { id: 3, name: 'Antonio Ramírez', league: 'Liga Norte', matches: 35, rating: 4.6, punctuality: 4.5, fairness: 4.7, clarity: 4.6, avatar: 'AR' },
  { id: 4, name: 'Jorge Morales', league: 'Liga Centro MX', matches: 31, rating: 4.5, punctuality: 4.6, fairness: 4.4, clarity: 4.5, avatar: 'JM' },
];

export function Referees() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2>Árbitros</h2>
          <p className="text-sm text-slate-500 mt-1">Gestión y calificación de árbitros</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
          <Trophy className="w-5 h-5" />
          Registrar Árbitro
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Árbitros Activos</p>
              <h3 className="text-3xl mt-2">24</h3>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Calificación Promedio</p>
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                <h3 className="text-3xl">4.7</h3>
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Partidos Arbitrados</p>
              <h3 className="text-3xl mt-2">146</h3>
              <p className="text-sm text-green-600 mt-1">Esta temporada</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Referees List - Desktop */}
      <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Árbitro</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Liga</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Partidos</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Calificación</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Puntualidad</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Imparcialidad</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Claridad</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {refereesData.map((referee) => (
                <tr key={referee.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        {referee.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{referee.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{referee.league}</td>
                  <td className="px-6 py-4 text-center text-slate-900">{referee.matches}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-slate-900">{referee.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded ${
                      referee.punctuality >= 4.7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {referee.punctuality}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded ${
                      referee.fairness >= 4.7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {referee.fairness}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded ${
                      referee.clarity >= 4.7 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {referee.clarity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                      Ver Perfil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Referees Cards - Mobile */}
      <div className="lg:hidden space-y-4">
        {refereesData.map((referee) => (
          <div key={referee.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                {referee.avatar}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-slate-900">{referee.name}</h4>
                <p className="text-sm text-slate-500">{referee.league}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-lg">{referee.rating}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4 text-center text-sm">
              <div>
                <p className="text-slate-500">Partidos</p>
                <p className="font-bold text-slate-900">{referee.matches}</p>
              </div>
              <div>
                <p className="text-slate-500">Puntualidad</p>
                <p className="font-bold text-green-600">{referee.punctuality}</p>
              </div>
              <div>
                <p className="text-slate-500">Imparcialidad</p>
                <p className="font-bold text-blue-600">{referee.fairness}</p>
              </div>
              <div>
                <p className="text-slate-500">Claridad</p>
                <p className="font-bold text-purple-600">{referee.clarity}</p>
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Ver Perfil Completo
            </button>
          </div>
        ))}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-blue-900 mb-2">Sistema de Calificación</h4>
        <p className="text-sm text-blue-800">
          Los árbitros son calificados por encargados de liga y jugadores en base a puntualidad, imparcialidad y claridad en sus decisiones. Las calificaciones son verificadas antes de reflejarse en el ranking oficial.
        </p>
      </div>
    </div>
  );
}

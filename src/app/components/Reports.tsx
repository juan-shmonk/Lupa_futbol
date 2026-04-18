import { FileText, Download, Calendar, Filter } from 'lucide-react';

export function Reports() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2>Reportes e Historial</h2>
        <p className="text-sm text-slate-500 mt-1">Consulta y exporta reportes detallados</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3>Filtros de Búsqueda</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-slate-700 mb-2">Tipo de Reporte</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg">
              <option>Historial de Partidos</option>
              <option>Estadísticas de Jugador</option>
              <option>Rendimiento de Equipo</option>
              <option>Actividad de Árbitros</option>
              <option>Historial Disciplinario</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-2">Desde</label>
            <input type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-2">Hasta</label>
            <input type="date" className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <button className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <FileText className="w-5 h-5" />
            Generar Reporte
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="text-slate-900 mb-2">Historial de Partidos</h4>
          <p className="text-sm text-slate-500 mb-4">Consulta el historial completo de partidos por jugador, equipo o liga</p>
          <button className="text-sm text-green-600 hover:text-green-700">Ver reporte →</button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <h4 className="text-slate-900 mb-2">Estadísticas Personales</h4>
          <p className="text-sm text-slate-500 mb-4">Revisa goles, tarjetas y rendimiento de cada jugador</p>
          <button className="text-sm text-blue-600 hover:text-blue-700">Ver reporte →</button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <h4 className="text-slate-900 mb-2">Historial Disciplinario</h4>
          <p className="text-sm text-slate-500 mb-4">Revisa tarjetas amarillas, rojas y sanciones por jugador</p>
          <button className="text-sm text-purple-600 hover:text-purple-700">Ver reporte →</button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-orange-600" />
          </div>
          <h4 className="text-slate-900 mb-2">Rendimiento de Equipos</h4>
          <p className="text-sm text-slate-500 mb-4">Analiza estadísticas completas de equipos y torneos</p>
          <button className="text-sm text-orange-600 hover:text-orange-700">Ver reporte →</button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-yellow-600" />
          </div>
          <h4 className="text-slate-900 mb-2">Actividad de Árbitros</h4>
          <p className="text-sm text-slate-500 mb-4">Consulta partidos arbitrados y calificaciones recibidas</p>
          <button className="text-sm text-yellow-600 hover:text-yellow-700">Ver reporte →</button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6 text-red-600" />
          </div>
          <h4 className="text-slate-900 mb-2">Reportes por Temporada</h4>
          <p className="text-sm text-slate-500 mb-4">Compara estadísticas entre diferentes temporadas</p>
          <button className="text-sm text-red-600 hover:text-red-700">Ver reporte →</button>
        </div>
      </div>

      {/* Example Report */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <h3>Vista Previa - Historial de Partidos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Fecha</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Partido</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Resultado</th>
                <th className="px-6 py-3 text-left text-sm text-slate-600">Árbitro</th>
                <th className="px-6 py-3 text-center text-sm text-slate-600">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[
                { date: '18 Abr 2026', match: 'Tigres FC vs Real Unidos', result: '3-1', referee: 'Roberto Sánchez', status: 'Validado' },
                { date: '17 Abr 2026', match: 'Deportivo León vs FC Guerreros', result: '2-2', referee: 'Fernando López', status: 'Validado' },
                { date: '15 Abr 2026', match: 'Águilas FC vs Tigres FC', result: '1-2', referee: 'Antonio Ramírez', status: 'Validado' },
              ].map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-700">{item.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{item.match}</td>
                  <td className="px-6 py-4 text-center font-bold text-green-600">{item.result}</td>
                  <td className="px-6 py-4 text-slate-700">{item.referee}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {item.status}
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

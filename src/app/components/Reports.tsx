import { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, Target, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ReportType = 'matches' | 'disciplinary' | 'referees';

interface MatchReport { id: string; scheduled_at: string; home_team: string; away_team: string; home_score: number | null; away_score: number | null; referee_name: string; status: string; }
interface DisciplinaryRecord { id: string; player_name: string; team_name: string; event_type: string; minute: number | null; match_date: string; match_teams: string; }
interface RefereeActivity { id: string; referee_name: string; total_matches: number; avg_score: number | null; total_ratings: number; }

export function Reports() {
  const [reportType, setReportType] = useState<ReportType>('matches');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [matchReports, setMatchReports] = useState<MatchReport[]>([]);
  const [disciplinary, setDisciplinary] = useState<DisciplinaryRecord[]>([]);
  const [refereeActivity, setRefereeActivity] = useState<RefereeActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => setUserRole(data?.role || ''));
    });
  }, []);

  const handleGenerate = async () => {
    setLoading(true);
    setGenerated(false);
    if (reportType === 'matches') await fetchMatchHistory();
    if (reportType === 'disciplinary') await fetchDisciplinary();
    if (reportType === 'referees') await fetchRefereeActivity();
    setGenerated(true);
    setLoading(false);
  };

  const fetchMatchHistory = async () => {
    let query = supabase
      .from('matches')
      .select('id, scheduled_at, status, home_score, away_score, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), referee:referees!matches_referee_id_fkey(profile:profiles(full_name))')
      .order('scheduled_at', { ascending: false });

    if (dateFrom) query = query.gte('scheduled_at', dateFrom);
    if (dateTo) query = query.lte('scheduled_at', dateTo + 'T23:59:59');

    const { data } = await query.limit(100);
    setMatchReports((data || []).map(m => ({
      id: m.id,
      scheduled_at: m.scheduled_at || '',
      home_team: (m.home_team as any)?.name || '—',
      away_team: (m.away_team as any)?.name || '—',
      home_score: m.home_score,
      away_score: m.away_score,
      referee_name: (m.referee as any)?.profile?.full_name || '—',
      status: m.status,
    })));
  };

  const fetchDisciplinary = async () => {
    let query = supabase
      .from('match_events')
      .select('id, event_type, minute, match_id, player:players(profile:profiles(full_name), team:teams(name)), match:matches(scheduled_at, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name))')
      .in('event_type', ['yellow_card', 'red_card'])
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

    const { data } = await query.limit(100);
    setDisciplinary((data || []).map(ev => ({
      id: ev.id,
      player_name: (ev.player as any)?.profile?.full_name || '—',
      team_name: (ev.player as any)?.team?.name || '—',
      event_type: ev.event_type,
      minute: ev.minute,
      match_date: (ev.match as any)?.scheduled_at || '',
      match_teams: `${(ev.match as any)?.home_team?.name || '—'} vs ${(ev.match as any)?.away_team?.name || '—'}`,
    })));
  };

  const fetchRefereeActivity = async () => {
    const { data: refs } = await supabase.from('referees').select('id, profile:profiles(full_name)');
    if (!refs) { setRefereeActivity([]); return; }

    const enriched = await Promise.all(refs.map(async r => {
      let matchQuery = supabase.from('matches').select('id', { count: 'exact', head: true }).eq('referee_id', r.id);
      if (dateFrom) matchQuery = matchQuery.gte('scheduled_at', dateFrom);
      if (dateTo) matchQuery = matchQuery.lte('scheduled_at', dateTo + 'T23:59:59');
      const { count } = await matchQuery;

      const { data: ratings } = await supabase.from('referee_ratings').select('score').eq('referee_id', r.id);
      const scores = (ratings || []).map(x => x.score);
      const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
      return { id: r.id, referee_name: (r.profile as any)?.full_name || '—', total_matches: count ?? 0, avg_score: avg, total_ratings: scores.length };
    }));
    setRefereeActivity(enriched.sort((a, b) => b.total_matches - a.total_matches));
  };

  const exportCSV = () => {
    let csv = '';
    let filename = '';
    if (reportType === 'matches') {
      csv = 'Fecha,Local,Visitante,Resultado,Árbitro,Estado\n' + matchReports.map(m =>
        `"${fmtDate(m.scheduled_at)}","${m.home_team}","${m.away_team}","${m.home_score !== null ? `${m.home_score}-${m.away_score}` : 'Sin resultado'}","${m.referee_name}","${m.status}"`
      ).join('\n');
      filename = 'historial_partidos.csv';
    } else if (reportType === 'disciplinary') {
      csv = 'Jugador,Equipo,Tipo,Minuto,Partido,Fecha\n' + disciplinary.map(d =>
        `"${d.player_name}","${d.team_name}","${d.event_type === 'yellow_card' ? 'Amarilla' : 'Roja'}","${d.minute ?? '—'}","${d.match_teams}","${fmtDate(d.match_date)}"`
      ).join('\n');
      filename = 'historial_disciplinario.csv';
    } else {
      csv = 'Árbitro,Partidos,Calificación Promedio,Reseñas\n' + refereeActivity.map(r =>
        `"${r.referee_name}","${r.total_matches}","${r.avg_score ?? '—'}","${r.total_ratings}"`
      ).join('\n');
      filename = 'actividad_arbitros.csv';
    }
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.click();
    URL.revokeObjectURL(url);
  };

  const STATUS_LABELS: Record<string, string> = { scheduled: 'Programado', in_progress: 'En Juego', finished: 'Finalizado', pending_validation: 'Pendiente Val.', validated: 'Validado', rejected: 'Rechazado' };
  const STATUS_COLORS: Record<string, string> = { scheduled: 'bg-blue-100 text-blue-700', in_progress: 'bg-amber-100 text-amber-700', pending_validation: 'bg-orange-100 text-orange-700', validated: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', finished: 'bg-slate-100 text-slate-600' };

  const fmtDate = (dt: string) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const reportTabs = [
    { key: 'matches', label: 'Historial de Partidos', icon: Calendar },
    { key: 'disciplinary', label: 'Historial Disciplinario', icon: AlertCircle },
    { key: 'referees', label: 'Actividad de Árbitros', icon: Target },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Reportes e Historial</h2>
        <p className="text-sm text-slate-500 mt-1">Consulta y exporta reportes detallados</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-900 text-sm">Configurar Reporte</h3>
        </div>

        {/* Type tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {reportTabs.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => { setReportType(key as ReportType); setGenerated(false); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${reportType === key ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
            <input type="date" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
            <input type="date" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
              value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm disabled:opacity-50">
            <FileText className="w-4 h-4" /> {loading ? 'Generando...' : 'Generar Reporte'}
          </button>
          {generated && (
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm">
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-10 text-slate-500">Generando reporte...</div>
      )}

      {generated && !loading && (
        <>
          {/* Match history */}
          {reportType === 'matches' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <h3 className="font-semibold text-slate-900">Historial de Partidos ({matchReports.length})</h3>
              </div>
              {matchReports.length === 0 ? (
                <div className="p-10 text-center text-slate-400">Sin partidos en el período seleccionado</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Fecha', 'Partido', 'Resultado', 'Árbitro', 'Estado'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {matchReports.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{fmtDate(m.scheduled_at)}</td>
                          <td className="px-5 py-3 font-medium text-slate-900">{m.home_team} vs {m.away_team}</td>
                          <td className="px-5 py-3 text-center font-bold text-green-600">
                            {m.home_score !== null ? `${m.home_score} — ${m.away_score}` : '—'}
                          </td>
                          <td className="px-5 py-3 text-slate-600">{m.referee_name}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[m.status] || 'bg-slate-100 text-slate-600'}`}>
                              {STATUS_LABELS[m.status] || m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Disciplinary */}
          {reportType === 'disciplinary' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900">Historial Disciplinario ({disciplinary.length} tarjetas)</h3>
              </div>
              {disciplinary.length === 0 ? (
                <div className="p-10 text-center text-slate-400">Sin tarjetas en el período seleccionado</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Jugador', 'Equipo', 'Tipo', 'Min', 'Partido', 'Fecha'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {disciplinary.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-medium text-slate-900">{d.player_name}</td>
                          <td className="px-5 py-3 text-slate-600">{d.team_name}</td>
                          <td className="px-5 py-3">
                            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit ${d.event_type === 'yellow_card' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              <div className={`w-3 h-4 rounded-sm ${d.event_type === 'yellow_card' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                              {d.event_type === 'yellow_card' ? 'Amarilla' : 'Roja'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-slate-600">{d.minute ? `${d.minute}'` : '—'}</td>
                          <td className="px-5 py-3 text-slate-600 text-xs">{d.match_teams}</td>
                          <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{fmtDate(d.match_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Referee activity */}
          {reportType === 'referees' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-slate-900">Actividad de Árbitros ({refereeActivity.length})</h3>
              </div>
              {refereeActivity.length === 0 ? (
                <div className="p-10 text-center text-slate-400">Sin actividad registrada</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['Árbitro', 'Partidos', 'Calificación Prom.', 'Reseñas'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {refereeActivity.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="px-5 py-3 font-medium text-slate-900">{r.referee_name}</td>
                          <td className="px-5 py-3 text-slate-700">{r.total_matches}</td>
                          <td className="px-5 py-3">
                            {r.avg_score ? (
                              <span className="flex items-center gap-1 text-yellow-600 font-medium">★ {r.avg_score}</span>
                            ) : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-5 py-3 text-slate-600">{r.total_ratings}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

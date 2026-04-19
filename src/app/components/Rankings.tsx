import { useState, useEffect } from 'react';
import { Trophy, Award, TrendingUp, Medal, Target, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Scorer {
  player_id: string;
  profile_id: string;
  full_name: string;
  team_name: string | null;
  position: string | null;
  goals: number;
  matches_played: number;
}

interface RefereeRanking {
  referee_id: string;
  full_name: string;
  total_matches: number;
  avg_score: number;
  total_ratings: number;
}

interface TeamRanking {
  team_id: string;
  name: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  ga: number;
  pts: number;
}

type Tab = 'players' | 'referees' | 'teams';

const medalColor = (rank: number) =>
  rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-slate-400' : 'text-amber-600';

export function Rankings() {
  const [tab, setTab] = useState<Tab>('players');
  const [scorers, setScorers] = useState<Scorer[]>([]);
  const [refereeRanks, setRefereeRanks] = useState<RefereeRanking[]>([]);
  const [teamRanks, setTeamRanks] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPosition, setFilterPosition] = useState('');
  const [loaded, setLoaded] = useState<Set<Tab>>(new Set());

  useEffect(() => {
    loadTab(tab);
  }, [tab]);

  const loadTab = async (t: Tab) => {
    if (loaded.has(t) && t !== 'referees') return;
    setLoading(true);
    if (t === 'players') await fetchScorers();
    if (t === 'referees') await fetchRefereeRankings();
    if (t === 'teams') await fetchTeamRankings();
    setLoaded(prev => new Set(prev).add(t));
    setLoading(false);
  };

  const fetchScorers = async () => {
    // Get all goal events from validated matches
    const { data: events } = await supabase
      .from('match_events')
      .select('player_id, match_id, matches!inner(status)')
      .eq('event_type', 'goal')
      .eq('matches.status', 'validated');

    if (!events || events.length === 0) { setScorers([]); return; }

    // Count goals per player
    const goalMap: Record<string, number> = {};
    const matchMap: Record<string, Set<string>> = {};
    events.forEach(ev => {
      goalMap[ev.player_id] = (goalMap[ev.player_id] || 0) + 1;
      if (!matchMap[ev.player_id]) matchMap[ev.player_id] = new Set();
      matchMap[ev.player_id].add(ev.match_id);
    });

    // Fetch player details
    const playerIds = Object.keys(goalMap);
    const { data: players } = await supabase
      .from('players')
      .select('id, profile_id, position, team_id, profile:profiles(id, full_name), team:teams(id, name)')
      .in('id', playerIds);

    const ranked: Scorer[] = (players || []).map(p => ({
      player_id: p.id,
      profile_id: p.profile_id,
      full_name: (p.profile as any)?.full_name || '—',
      team_name: (p.team as any)?.name || null,
      position: p.position,
      goals: goalMap[p.id] || 0,
      matches_played: matchMap[p.id]?.size || 0,
    })).sort((a, b) => b.goals - a.goals);

    setScorers(ranked);
  };

  const fetchRefereeRankings = async () => {
    // Fetch referee rows
    const { data: refs } = await supabase.from('referees').select('id, profile_id');
    if (!refs || refs.length === 0) { setRefereeRanks([]); return; }

    // Fetch profiles separately
    const profileIds = refs.map(r => r.profile_id).filter(Boolean);
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', profileIds);
    const profileMap: Record<string, string> = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p.full_name; });

    const enriched = await Promise.all(refs.map(async r => {
      const { data: ratings } = await supabase.from('referee_ratings').select('score').eq('referee_id', r.id);
      const { count } = await supabase.from('matches').select('id', { count: 'exact', head: true }).eq('referee_id', r.id).eq('status', 'validated');
      const scores = (ratings || []).map((x: any) => x.score);
      const avg = scores.length > 0 ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 10) / 10 : 0;
      return {
        referee_id: r.id,
        full_name: profileMap[r.profile_id] || '—',
        total_matches: count ?? 0,
        avg_score: avg,
        total_ratings: scores.length,
      } as RefereeRanking;
    }));

    setRefereeRanks(enriched.filter(r => r.total_ratings > 0).sort((a, b) => b.avg_score - a.avg_score));
  };

  const fetchTeamRankings = async () => {
    const { data: teams } = await supabase.from('teams').select('id, name').eq('status', 'active');
    if (!teams || teams.length === 0) { setTeamRanks([]); return; }

    const ranked = await Promise.all(teams.map(async t => {
      const [{ data: home }, { data: away }] = await Promise.all([
        supabase.from('matches').select('home_score, away_score').eq('home_team_id', t.id).eq('status', 'validated'),
        supabase.from('matches').select('home_score, away_score').eq('away_team_id', t.id).eq('status', 'validated'),
      ]);
      let pj = 0, pg = 0, pe = 0, pp = 0, gf = 0, ga = 0;
      (home || []).forEach(m => { if (m.home_score == null) return; pj++; gf += m.home_score; ga += m.away_score; if (m.home_score > m.away_score) pg++; else if (m.home_score === m.away_score) pe++; else pp++; });
      (away || []).forEach(m => { if (m.away_score == null) return; pj++; gf += m.away_score; ga += m.home_score; if (m.away_score > m.home_score) pg++; else if (m.home_score === m.away_score) pe++; else pp++; });
      return { team_id: t.id, name: t.name, pj, pg, pe, pp, gf, ga, pts: pg * 3 + pe };
    }));

    setTeamRanks(ranked.filter(t => t.pj > 0).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga)));
  };

  const filteredScorers = filterPosition
    ? scorers.filter(s => s.position === filterPosition)
    : scorers;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Rankings y Estadísticas</h2>
        <p className="text-sm text-slate-500 mt-1">Datos oficiales de partidos validados</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'players', label: 'Goleadores', icon: Target },
          { key: 'referees', label: 'Árbitros', icon: Award },
          { key: 'teams', label: 'Equipos', icon: TrendingUp },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${tab === key ? 'bg-green-500 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500">Calculando rankings...</div>
      ) : (
        <>
          {/* PLAYERS */}
          {tab === 'players' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6" />
                  <h3 className="text-white font-semibold">Ranking de Goleadores</h3>
                </div>
                <select className="bg-white/20 border border-white/30 text-white rounded-lg px-3 py-1.5 text-sm"
                  value={filterPosition} onChange={e => setFilterPosition(e.target.value)}>
                  <option value="">Todas las posiciones</option>
                  <option value="Portero">Portero</option>
                  <option value="Defensa">Defensa</option>
                  <option value="Mediocampista">Mediocampista</option>
                  <option value="Delantero">Delantero</option>
                </select>
              </div>
              {filteredScorers.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Target className="w-10 h-10 mx-auto mb-3" />
                  <p>Sin goles registrados en partidos validados</p>
                </div>
              ) : (
                <>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs text-slate-500 uppercase">Pos</th>
                          <th className="px-6 py-3 text-left text-xs text-slate-500 uppercase">Jugador</th>
                          <th className="px-6 py-3 text-left text-xs text-slate-500 uppercase">Equipo</th>
                          <th className="px-6 py-3 text-left text-xs text-slate-500 uppercase">Posición</th>
                          <th className="px-6 py-3 text-center text-xs text-slate-500 uppercase">PJ</th>
                          <th className="px-6 py-3 text-center text-xs text-slate-500 uppercase">Goles</th>
                          <th className="px-6 py-3 text-center text-xs text-slate-500 uppercase">Promedio</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredScorers.map((s, i) => (
                          <tr key={s.player_id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              {i < 3 ? <Medal className={`w-5 h-5 ${medalColor(i + 1)}`} /> : <span className="text-slate-500 font-medium">{i + 1}</span>}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900">{s.full_name}</td>
                            <td className="px-6 py-4 text-slate-600">{s.team_name || '—'}</td>
                            <td className="px-6 py-4">
                              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">{s.position || '—'}</span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-700">{s.matches_played}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg font-bold">
                                <Target className="w-3.5 h-3.5" /> {s.goals}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-700">
                              {s.matches_played > 0 ? (s.goals / s.matches_played).toFixed(2) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="lg:hidden p-4 space-y-3">
                    {filteredScorers.map((s, i) => (
                      <div key={s.player_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 text-center">
                          {i < 3 ? <Medal className={`w-5 h-5 mx-auto ${medalColor(i + 1)}`} /> : <span className="text-slate-500 font-medium">{i + 1}</span>}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{s.full_name}</p>
                          <p className="text-xs text-slate-500">{s.team_name || '—'} · {s.position || '—'}</p>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-green-600">
                          <Target className="w-4 h-4" /> {s.goals}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* REFEREES */}
          {tab === 'referees' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center gap-3">
                <Award className="w-6 h-6" />
                <h3 className="text-white font-semibold">Ranking de Árbitros</h3>
                <span className="text-blue-100 text-xs ml-1">(solo árbitros con calificaciones)</span>
              </div>
              {refereeRanks.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Star className="w-10 h-10 mx-auto mb-3" />
                  <p>Sin calificaciones registradas aún</p>
                </div>
              ) : (
                <>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs text-slate-500 uppercase">Pos</th>
                          <th className="px-6 py-3 text-left text-xs text-slate-500 uppercase">Árbitro</th>
                          <th className="px-6 py-3 text-center text-xs text-slate-500 uppercase">Partidos</th>
                          <th className="px-6 py-3 text-center text-xs text-slate-500 uppercase">Calificación</th>
                          <th className="px-6 py-3 text-center text-xs text-slate-500 uppercase">Reseñas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {refereeRanks.map((r, i) => (
                          <tr key={r.referee_id} className="hover:bg-slate-50">
                            <td className="px-6 py-4">
                              {i < 3 ? <Medal className={`w-5 h-5 ${medalColor(i + 1)}`} /> : <span className="text-slate-500 font-medium">{i + 1}</span>}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900">{r.full_name}</td>
                            <td className="px-6 py-4 text-center text-slate-700">{r.total_matches}</td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold">
                                <Star className="w-3.5 h-3.5 fill-blue-700" /> {r.avg_score}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center text-slate-600">{r.total_ratings}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="lg:hidden p-4 space-y-3">
                    {refereeRanks.map((r, i) => (
                      <div key={r.referee_id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 text-center">
                          {i < 3 ? <Medal className={`w-5 h-5 mx-auto ${medalColor(i + 1)}`} /> : <span className="text-slate-500 font-medium">{i + 1}</span>}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{r.full_name}</p>
                          <p className="text-xs text-slate-500">{r.total_matches} partidos · {r.total_ratings} reseñas</p>
                        </div>
                        <div className="flex items-center gap-1 font-bold text-blue-600">
                          <Star className="w-4 h-4 fill-blue-600" /> {r.avg_score}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TEAMS */}
          {tab === 'teams' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                <h3 className="text-white font-semibold">Tabla de Posiciones</h3>
                <span className="text-purple-100 text-xs ml-1">(partidos validados)</span>
              </div>
              {teamRanks.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3" />
                  <p>Sin partidos validados aún</p>
                </div>
              ) : (
                <>
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {['Pos', 'Equipo', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts'].map(h => (
                            <th key={h} className={`px-4 py-3 text-xs text-slate-500 uppercase ${h === 'Equipo' ? 'text-left' : 'text-center'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {teamRanks.map((t, i) => {
                          const dg = t.gf - t.ga;
                          return (
                            <tr key={t.team_id} className={`hover:bg-slate-50 ${i === 0 ? 'bg-yellow-50/40' : ''}`}>
                              <td className="px-4 py-4 text-center">
                                {i < 3 ? <Medal className={`w-5 h-5 mx-auto ${medalColor(i + 1)}`} /> : <span className="text-slate-500">{i + 1}</span>}
                              </td>
                              <td className="px-4 py-4 font-semibold text-slate-900">{t.name}</td>
                              <td className="px-4 py-4 text-center text-slate-700">{t.pj}</td>
                              <td className="px-4 py-4 text-center text-green-600 font-medium">{t.pg}</td>
                              <td className="px-4 py-4 text-center text-slate-600">{t.pe}</td>
                              <td className="px-4 py-4 text-center text-red-500">{t.pp}</td>
                              <td className="px-4 py-4 text-center text-slate-700">{t.gf}</td>
                              <td className="px-4 py-4 text-center text-slate-700">{t.ga}</td>
                              <td className="px-4 py-4 text-center font-medium">{dg > 0 ? `+${dg}` : dg}</td>
                              <td className="px-4 py-4 text-center">
                                <span className="inline-flex px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-bold">{t.pts}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="lg:hidden p-4 space-y-3">
                    {teamRanks.map((t, i) => (
                      <div key={t.team_id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {i < 3 ? <Medal className={`w-5 h-5 ${medalColor(i + 1)}`} /> : <span className="text-slate-400 font-medium">{i + 1}</span>}
                            <span className="font-semibold text-slate-900">{t.name}</span>
                          </div>
                          <span className="text-2xl font-bold text-purple-600">{t.pts} pts</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1 text-center text-xs">
                          {[['PJ', t.pj], ['PG', t.pg], ['PE', t.pe], ['PP', t.pp], ['DG', t.gf - t.ga]].map(([k, v]) => (
                            <div key={k}>
                              <p className="text-slate-400">{k}</p>
                              <p className={`font-medium ${k === 'PG' ? 'text-green-600' : k === 'PP' ? 'text-red-500' : 'text-slate-700'}`}>{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <strong>Nota:</strong> Los rankings se actualizan con datos de partidos con estado <em>Validado</em> por el director de liga.
      </div>
    </div>
  );
}

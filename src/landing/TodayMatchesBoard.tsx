import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Activity, ChevronRight, RefreshCw } from 'lucide-react';

interface MatchRow {
  id: string;
  scheduled_at: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  field_name: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  league_id: string | null;
}

interface EnrichedMatch extends MatchRow {
  homeTeamName: string;
  awayTeamName: string;
  leagueName: string;
}

interface LeagueGroup {
  leagueId: string;
  leagueName: string;
  matches: EnrichedMatch[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string; dot?: boolean }> = {
  scheduled:          { label: 'Programado',  className: 'bg-slate-100 text-slate-600' },
  in_progress:        { label: 'En Vivo',     className: 'bg-green-100 text-green-700', dot: true },
  finished:           { label: 'Finalizado',  className: 'bg-blue-100 text-blue-700' },
  pending_validation: { label: 'Finalizado',  className: 'bg-blue-100 text-blue-700' },
  validated:          { label: 'Oficial',     className: 'bg-emerald-100 text-emerald-700' },
  rejected:           { label: 'Rechazado',   className: 'bg-red-100 text-red-600' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}>
      {cfg.dot && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      {cfg.label}
    </span>
  );
}

function MatchCard({ match }: { match: EnrichedMatch }) {
  const isLive    = match.status === 'in_progress';
  const hasScore  = match.home_score !== null && match.away_score !== null;
  const showScore = hasScore && match.status !== 'scheduled';

  const time = match.scheduled_at
    ? new Date(match.scheduled_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`rounded-xl border bg-white p-4 transition-shadow hover:shadow-md ${
      isLive ? 'border-green-300 ring-1 ring-green-200' : 'border-slate-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <StatusBadge status={match.status} />
        {time && (
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />{time}
          </span>
        )}
      </div>

      {/* Teams & Score */}
      <div className="flex items-center gap-3">
        {/* Home */}
        <div className="flex-1 text-right">
          <p className="text-sm font-semibold text-slate-900 leading-tight">{match.homeTeamName}</p>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {showScore ? (
            <>
              <span className={`text-2xl font-bold tabular-nums ${isLive ? 'text-green-700' : 'text-slate-900'}`}>
                {match.home_score}
              </span>
              <span className="text-slate-400 font-light text-lg">–</span>
              <span className={`text-2xl font-bold tabular-nums ${isLive ? 'text-green-700' : 'text-slate-900'}`}>
                {match.away_score}
              </span>
            </>
          ) : (
            <span className="text-slate-400 text-sm font-medium px-1">vs</span>
          )}
        </div>

        {/* Away */}
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 leading-tight">{match.awayTeamName}</p>
        </div>
      </div>

      {/* Field */}
      {match.field_name && (
        <p className="text-xs text-slate-400 text-center mt-2 truncate">{match.field_name}</p>
      )}
    </div>
  );
}

export default function TodayMatchesBoard({ onEnterApp }: { onEnterApp: () => void }) {
  const [leagueGroups, setLeagueGroups] = useState<LeagueGroup[]>([]);
  const [activeLeague, setActiveLeague] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      // Today's date window
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // Fetch matches for today (any status except rejected)
      const { data: matches, error: mErr } = await supabase
        .from('matches')
        .select('id, scheduled_at, status, home_score, away_score, field_name, home_team_id, away_team_id, league_id')
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString())
        .neq('status', 'rejected')
        .order('scheduled_at', { ascending: true });

      if (mErr || !matches || matches.length === 0) {
        setLeagueGroups([]);
        setLoading(false);
        setLastUpdated(new Date());
        return;
      }

      // Collect unique team ids and league ids
      const teamIds = [...new Set([
        ...matches.map(m => m.home_team_id).filter(Boolean),
        ...matches.map(m => m.away_team_id).filter(Boolean),
      ])] as string[];

      const leagueIds = [...new Set(matches.map(m => m.league_id).filter(Boolean))] as string[];

      // Parallel fetches
      const [{ data: teams }, { data: leagues }] = await Promise.all([
        supabase.from('teams').select('id, name').in('id', teamIds),
        supabase.from('leagues').select('id, name').in('id', leagueIds),
      ]);

      const teamMap = new Map((teams ?? []).map(t => [t.id, t.name]));
      const leagueMap = new Map((leagues ?? []).map(l => [l.id, l.name]));

      // Enrich matches
      const enriched: EnrichedMatch[] = matches.map(m => ({
        ...m,
        homeTeamName: teamMap.get(m.home_team_id ?? '') ?? 'Equipo local',
        awayTeamName: teamMap.get(m.away_team_id ?? '') ?? 'Equipo visitante',
        leagueName:   leagueMap.get(m.league_id ?? '') ?? 'Sin liga',
      }));

      // Group by league
      const grouped = new Map<string, LeagueGroup>();
      for (const match of enriched) {
        const key = match.league_id ?? 'sin-liga';
        if (!grouped.has(key)) {
          grouped.set(key, { leagueId: key, leagueName: match.leagueName, matches: [] });
        }
        grouped.get(key)!.matches.push(match);
      }

      const groups = Array.from(grouped.values());
      setLeagueGroups(groups);

      // Auto-select first league with live match, else first league
      const liveGroup = groups.find(g => g.matches.some(m => m.status === 'in_progress'));
      if (liveGroup && activeLeague === 'all') {
        setActiveLeague(liveGroup.leagueId);
      }
    } catch {
      setLeagueGroups([]);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh every 60 seconds for live matches
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  const visibleMatches =
    activeLeague === 'all'
      ? leagueGroups.flatMap(g => g.matches)
      : leagueGroups.find(g => g.leagueId === activeLeague)?.matches ?? [];

  const liveCount = leagueGroups.flatMap(g => g.matches).filter(m => m.status === 'in_progress').length;

  return (
    <section id="partidos-hoy" className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-green-400" />
              <span className="text-green-400 text-sm font-semibold uppercase tracking-wider">Hoy</span>
              {liveCount > 0 && (
                <span className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  <Activity className="w-3 h-3" />
                  {liveCount} en vivo
                </span>
              )}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Tablero de Partidos</h2>
            <p className="text-slate-400 mt-1">Resultados y partidos del día, actualizados en tiempo real</p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-500">
                Actualizado {lastUpdated.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* League tabs */}
        {leagueGroups.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveLeague('all')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeLeague === 'all'
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              Todas las ligas
              <span className="ml-1.5 text-xs opacity-70">
                ({leagueGroups.reduce((acc, g) => acc + g.matches.length, 0)})
              </span>
            </button>
            {leagueGroups.map(g => {
              const hasLive = g.matches.some(m => m.status === 'in_progress');
              return (
                <button
                  key={g.leagueId}
                  onClick={() => setActiveLeague(g.leagueId)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                    activeLeague === g.leagueId
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {hasLive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                  {g.leagueName}
                  <span className="text-xs opacity-70">({g.matches.length})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-700 bg-slate-800 p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-24 mb-3" />
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-5 bg-slate-700 rounded" />
                  <div className="h-8 w-12 bg-slate-700 rounded" />
                  <div className="flex-1 h-5 bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleMatches.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-slate-800 bg-slate-800/50">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">No hay partidos programados para hoy</p>
            <p className="text-slate-600 text-sm mt-1">Los partidos aparecerán aquí cuando sean registrados en la plataforma</p>
            <button
              onClick={onEnterApp}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-lg text-sm transition-colors"
            >
              Registrar mi liga <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {/* Footer link */}
        {!loading && visibleMatches.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={onEnterApp}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors border border-slate-700"
            >
              Ver todos los partidos en la plataforma <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

import { useState, useEffect } from 'react';
import { Shield, Plus, ArrowLeft, Save, UserMinus, Search, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Profile { id: string; full_name: string; email: string; }
interface League { id: string; name: string; }
interface Team {
  id: string;
  name: string;
  league_id: string | null;
  manager_id: string | null;
  city: string | null;
  status: string;
  league: League | null;
  manager: Profile | null;
  player_count: number;
}
interface Player {
  id: string;
  team_id: string | null;
  position: string | null;
  jersey_number: number | null;
  profile: Profile | null;
}

const initials = (name: string) =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

export function Teams() {
  const [view, setView] = useState<'list' | 'detail' | 'create'>('list');
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [squad, setSquad] = useState<Player[]>([]);
  const [available, setAvailable] = useState<Player[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [searchPlayer, setSearchPlayer] = useState('');
  const [matchStats, setMatchStats] = useState({ pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, ga: 0, pts: 0 });
  const [form, setForm] = useState({ name: '', league_id: '', city: '', status: 'active' });
  const [error, setError] = useState('');

  useEffect(() => {
    loadInit();
  }, []);

  const loadInit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setCurrentProfile(profile);
    setUserRole(profile?.role || '');
    await Promise.all([fetchTeams(), fetchLeagues()]);
  };

  const fetchTeams = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('*, league:leagues(id, name), manager:profiles!teams_manager_id_fkey(id, full_name, email)')
      .order('name');

    if (error) {
      // fallback without FK hint
      const { data: d2 } = await supabase.from('teams').select('*, league:leagues(id, name)').order('name');
      const rows = d2 || [];
      const withCount = await Promise.all(rows.map(async t => {
        const { count } = await supabase.from('players').select('id', { count: 'exact', head: true }).eq('team_id', t.id);
        return { ...t, manager: null, player_count: count ?? 0 };
      }));
      setTeams(withCount as Team[]);
    } else {
      const rows = data || [];
      const withCount = await Promise.all(rows.map(async t => {
        const { count } = await supabase.from('players').select('id', { count: 'exact', head: true }).eq('team_id', t.id);
        return { ...t, player_count: count ?? 0 };
      }));
      setTeams(withCount as Team[]);
    }
    setLoading(false);
  };

  const fetchLeagues = async () => {
    const { data } = await supabase.from('leagues').select('id, name').order('name');
    setLeagues(data || []);
  };

  const fetchTeamDetail = async (teamId: string) => {
    const [{ data: sq }, { data: av }] = await Promise.all([
      supabase.from('players').select('*, profile:profiles(id, full_name, email)').eq('team_id', teamId),
      supabase.from('players').select('*, profile:profiles(id, full_name, email)').is('team_id', null),
    ]);
    setSquad(sq || []);
    setAvailable(av || []);

    const [{ data: home }, { data: away }] = await Promise.all([
      supabase.from('matches').select('home_score, away_score').eq('home_team_id', teamId).eq('status', 'validated'),
      supabase.from('matches').select('home_score, away_score').eq('away_team_id', teamId).eq('status', 'validated'),
    ]);
    let pj = 0, pg = 0, pe = 0, pp = 0, gf = 0, ga = 0;
    (home || []).forEach(m => {
      if (m.home_score == null) return;
      pj++; gf += m.home_score; ga += m.away_score;
      if (m.home_score > m.away_score) pg++;
      else if (m.home_score === m.away_score) pe++;
      else pp++;
    });
    (away || []).forEach(m => {
      if (m.away_score == null) return;
      pj++; gf += m.away_score; ga += m.home_score;
      if (m.away_score > m.home_score) pg++;
      else if (m.home_score === m.away_score) pe++;
      else pp++;
    });
    setMatchStats({ pj, pg, pe, pp, gf, ga, pts: pg * 3 + pe });
  };

  const openDetail = async (team: Team) => {
    setSelectedTeam(team);
    setSearchPlayer('');
    await fetchTeamDetail(team.id);
    setView('detail');
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const { data, error: err } = await supabase
      .from('teams')
      .insert({ name: form.name, league_id: form.league_id || null, manager_id: currentProfile?.id, city: form.city || null, status: form.status })
      .select().single();
    if (!err && data) {
      await supabase.from('audit_logs').insert({ user_id: currentProfile?.id, action: 'create_team', table_name: 'teams', record_id: data.id, new_value: form.name }).catch(() => {});
      setForm({ name: '', league_id: '', city: '', status: 'active' });
      await fetchTeams();
      setView('list');
    } else {
      setError(err?.message || 'Error al crear equipo');
    }
    setSaving(false);
  };

  const handleAssignPlayer = async (playerId: string) => {
    if (!selectedTeam) return;
    const { error: err } = await supabase.from('players').update({ team_id: selectedTeam.id }).eq('id', playerId);
    if (!err) await fetchTeamDetail(selectedTeam.id);
    else alert('Error: ' + err.message);
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!selectedTeam) return;
    const { error: err } = await supabase.from('players').update({ team_id: null }).eq('id', playerId);
    if (!err) await fetchTeamDetail(selectedTeam.id);
    else alert('Error: ' + err.message);
  };

  const canManage = userRole === 'admin_plataforma' || userRole === 'director_liga';
  const filteredAvailable = available.filter(p =>
    p.profile?.full_name?.toLowerCase().includes(searchPlayer.toLowerCase())
  );

  // ── CREATE ──
  if (view === 'create') {
    return (
      <div className="p-4 lg:p-6 max-w-xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Nuevo Equipo</h2>
          {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <form onSubmit={handleCreateTeam} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del equipo *</label>
              <input required type="text" placeholder="Ej: Tigres FC"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Liga</label>
              <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.league_id} onChange={e => setForm({ ...form, league_id: e.target.value })}>
                <option value="">Sin liga asignada</option>
                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
              <input type="text" placeholder="Ej: León, Guanajuato"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado inicial</label>
              <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Crear Equipo'}
              </button>
              <button type="button" onClick={() => setView('list')}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── DETAIL ──
  if (view === 'detail' && selectedTeam) {
    const t = selectedTeam;
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Volver a equipos
        </button>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{t.name}</h2>
              <p className="text-green-100">{t.league?.name || 'Sin liga'}</p>
              {t.city && <p className="text-green-100 text-sm">{t.city}</p>}
              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${t.status === 'active' ? 'bg-white/20' : 'bg-white/10 line-through'}`}>
                {t.status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Partidos Jugados', value: matchStats.pj },
            { label: 'Puntos', value: matchStats.pts },
            { label: 'V / E / D', value: `${matchStats.pg}/${matchStats.pe}/${matchStats.pp}` },
            { label: 'Jugadores', value: squad.length },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {matchStats.pj > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Estadísticas de goles (partidos validados)</h3>
            <div className="flex gap-6 text-sm">
              <span><span className="font-bold text-green-600">{matchStats.gf}</span> a favor</span>
              <span><span className="font-bold text-red-500">{matchStats.ga}</span> en contra</span>
              <span><span className="font-bold">{matchStats.gf - matchStats.ga > 0 ? '+' : ''}{matchStats.gf - matchStats.ga}</span> diferencia</span>
            </div>
          </div>
        )}

        {/* Squad */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4" /> Plantilla ({squad.length} jugadores)
            </h3>
          </div>
          {squad.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Sin jugadores asignados aún</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-wide">#</th>
                    <th className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-wide">Jugador</th>
                    <th className="px-5 py-3 text-left text-xs text-slate-500 uppercase tracking-wide">Posición</th>
                    {canManage && <th className="px-5 py-3 text-center text-xs text-slate-500 uppercase tracking-wide">Acción</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {squad.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <span className="w-8 h-8 bg-green-100 rounded-full inline-flex items-center justify-center text-green-700 text-sm font-bold">
                          {p.jersey_number ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {initials(p.profile?.full_name || '')}
                          </div>
                          <span className="font-medium text-slate-900">{p.profile?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs">
                          {p.position || 'Sin posición'}
                        </span>
                      </td>
                      {canManage && (
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => handleRemovePlayer(p.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs transition-colors mx-auto">
                            <UserMinus className="w-3.5 h-3.5" /> Quitar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assign players */}
        {canManage && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-900">Agregar jugadores sin equipo</h3>
              <p className="text-xs text-slate-400 mt-0.5">Solo jugadores que no pertenecen a ningún equipo</p>
            </div>
            <div className="p-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar jugador..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  value={searchPlayer} onChange={e => setSearchPlayer(e.target.value)} />
              </div>
              {filteredAvailable.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  {available.length === 0 ? 'No hay jugadores sin equipo disponibles' : 'Sin resultados para la búsqueda'}
                </p>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {filteredAvailable.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {initials(p.profile?.full_name || '')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{p.profile?.full_name}</p>
                          <p className="text-xs text-slate-400">{p.position || 'Sin posición'}</p>
                        </div>
                      </div>
                      <button onClick={() => handleAssignPlayer(p.id)}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs transition-colors">
                        Agregar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LIST ──
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Equipos</h2>
          <p className="text-sm text-slate-500 mt-1">{teams.length} equipos registrados</p>
        </div>
        {canManage && (
          <button onClick={() => setView('create')}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            <Plus className="w-5 h-5" /> Nuevo Equipo
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando equipos...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No hay equipos registrados</p>
          {canManage && <p className="text-slate-400 text-sm mt-1">Crea el primer equipo con el botón de arriba</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <div key={team.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                  <Shield className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{team.name}</p>
                  <p className="text-sm text-slate-500 truncate">{team.league?.name || 'Sin liga'}</p>
                  {team.city && <p className="text-xs text-slate-400 truncate">{team.city}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-slate-400 text-xs">Jugadores</p>
                  <p className="font-bold text-slate-900">{team.player_count}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 text-center">
                  <p className="text-slate-400 text-xs">Estado</p>
                  <p className={`font-medium text-xs ${team.status === 'active' ? 'text-green-600' : 'text-slate-400'}`}>
                    {team.status === 'active' ? 'Activo' : 'Inactivo'}
                  </p>
                </div>
              </div>
              <button onClick={() => openDetail(team)}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
                Ver equipo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

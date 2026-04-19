import { useState, useEffect } from 'react';
import { Search, UserPlus, Eye, Trophy, Target, Calendar, Save, ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '../../lib/supabase';

export function Players({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [view, setView] = useState<'list' | 'profile' | 'edit' | 'myanalysis'>('list');
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [form, setForm] = useState({
    position: '', jersey_number: '', birth_date: '',
    height_cm: '', weight_kg: '', dominant_foot: '', bio: '',
  });

  // Player analysis state
  const [myPlayer, setMyPlayer] = useState<any>(null);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [myLoading, setMyLoading] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setCurrentProfile(profile);
    setUserRole(profile?.role || '');

    if (profile?.role === 'jugador') {
      await fetchMyAnalysis(user.id);
    } else {
      await fetchPlayers();
    }
  };

  // ── PLAYER ANALYSIS ──────────────────────────────────────────────────────
  const fetchMyAnalysis = async (userId: string) => {
    setMyLoading(true);

    const { data: player } = await supabase
      .from('players')
      .select('*, profile:profiles(id, full_name, email, city, state), team:teams(id, name)')
      .eq('profile_id', userId)
      .maybeSingle();

    setMyPlayer(player);

    if (player) {
      // Events
      const { data: events } = await supabase
        .from('match_events')
        .select('id, event_type, minute, match_id')
        .eq('player_id', player.id);
      setMyEvents(events || []);

      // Team matches (separate queries to avoid FK join issues)
      if (player.team_id) {
        const { data: rawMatches } = await supabase
          .from('matches')
          .select('id, scheduled_at, status, home_team_id, away_team_id, home_score, away_score')
          .or(`home_team_id.eq.${player.team_id},away_team_id.eq.${player.team_id}`)
          .in('status', ['validated', 'finished', 'pending_validation'])
          .order('scheduled_at', { ascending: false })
          .limit(12);

        if (rawMatches && rawMatches.length > 0) {
          const teamIds = [...new Set([
            ...rawMatches.map(m => m.home_team_id),
            ...rawMatches.map(m => m.away_team_id),
          ].filter(Boolean))];
          const { data: teamsData } = await supabase.from('teams').select('id, name').in('id', teamIds);
          const teamMap: Record<string, any> = {};
          (teamsData || []).forEach((t: any) => { teamMap[t.id] = t; });
          setMyMatches(rawMatches.map(m => ({
            ...m,
            home_team: m.home_team_id ? teamMap[m.home_team_id] ?? null : null,
            away_team: m.away_team_id ? teamMap[m.away_team_id] ?? null : null,
          })));
        } else {
          setMyMatches([]);
        }
      }
    }

    setMyLoading(false);
    setView('myanalysis');
  };

  // ── ADMIN / DIRECTOR DATA ─────────────────────────────────────────────────
  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('players')
      .select('*, profile:profiles(id, full_name, email, city, state, avatar_url), team:teams(id, name)')
      .order('created_at', { ascending: false });
    if (error) console.error('fetchPlayers error:', error);
    setPlayers(data || []);
    setLoading(false);
  };

  const openProfile = (player: any) => { setSelectedPlayer(player); setView('profile'); };

  const openEdit = (player: any) => {
    setSelectedPlayer(player);
    setForm({
      position: player.position || '',
      jersey_number: player.jersey_number || '',
      birth_date: player.birth_date || '',
      height_cm: player.height_cm || '',
      weight_kg: player.weight_kg || '',
      dominant_foot: player.dominant_foot || '',
      bio: player.bio || '',
    });
    setView('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('players').update({
      position: form.position || null,
      jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
      birth_date: form.birth_date || null,
      height_cm: form.height_cm ? parseInt(form.height_cm) : null,
      weight_kg: form.weight_kg ? parseInt(form.weight_kg) : null,
      dominant_foot: form.dominant_foot || null,
      bio: form.bio || null,
    }).eq('id', selectedPlayer.id);
    setSaving(false);
    if (!error) {
      if (userRole === 'jugador') {
        await fetchMyAnalysis(currentProfile.id);
      } else {
        await fetchPlayers();
        setView('list');
      }
    } else {
      alert('Error al guardar: ' + error.message);
    }
  };

  const handleCreateMyProfile = async () => {
    if (!currentProfile) return;
    const { data: existing } = await supabase
      .from('players')
      .select('*, profile:profiles(id, full_name, email, city, state, avatar_url), team:teams(id, name)')
      .eq('profile_id', currentProfile.id)
      .maybeSingle();
    if (existing) { openEdit(existing); return; }
    const { data: created, error } = await supabase
      .from('players')
      .insert({ profile_id: currentProfile.id })
      .select('*, profile:profiles(id, full_name, email, city, state, avatar_url), team:teams(id, name)')
      .single();
    if (!error && created) openEdit(created);
    else alert('Error al crear perfil: ' + (error?.message || 'desconocido'));
  };

  const canEdit = (player: any) =>
    userRole === 'admin_plataforma' || userRole === 'director_liga' || player.profile?.id === currentProfile?.id;

  const filteredPlayers = players.filter(p =>
    p.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fmtDate = (dt: string | null) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ── EDIT VIEW ─────────────────────────────────────────────────────────────
  if (view === 'edit' && selectedPlayer) {
    const backView = userRole === 'jugador' ? 'myanalysis' : 'profile';
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <button onClick={() => setView(backView)} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Editar perfil — {selectedPlayer.profile?.full_name}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Posición</label>
                <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                  <option value="">Sin asignar</option>
                  <option value="Portero">Portero</option>
                  <option value="Defensa">Defensa</option>
                  <option value="Mediocampista">Mediocampista</option>
                  <option value="Delantero">Delantero</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de jersey</label>
                <input type="number" min="1" max="99" placeholder="Ej: 10"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.jersey_number} onChange={e => setForm({ ...form, jersey_number: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
                <input type="date"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pie dominante</label>
                <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.dominant_foot} onChange={e => setForm({ ...form, dominant_foot: e.target.value })}>
                  <option value="">Sin asignar</option>
                  <option value="derecho">Derecho</option>
                  <option value="izquierdo">Izquierdo</option>
                  <option value="ambidiestro">Ambidiestro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Altura (cm)</label>
                <input type="number" min="140" max="220" placeholder="Ej: 175"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
                <input type="number" min="40" max="150" placeholder="Ej: 70"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bio / Presentación</label>
              <textarea rows={3} placeholder="Cuéntanos sobre ti como jugador..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" />{saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={() => setView(backView)}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── MY ANALYSIS (jugador) ──────────────────────────────────────────────────
  if (view === 'myanalysis' && userRole === 'jugador') {
    const totalGoals = myEvents.filter(e => e.event_type === 'goal').length;
    const totalYellow = myEvents.filter(e => e.event_type === 'yellow_card').length;
    const totalRed = myEvents.filter(e => e.event_type === 'red_card').length;
    const totalMatches = myMatches.length;

    // Bar chart: goals in each of the last 8 matches
    const chartMatches = [...myMatches].reverse().slice(-8);
    const goalsChartData = chartMatches.map(m => {
      const goalsInMatch = myEvents.filter(e => e.event_type === 'goal' && e.match_id === m.id).length;
      const isHome = m.home_team_id === myPlayer?.team_id;
      const opponent = isHome ? m.away_team?.name : m.home_team?.name;
      return {
        partido: opponent?.slice(0, 8) ?? fmtDate(m.scheduled_at),
        goles: goalsInMatch,
      };
    });

    // Line chart: cumulative goals over matches
    let cumulative = 0;
    const cumulativeData = chartMatches.map(m => {
      cumulative += myEvents.filter(e => e.event_type === 'goal' && e.match_id === m.id).length;
      const isHome = m.home_team_id === myPlayer?.team_id;
      const opponent = isHome ? m.away_team?.name : m.home_team?.name;
      return { partido: opponent?.slice(0, 8) ?? fmtDate(m.scheduled_at), total: cumulative };
    });

    // Pie: event distribution
    const pieData = [
      { name: 'Goles', value: totalGoals, color: '#22c55e' },
      { name: 'T. Amarillas', value: totalYellow, color: '#f59e0b' },
      { name: 'T. Rojas', value: totalRed, color: '#ef4444' },
    ].filter(d => d.value > 0);

    if (myLoading) {
      return (
        <div className="p-4 lg:p-6 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500">Cargando tu análisis...</p>
          </div>
        </div>
      );
    }

    if (!myPlayer) {
      return (
        <div className="p-4 lg:p-6 max-w-xl mx-auto text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Aún no tienes perfil deportivo</h2>
          <p className="text-slate-500 mb-6 text-sm">Crea tu perfil para que el árbitro pueda registrar tus goles y estadísticas en cada partido.</p>
          <button onClick={handleCreateMyProfile}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold mx-auto transition-colors">
            <UserPlus className="w-5 h-5" /> Crear mi perfil deportivo
          </button>
        </div>
      );
    }

    const age = myPlayer.birth_date
      ? Math.floor((Date.now() - new Date(myPlayer.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {myPlayer.profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{myPlayer.profile?.full_name}</h2>
              <p className="text-green-100 mt-0.5">
                {myPlayer.position || 'Posición no asignada'}
                {myPlayer.jersey_number ? ` · #${myPlayer.jersey_number}` : ''}
              </p>
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="flex items-center gap-1 text-green-100 text-sm">
                  <Shield className="w-4 h-4" />{myPlayer.team?.name || 'Sin equipo'}
                </span>
                {age && <span className="text-green-100 text-sm">{age} años</span>}
                {myPlayer.dominant_foot && <span className="text-green-100 text-sm capitalize">Pie {myPlayer.dominant_foot}</span>}
              </div>
            </div>
            <button onClick={() => { setSelectedPlayer(myPlayer); setForm({ position: myPlayer.position || '', jersey_number: myPlayer.jersey_number || '', birth_date: myPlayer.birth_date || '', height_cm: myPlayer.height_cm || '', weight_kg: myPlayer.weight_kg || '', dominant_foot: myPlayer.dominant_foot || '', bio: myPlayer.bio || '' }); setView('edit'); }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              Editar perfil
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Partidos jugados', value: totalMatches, color: 'text-slate-900', bg: 'bg-slate-50', icon: <Calendar className="w-5 h-5 text-slate-500" /> },
            { label: 'Goles', value: totalGoals, color: 'text-green-600', bg: 'bg-green-50', icon: <Target className="w-5 h-5 text-green-500" /> },
            { label: 'Tarjetas amarillas', value: totalYellow, color: 'text-amber-600', bg: 'bg-amber-50', icon: <div className="w-4 h-5 bg-amber-400 rounded-sm" /> },
            { label: 'Tarjetas rojas', value: totalRed, color: 'text-red-600', bg: 'bg-red-50', icon: <div className="w-4 h-5 bg-red-500 rounded-sm" /> },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} rounded-xl border border-slate-200 p-5`}>
              <div className="flex items-center justify-between mb-2">{s.icon}</div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {totalMatches === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Aún no hay partidos validados</p>
            <p className="text-slate-400 text-sm mt-1">Las estadísticas aparecerán cuando tu equipo dispute partidos validados</p>
          </div>
        ) : (
          <>
            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Goles por partido */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Goles por partido</h3>
                {goalsChartData.every(d => d.goles === 0) ? (
                  <p className="text-slate-400 text-sm text-center py-10">Sin goles registrados aún</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={goalsChartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="partido" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip formatter={(v) => [`${v} gol(es)`, 'Goles']} />
                      <Bar dataKey="goles" name="Goles" fill="#22c55e" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Goles acumulados */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Goles acumulados en la temporada</h3>
                {totalGoals === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-10">Sin goles registrados aún</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={cumulativeData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="partido" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} stroke="#94a3b8" />
                      <Tooltip formatter={(v) => [`${v} gol(es)`, 'Total']} />
                      <Line type="monotone" dataKey="total" name="Goles" stroke="#22c55e" strokeWidth={3} dot={{ r: 5, fill: '#22c55e' }} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie + match history */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Event distribution */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Distribución de eventos</h3>
                {pieData.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">Sin eventos</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, value }) => `${name}: ${value}`} labelLine={false} fontSize={10} isAnimationActive={false}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Match history */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
                <h3 className="font-semibold text-slate-900 mb-4">Historial de partidos</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {myMatches.map(m => {
                    const isHome = m.home_team_id === myPlayer.team_id;
                    const opponent = isHome ? m.away_team?.name : m.home_team?.name;
                    const myGoals = myEvents.filter(e => e.event_type === 'goal' && e.match_id === m.id).length;
                    const myYellow = myEvents.filter(e => e.event_type === 'yellow_card' && e.match_id === m.id).length;
                    const myRed = myEvents.filter(e => e.event_type === 'red_card' && e.match_id === m.id).length;
                    const myScore = isHome ? m.home_score : m.away_score;
                    const oppScore = isHome ? m.away_score : m.home_score;
                    const result = m.home_score !== null
                      ? (myScore > oppScore ? 'W' : myScore === oppScore ? 'D' : 'L')
                      : null;
                    return (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                        <div className="flex items-center gap-3">
                          {result && (
                            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white ${result === 'W' ? 'bg-green-500' : result === 'D' ? 'bg-slate-400' : 'bg-red-500'}`}>
                              {result}
                            </span>
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900">vs {opponent ?? '—'}</p>
                            <p className="text-xs text-slate-400">{fmtDate(m.scheduled_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {m.home_score !== null && (
                            <span className="font-bold text-slate-700">{myScore} — {oppScore}</span>
                          )}
                          {myGoals > 0 && <span className="flex items-center gap-0.5 text-green-600 font-semibold"><Target className="w-3 h-3" />{myGoals}</span>}
                          {myYellow > 0 && <span className="w-3 h-4 bg-amber-400 rounded-sm inline-block" title={`${myYellow} amarilla(s)`} />}
                          {myRed > 0 && <span className="w-3 h-4 bg-red-500 rounded-sm inline-block" title="Roja" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── PROFILE VIEW (admin/director) ─────────────────────────────────────────
  if (view === 'profile' && selectedPlayer) {
    const p = selectedPlayer;
    const age = p.birth_date
      ? Math.floor((Date.now() - new Date(p.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
      : null;
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Volver a jugadores
        </button>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {p.profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{p.profile?.full_name}</h2>
              <p className="text-green-100">{p.position || 'Posición no asignada'}{p.jersey_number ? ` · #${p.jersey_number}` : ''}</p>
              <p className="text-green-100 text-sm">{p.team?.name || 'Sin equipo'}</p>
            </div>
            {canEdit(p) && (
              <button onClick={() => openEdit(p)} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium">
                Editar perfil
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Edad', value: age ? `${age} años` : '—' },
            { label: 'Altura', value: p.height_cm ? `${p.height_cm} cm` : '—' },
            { label: 'Peso', value: p.weight_kg ? `${p.weight_kg} kg` : '—' },
            { label: 'Pie dominante', value: p.dominant_foot || '—' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
        {p.bio && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-2">Presentación</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{p.bio}</p>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Estadísticas oficiales</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><p className="text-3xl font-bold text-green-600">0</p><p className="text-sm text-slate-500 mt-1">Goles</p></div>
            <div><p className="text-3xl font-bold text-slate-900">0</p><p className="text-sm text-slate-500 mt-1">Partidos</p></div>
            <div><p className="text-3xl font-bold text-amber-500">0</p><p className="text-sm text-slate-500 mt-1">Tarjetas</p></div>
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">Las estadísticas se actualizan después de partidos validados</p>
        </div>
      </div>
    );
  }

  // ── LIST VIEW (admin/director) ─────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Jugadores</h2>
          <p className="text-sm text-slate-500 mt-1">{players.length} jugadores registrados</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Buscar por nombre, equipo o posición..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando jugadores...</div>
      ) : filteredPlayers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">No hay jugadores registrados</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map(player => (
            <div key={player.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  {player.profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{player.profile?.full_name}</p>
                  <p className="text-sm text-slate-500 truncate">{player.team?.name || 'Sin equipo'}</p>
                </div>
                {player.jersey_number && <span className="text-lg font-bold text-slate-400">#{player.jersey_number}</span>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                  {player.position || 'Sin posición'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => openProfile(player)}
                    className="flex items-center gap-1 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs transition-colors">
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </button>
                  {canEdit(player) && (
                    <button onClick={() => openEdit(player)}
                      className="flex items-center gap-1 px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg text-xs transition-colors">
                      Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

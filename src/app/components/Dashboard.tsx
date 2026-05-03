import { useState, useEffect } from 'react';
import { Users, Shield, Calendar, Trophy, Award, AlertCircle, Target, ChevronRight, CheckCircle, XCircle, Building } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from '../../lib/supabase';

interface Stats {
  players: number;
  teams: number;
  scheduledMatches: number;
  finishedMatches: number;
  pendingValidation: number;
}

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

export function Dashboard({ onNavigate }: { onNavigate?: (view: string) => void }) {
  const [stats, setStats] = useState<Stats>({ players: 0, teams: 0, scheduledMatches: 0, finishedMatches: 0, pendingValidation: 0 });
  const [chartData, setChartData] = useState<{ month: string; partidos: number; goles: number }[]>([]);
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [topReferees, setTopReferees] = useState<any[]>([]);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [playerSnap, setPlayerSnap] = useState<{ name: string; team: string; position: string; goals: number; matches: number; yellow: number; red: number } | null>(null);
  const [leaderSnap, setLeaderSnap] = useState<{ teamName: string; plan: string; rosterCount: number } | null>(null);
  const [pendingLeaders, setPendingLeaders] = useState<any[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalForm, setApprovalForm] = useState({ plan: 'estandar', plan_activo_hasta: '' });
  const [actionSaving, setActionSaving] = useState(false);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    const role = prof?.role || '';
    setUserRole(role);

    if (role === 'jugador') await fetchPlayerSnap(user.id);
    else if (role === 'lider_equipo') await fetchLeaderSnap(user.id);

    const promises = [fetchStats(), fetchChartData(), fetchTopScorers(), fetchTopReferees()];
    if (role === 'admin_plataforma' || role === 'director_liga') promises.push(fetchPendingLeaders());
    await Promise.all(promises);
    setLoading(false);
  };

  const fetchPlayerSnap = async (userId: string) => {
    const { data: player } = await supabase
      .from('players')
      .select('id, position, team:teams(name)')
      .eq('profile_id', userId)
      .maybeSingle();
    if (!player) return;
    const { data: events } = await supabase.from('match_events').select('event_type').eq('player_id', player.id);
    const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
    const evs = events || [];
    setPlayerSnap({
      name: prof?.full_name || '',
      team: (player.team as any)?.name || 'Sin equipo',
      position: player.position || 'Sin posición',
      goals: evs.filter(e => e.event_type === 'goal').length,
      matches: 0,
      yellow: evs.filter(e => e.event_type === 'yellow_card').length,
      red: evs.filter(e => e.event_type === 'red_card').length,
    });
  };

  const fetchLeaderSnap = async (userId: string) => {
    const { data: team } = await supabase
      .from('teams')
      .select('id, name, plan')
      .eq('lider_id', userId)
      .maybeSingle();
    if (!team) return;
    const { count } = await supabase.from('team_roster').select('id', { count: 'exact', head: true }).eq('team_id', team.id);
    setLeaderSnap({ teamName: team.name, plan: team.plan, rosterCount: count ?? 0 });
  };

  const fetchPendingLeaders = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, team_name_request, created_at')
      .eq('role', 'lider_equipo')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setPendingLeaders(data || []);
  };

  const fetchStats = async () => {
    const [
      { count: players },
      { count: teams },
      { count: scheduled },
      { count: finished },
      { count: pending },
    ] = await Promise.all([
      supabase.from('players').select('id', { count: 'exact', head: true }),
      supabase.from('teams').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
      supabase.from('matches').select('id', { count: 'exact', head: true }).in('status', ['validated', 'finished', 'pending_validation']),
      supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'pending_validation'),
    ]);
    setStats({ players: players ?? 0, teams: teams ?? 0, scheduledMatches: scheduled ?? 0, finishedMatches: finished ?? 0, pendingValidation: pending ?? 0 });
  };

  const fetchChartData = async () => {
    const months: { month: string; partidos: number; goles: number }[] = [];
    const now = new Date();
    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = d.toISOString();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
      const label = d.toLocaleDateString('es-MX', { month: 'short' });
      const [{ count: partidos }, { count: goles }] = await Promise.all([
        supabase.from('matches').select('id', { count: 'exact', head: true }).gte('scheduled_at', start).lt('scheduled_at', end).eq('status', 'validated'),
        supabase.from('match_events').select('id', { count: 'exact', head: true }).eq('event_type', 'goal').gte('created_at', start).lt('created_at', end),
      ]);
      months.push({ month: label, partidos: partidos ?? 0, goles: goles ?? 0 });
    }
    setChartData(months);
  };

  const fetchTopScorers = async () => {
    const { data: events } = await supabase
      .from('match_events')
      .select('player_id, matches!inner(status)')
      .eq('event_type', 'goal')
      .eq('matches.status', 'validated')
      .not('player_id', 'is', null);
    if (!events || events.length === 0) { setTopScorers([]); return; }
    const goalMap: Record<string, number> = {};
    events.forEach(ev => { if (ev.player_id) goalMap[ev.player_id] = (goalMap[ev.player_id] || 0) + 1; });
    const top = Object.entries(goalMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const ids = top.map(([id]) => id);
    const { data: players } = await supabase
      .from('players')
      .select('id, profile:profiles(full_name), team:teams(name)')
      .in('id', ids);
    setTopScorers(top.map(([id, goals]) => {
      const p = players?.find(pl => pl.id === id);
      return { id, goals, name: (p?.profile as any)?.full_name || '—', team: (p?.team as any)?.name || '—' };
    }));
  };

  const fetchTopReferees = async () => {
    const { data: refs } = await supabase.from('referees').select('id, profile:profiles(full_name)');
    if (!refs || refs.length === 0) { setTopReferees([]); return; }
    const withRatings = await Promise.all(refs.map(async r => {
      const { data: ratings } = await supabase.from('referee_ratings').select('score').eq('referee_id', r.id);
      const scores = (ratings || []).map((x: any) => x.score);
      const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
      return { id: r.id, name: (r.profile as any)?.full_name || '—', avg_score: avg, total: scores.length };
    }));
    setTopReferees(withRatings.filter(r => r.avg_score !== null).sort((a, b) => (b.avg_score || 0) - (a.avg_score || 0)).slice(0, 4));
  };

  const handleApproveLeader = async (leader: any) => {
    if (!approvalForm.plan) { alert('Selecciona un plan'); return; }
    if (actionSaving) return;

    setPendingLeaders(prev => prev.filter(l => l.id !== leader.id));
    setApprovingId(null);
    setActionSaving(true);

    // Si el equipo ya existe (intento previo), solo activar el perfil
    const { data: existingTeam } = await supabase
      .from('teams').select('id').eq('lider_id', leader.id).maybeSingle();

    if (!existingTeam) {
      const isPremium = approvalForm.plan === 'premium';
      const code = isPremium ? generateCode() : null;
      const codeExpiry = isPremium ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null;

      const { error: teamErr } = await supabase.from('teams').insert({
        name: leader.team_name_request || `Equipo de ${leader.full_name}`,
        lider_id: leader.id,
        plan: approvalForm.plan,
        plan_activo_hasta: approvalForm.plan_activo_hasta || null,
        codigo_verificacion: code,
        codigo_expira_en: codeExpiry,
        status: 'active',
      });
      if (teamErr) {
        alert('Error al crear equipo: ' + teamErr.message);
        await fetchPendingLeaders();
        setActionSaving(false);
        return;
      }
    }

    const { error: profileErr } = await supabase.from('profiles').update({ status: 'active' }).eq('id', leader.id);
    if (profileErr) {
      alert('Error al activar perfil: ' + profileErr.message);
      await fetchPendingLeaders();
    }

    setApprovalForm({ plan: 'estandar', plan_activo_hasta: '' });
    setActionSaving(false);
  };

  const handleRejectLeader = async (leaderId: string) => {
    if (!window.confirm('¿Rechazar esta solicitud? El líder será marcado como suspendido.')) return;
    setActionSaving(true);
    await supabase.from('profiles').update({ status: 'suspended' }).eq('id', leaderId);
    await fetchPendingLeaders();
    setActionSaving(false);
  };

  const fmtDate = (dt: string | null) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const statCards = [
    { label: 'Jugadores Registrados', value: stats.players, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Equipos Activos', value: stats.teams, icon: Shield, color: 'bg-green-100 text-green-600' },
    { label: 'Partidos Programados', value: stats.scheduledMatches, icon: Calendar, color: 'bg-orange-100 text-orange-600' },
    { label: 'Partidos Finalizados', value: stats.finishedMatches, icon: Trophy, color: 'bg-purple-100 text-purple-600' },
  ];

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">

      {/* Jugador personal banner */}
      {userRole === 'jugador' && playerSnap && (
        <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white">
          <p className="text-green-100 text-sm mb-1">Bienvenido de vuelta</p>
          <h2 className="text-2xl font-bold mb-1">{playerSnap.name}</h2>
          <p className="text-green-100 text-sm mb-4">{playerSnap.position} · {playerSnap.team}</p>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Goles', value: playerSnap.goals, color: 'text-white' },
              { label: 'T. Amarillas', value: playerSnap.yellow, color: 'text-amber-200' },
              { label: 'T. Rojas', value: playerSnap.red, color: 'text-red-200' },
            ].map((s, i) => (
              <div key={i} className="bg-white/15 rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-green-100 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate?.('players')}
            className="flex items-center gap-2 bg-white text-green-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-green-50 transition-colors">
            Ver mi análisis completo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Líder de equipo banner */}
      {userRole === 'lider_equipo' && leaderSnap && (
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-6 text-white">
          <p className="text-purple-100 text-sm mb-1">Tu equipo</p>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-2xl font-bold">{leaderSnap.teamName}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${leaderSnap.plan === 'premium' ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}>
              {leaderSnap.plan === 'premium' ? '★ PREMIUM' : 'ESTÁNDAR'}
            </span>
          </div>
          <p className="text-purple-100 text-sm mb-4">{leaderSnap.rosterCount} jugador{leaderSnap.rosterCount !== 1 ? 'es' : ''} en el roster</p>
          <button onClick={() => onNavigate?.('team-leader')}
            className="flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-purple-50 transition-colors">
            Gestionar mi equipo <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending leaders alert */}
      {pendingLeaders.length > 0 && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-violet-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-violet-800">
              {pendingLeaders.length} solicitud{pendingLeaders.length > 1 ? 'es' : ''} de Líder de Equipo pendiente{pendingLeaders.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="space-y-3">
            {pendingLeaders.map(leader => (
              <div key={leader.id} className="bg-white rounded-lg border border-violet-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {leader.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{leader.full_name}</p>
                        <p className="text-xs text-slate-500">{leader.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-sm text-slate-600">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span>Equipo solicitado: <span className="font-semibold">{leader.team_name_request || '—'}</span></span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">Solicitó: {fmtDate(leader.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setApprovingId(approvingId === leader.id ? null : leader.id); setApprovalForm({ plan: 'estandar', plan_activo_hasta: '' }); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors">
                      <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                    </button>
                    <button onClick={() => handleRejectLeader(leader.id)} disabled={actionSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                      <XCircle className="w-3.5 h-3.5" /> Rechazar
                    </button>
                  </div>
                </div>

                {approvingId === leader.id && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-3">
                    <p className="text-xs font-semibold text-green-800">Configurar aprobación</p>
                    <div className="flex flex-wrap gap-3 items-end">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Plan *</label>
                        <select className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={approvalForm.plan} onChange={e => setApprovalForm({ ...approvalForm, plan: e.target.value })}>
                          <option value="estandar">Estándar ($300 MXN)</option>
                          <option value="premium">Premium ($500 MXN)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Temporada activa hasta</label>
                        <input type="date"
                          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          value={approvalForm.plan_activo_hasta} onChange={e => setApprovalForm({ ...approvalForm, plan_activo_hasta: e.target.value })} />
                      </div>
                      <button onClick={() => handleApproveLeader(leader)} disabled={actionSaving}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                        {actionSaving ? 'Aprobando...' : 'Confirmar aprobación'}
                      </button>
                    </div>
                    {approvalForm.plan === 'premium' && (
                      <p className="text-xs text-green-700">Se generará automáticamente un código de verificación válido por 7 días para los jugadores del equipo.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{card.value.toLocaleString()}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pending matches alert */}
      {stats.pendingValidation > 0 && (userRole === 'admin_plataforma' || userRole === 'director_liga') && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{stats.pendingValidation} partido{stats.pendingValidation > 1 ? 's' : ''}</span> pendiente{stats.pendingValidation > 1 ? 's' : ''} de validación en la sección de Partidos.
          </p>
        </div>
      )}

      {/* Charts */}
      {chartData.some(d => d.partidos > 0 || d.goles > 0) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Partidos Validados por Mes</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="partidos" name="Partidos" fill="#22c55e" radius={[6, 6, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Goles Registrados por Mes</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="goles" name="Goles" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
          Las gráficas de actividad aparecerán cuando haya partidos validados.
        </div>
      )}

      {/* Top players & referees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Goleadores Destacados</h3>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          {topScorers.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Sin goles registrados en partidos validados</p>
          ) : (
            <div className="space-y-3">
              {topScorers.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.team}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 font-bold">
                    <Target className="w-4 h-4" />
                    <span>{s.goals}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Árbitros Mejor Calificados</h3>
            <Award className="w-5 h-5 text-blue-500" />
          </div>
          {topReferees.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Sin calificaciones de árbitros aún</p>
          ) : (
            <div className="space-y-3">
              {topReferees.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {r.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.total} calificación{r.total !== 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-500 font-bold">
                    ★ <span className="text-slate-900">{r.avg_score}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Pencil, Save, X, Copy, Check, RefreshCw, Users, CreditCard, Calendar, Link, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RosterEntry {
  id: string;
  nombre_completo: string;
  numero_jersey: number | null;
  posicion: string | null;
  profile_id: string | null;
}

interface UnlinkedPlayer {
  id: string;
  profile_id: string;
  jersey_number: number | null;
  position: string | null;
  profile: { id: string; full_name: string; email: string } | null;
}

interface TeamData {
  id: string;
  name: string;
  plan: 'estandar' | 'premium';
  plan_activo_hasta: string | null;
  codigo_verificacion: string | null;
  codigo_expira_en: string | null;
  city: string | null;
  league: { name: string } | null;
}

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En Juego', color: 'bg-amber-100 text-amber-700' },
  finished: { label: 'Finalizado', color: 'bg-slate-100 text-slate-700' },
  pending_validation: { label: 'Pend. Validación', color: 'bg-orange-100 text-orange-700' },
  validated: { label: 'Validado', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
};

export function TeamLeaderPanel() {
  const [team, setTeam] = useState<TeamData | null>(null);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [unlinkedPlayers, setUnlinkedPlayers] = useState<UnlinkedPlayer[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [matches, setMatches] = useState<any[]>([]);
  const [pagos, setPagos] = useState<Record<string, any>>({});
  const [tab, setTab] = useState<'plantilla' | 'cobros'>('plantilla');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [rosterForm, setRosterForm] = useState({ nombre_completo: '', numero_jersey: '', posicion: '' });
  const [editForm, setEditForm] = useState({ nombre_completo: '', numero_jersey: '', posicion: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setCurrentUserId(user.id);

    const { data: teamData } = await supabase
      .from('teams')
      .select('id, name, plan, plan_activo_hasta, codigo_verificacion, codigo_expira_en, city, league:leagues(name)')
      .eq('lider_id', user.id)
      .maybeSingle();

    if (!teamData) { setLoading(false); return; }
    setTeam(teamData as TeamData);
    await Promise.all([fetchRoster(teamData.id), fetchMatchesAndPagos(teamData.id)]);
    setLoading(false);
  };

  const fetchRoster = async (teamId: string) => {
    const [{ data: rosterData }, { data: playersData }] = await Promise.all([
      supabase.from('team_roster')
        .select('id, nombre_completo, numero_jersey, posicion, profile_id')
        .eq('team_id', teamId)
        .order('nombre_completo'),
      supabase.from('players')
        .select('id, profile_id, jersey_number, position, profile:profiles(id, full_name, email)')
        .eq('team_id', teamId),
    ]);

    const roster = rosterData || [];
    const linkedProfileIds = new Set(roster.filter(r => r.profile_id).map(r => r.profile_id));

    // Jugadores registrados via código que no están vinculados a ninguna entrada del roster
    const unlinked = (playersData || []).filter(
      p => p.profile_id && !linkedProfileIds.has(p.profile_id)
    ) as UnlinkedPlayer[];

    setRoster(roster);
    setUnlinkedPlayers(unlinked);
  };

  const handleLinkToRoster = async (playerId: string, rosterId: string) => {
    setSaving(true);
    const { error } = await supabase.from('team_roster').update({ profile_id: playerId }).eq('id', rosterId);
    if (error) {
      alert('Error al vincular: ' + error.message);
    } else if (team) {
      await fetchRoster(team.id);
    }
    setSaving(false);
  };

  const handleAddLeaderAsPlayer = async () => {
    if (!team || !currentUserId) return;
    const already = roster.some(r => r.profile_id === currentUserId);
    if (already) { alert('Ya estás en el roster como jugador.'); return; }
    setSaving(true);
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', currentUserId).single();
    await supabase.from('team_roster').insert({
      team_id: team.id,
      nombre_completo: profile?.full_name || 'Líder',
      profile_id: currentUserId,
    });
    // También crear registro en players si no existe
    const { data: existingPlayer } = await supabase.from('players').select('id').eq('profile_id', currentUserId).maybeSingle();
    if (!existingPlayer) {
      await supabase.from('players').insert({ profile_id: currentUserId, team_id: team.id });
    }
    await fetchRoster(team.id);
    setSaving(false);
  };

  const fetchMatchesAndPagos = async (teamId: string) => {
    const { data: rawMatches } = await supabase
      .from('matches')
      .select('id, scheduled_at, status, home_team_id, away_team_id')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('scheduled_at', { ascending: false })
      .limit(30);

    if (!rawMatches || rawMatches.length === 0) { setMatches([]); return; }

    const teamIds = [...new Set([...rawMatches.map(m => m.home_team_id), ...rawMatches.map(m => m.away_team_id)].filter(Boolean))];
    const { data: teamsData } = await supabase.from('teams').select('id, name').in('id', teamIds);
    const teamMap: Record<string, any> = {};
    (teamsData || []).forEach((t: any) => { teamMap[t.id] = t; });

    setMatches(rawMatches.map(m => ({
      ...m,
      home_team: m.home_team_id ? teamMap[m.home_team_id] : null,
      away_team: m.away_team_id ? teamMap[m.away_team_id] : null,
    })));

    const matchIds = rawMatches.map(m => m.id);
    const { data: pagosData } = await supabase
      .from('arbitraje_pagos')
      .select('*')
      .eq('team_id', teamId)
      .in('match_id', matchIds);

    const map: Record<string, any> = {};
    (pagosData || []).forEach(p => { map[p.match_id] = p; });
    setPagos(map);
  };

  const handleAddRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setSaving(true);
    await supabase.from('team_roster').insert({
      team_id: team.id,
      nombre_completo: rosterForm.nombre_completo.trim(),
      numero_jersey: rosterForm.numero_jersey ? parseInt(rosterForm.numero_jersey) : null,
      posicion: rosterForm.posicion || null,
    });
    setRosterForm({ nombre_completo: '', numero_jersey: '', posicion: '' });
    setShowAddForm(false);
    await fetchRoster(team.id);
    setSaving(false);
  };

  const handleSaveEdit = async (id: string) => {
    if (!team) return;
    setSaving(true);
    await supabase.from('team_roster').update({
      nombre_completo: editForm.nombre_completo.trim(),
      numero_jersey: editForm.numero_jersey ? parseInt(editForm.numero_jersey) : null,
      posicion: editForm.posicion || null,
    }).eq('id', id);
    setEditingId(null);
    await fetchRoster(team.id);
    setSaving(false);
  };

  const handleDeleteRoster = async (entry: RosterEntry) => {
    const msg = entry.profile_id
      ? `¿Remover a "${entry.nombre_completo}"? Esto revocará su acceso al sistema.`
      : `¿Eliminar a "${entry.nombre_completo}" del roster?`;
    if (!window.confirm(msg)) return;
    setSaving(true);
    if (entry.profile_id) {
      await supabase.from('players').update({ team_id: null }).eq('profile_id', entry.profile_id);
    }
    await supabase.from('team_roster').delete().eq('id', entry.id);
    if (team) await fetchRoster(team.id);
    setSaving(false);
  };

  const handleTogglePago = async (matchId: string) => {
    if (!team) return;
    const existing = pagos[matchId];
    if (existing) {
      await supabase.from('arbitraje_pagos').update({ pagado: !existing.pagado }).eq('id', existing.id);
    } else {
      await supabase.from('arbitraje_pagos').insert({ team_id: team.id, match_id: matchId, pagado: true });
    }
    await fetchMatchesAndPagos(team.id);
  };

  const handleRegenerateCode = async () => {
    if (!team) return;
    if (!window.confirm('¿Generar un nuevo código? El código anterior dejará de funcionar.')) return;
    setSaving(true);
    const code = generateCode();
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('teams').update({ codigo_verificacion: code, codigo_expira_en: expiry }).eq('id', team.id);
    setTeam({ ...team, codigo_verificacion: code, codigo_expira_en: expiry });
    setSaving(false);
  };

  const copyCode = () => {
    if (team?.codigo_verificacion) {
      navigator.clipboard.writeText(team.codigo_verificacion);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const fmtDate = (dt: string | null) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const fmtDateTime = (dt: string | null) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const isCodeExpired = !team?.codigo_expira_en || new Date(team.codigo_expira_en) < new Date();

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Cargando tu equipo...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-4 lg:p-6 max-w-xl mx-auto text-center py-20">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Tu equipo está siendo configurado</h2>
        <p className="text-slate-500 text-sm mb-6">
          El director de la liga activará tu equipo pronto. Mientras tanto puedes revisar los rankings y partidos de la liga.
        </p>
        <button onClick={loadData}
          className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
          Verificar ahora
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">

      {/* Team header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold">{team.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${team.plan === 'premium' ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white'}`}>
                {team.plan === 'premium' ? '★ PREMIUM' : 'ESTÁNDAR'}
              </span>
            </div>
            <p className="text-purple-100 text-sm">{(team.league as any)?.name || 'Sin liga'}{team.city ? ` · ${team.city}` : ''}</p>
            {team.plan_activo_hasta && (
              <p className="text-purple-200 text-xs mt-1">Temporada activa hasta: {fmtDate(team.plan_activo_hasta)}</p>
            )}
          </div>
        </div>

        {team.plan === 'premium' && (
          <div className="mt-4 bg-white/10 rounded-xl p-4">
            <p className="text-purple-200 text-xs font-medium uppercase tracking-wide mb-2">Código para jugadores</p>
            {team.codigo_verificacion && !isCodeExpired ? (
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-2xl font-mono font-bold tracking-widest">{team.codigo_verificacion}</code>
                <button onClick={copyCode} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Copiar código">
                  {codeCopied ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                </button>
                <button onClick={handleRegenerateCode} disabled={saving} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors" title="Generar nuevo código">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-purple-200 text-sm">{isCodeExpired && team.codigo_verificacion ? 'Código expirado' : 'Sin código activo'}</span>
                <button onClick={handleRegenerateCode} disabled={saving}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Generar código
                </button>
              </div>
            )}
            {team.codigo_expira_en && !isCodeExpired && (
              <p className="text-purple-200 text-xs mt-1.5">Expira: {fmtDateTime(team.codigo_expira_en)}</p>
            )}
            <p className="text-purple-200 text-xs mt-1">Comparte este código con tus jugadores para que puedan registrarse.</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        <button onClick={() => setTab('plantilla')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'plantilla' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Users className="w-4 h-4" /> Plantilla ({roster.length}{unlinkedPlayers.length > 0 ? ` +${unlinkedPlayers.length} pendientes` : ''})
        </button>
        <button onClick={() => setTab('cobros')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'cobros' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <CreditCard className="w-4 h-4" /> Cobros de Arbitraje
        </button>
      </div>

      {/* ── PLANTILLA ── */}
      {tab === 'plantilla' && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-slate-500 max-w-lg">
              {team.plan === 'premium'
                ? 'Los jugadores vinculados tienen cuenta propia y ven sus stats. Los no vinculados solo aparecen en el roster.'
                : 'Plan estándar: los jugadores son registros en el roster, sin cuenta propia en el sistema.'}
            </p>
            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              {!roster.some(r => r.profile_id === currentUserId) && (
                <button onClick={handleAddLeaderAsPlayer} disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  <UserPlus className="w-4 h-4" /> Unirme como jugador
                </button>
              )}
              <button onClick={() => { setShowAddForm(!showAddForm); setRosterForm({ nombre_completo: '', numero_jersey: '', posicion: '' }); }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors">
                {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showAddForm ? 'Cancelar' : 'Agregar jugador'}
              </button>
            </div>
          </div>

          {/* Jugadores registrados via código pendientes de vincular al roster */}
          {unlinkedPlayers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2">
                <Link className="w-4 h-4" />
                {unlinkedPlayers.length} jugador(es) se registraron con el código pero no están vinculados al roster
              </p>
              <div className="space-y-2">
                {unlinkedPlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-100">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.profile?.full_name}</p>
                      <p className="text-xs text-slate-400">{p.profile?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        className="text-xs px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        defaultValue=""
                        onChange={e => { if (e.target.value) handleLinkToRoster(p.profile_id, e.target.value); }}
                      >
                        <option value="">Vincular a entrada...</option>
                        {roster.filter(r => !r.profile_id).map(r => (
                          <option key={r.id} value={r.id}>{r.nombre_completo}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showAddForm && (
            <form onSubmit={handleAddRoster} className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-40">
                <label className="block text-xs font-medium text-slate-700 mb-1">Nombre completo *</label>
                <input required type="text" placeholder="Nombre del jugador"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={rosterForm.nombre_completo} onChange={e => setRosterForm({ ...rosterForm, nombre_completo: e.target.value })} />
              </div>
              <div className="w-24">
                <label className="block text-xs font-medium text-slate-700 mb-1"># Jersey</label>
                <input type="number" min="1" max="99" placeholder="10"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={rosterForm.numero_jersey} onChange={e => setRosterForm({ ...rosterForm, numero_jersey: e.target.value })} />
              </div>
              <div className="w-44">
                <label className="block text-xs font-medium text-slate-700 mb-1">Posición</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={rosterForm.posicion} onChange={e => setRosterForm({ ...rosterForm, posicion: e.target.value })}>
                  <option value="">Sin asignar</option>
                  <option>Portero</option><option>Defensa</option><option>Mediocampista</option><option>Delantero</option>
                </select>
              </div>
              <button type="submit" disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          )}

          {roster.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No hay jugadores en el roster</p>
              <p className="text-slate-400 text-sm mt-1">Agrega jugadores con el botón de arriba</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide">Nombre</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide hidden sm:table-cell">Posición</th>
                    <th className="px-4 py-3 text-left text-xs text-slate-500 uppercase tracking-wide hidden md:table-cell">Estado</th>
                    <th className="px-4 py-3 text-center text-xs text-slate-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50">
                      {editingId === entry.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input type="number" min="1" max="99" placeholder="#"
                              className="w-16 px-2 py-1 border border-slate-300 rounded text-sm"
                              value={editForm.numero_jersey} onChange={e => setEditForm({ ...editForm, numero_jersey: e.target.value })} />
                          </td>
                          <td className="px-4 py-3">
                            <input type="text" required
                              className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                              value={editForm.nombre_completo} onChange={e => setEditForm({ ...editForm, nombre_completo: e.target.value })} />
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <select className="px-2 py-1 border border-slate-300 rounded text-sm"
                              value={editForm.posicion} onChange={e => setEditForm({ ...editForm, posicion: e.target.value })}>
                              <option value="">Sin asignar</option>
                              <option>Portero</option><option>Defensa</option><option>Mediocampista</option><option>Delantero</option>
                            </select>
                          </td>
                          <td className="hidden md:table-cell" />
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleSaveEdit(entry.id)} disabled={saving}
                                className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition-colors">
                                <Save className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingId(null)}
                                className="p-1.5 border border-slate-300 hover:bg-slate-50 rounded transition-colors">
                                <X className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <span className="w-8 h-8 bg-purple-100 rounded-full inline-flex items-center justify-center text-purple-700 text-sm font-bold">
                              {entry.numero_jersey ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-slate-900 text-sm">{entry.nombre_completo}</p>
                              {entry.profile_id === currentUserId && (
                                <span className="px-1.5 py-0.5 bg-purple-600 text-white rounded text-xs font-bold">Tú</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs">
                              {entry.posicion || 'Sin posición'}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            {entry.profile_id
                              ? <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Vinculado</span>
                              : <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-full text-xs">Sin vincular</span>
                            }
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => { setEditingId(entry.id); setEditForm({ nombre_completo: entry.nombre_completo, numero_jersey: entry.numero_jersey?.toString() || '', posicion: entry.posicion || '' }); }}
                                className="p-1.5 border border-slate-300 hover:bg-slate-50 rounded transition-colors">
                                <Pencil className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                              <button onClick={() => handleDeleteRoster(entry)} disabled={saving}
                                className="p-1.5 border border-red-200 hover:bg-red-50 rounded transition-colors">
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── COBROS ── */}
      {tab === 'cobros' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Marca los partidos donde ya se realizó el pago de arbitraje. Este checklist es solo para tu control interno.
          </p>
          {matches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No hay partidos registrados aún</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map(match => {
                const isHome = match.home_team_id === team.id;
                const opponent = isHome ? match.away_team?.name : match.home_team?.name;
                const pago = pagos[match.id];
                const pagado = pago?.pagado ?? false;
                const st = STATUS_MAP[match.status] || { label: match.status, color: 'bg-slate-100 text-slate-700' };
                return (
                  <div key={match.id}
                    className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-colors ${pagado ? 'border-green-200 bg-green-50/40' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleTogglePago(match.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${pagado ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-green-400'}`}>
                        {pagado && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">vs {opponent || '—'}</p>
                        <p className="text-xs text-slate-400">{fmtDateTime(match.scheduled_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                      <span className={`text-xs font-semibold ${pagado ? 'text-green-600' : 'text-slate-400'}`}>
                        {pagado ? 'Pagado' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

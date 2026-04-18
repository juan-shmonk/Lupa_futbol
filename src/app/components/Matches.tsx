import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Eye, AlertCircle, CheckCircle, ArrowLeft, Plus, Save, Target, UserX, FileText, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Profile { id: string; full_name: string; }
interface Team { id: string; name: string; }
interface Referee { id: string; profile: Profile | null; }
interface MatchEvent {
  id: string;
  event_type: 'goal' | 'yellow_card' | 'red_card';
  minute: number | null;
  notes: string | null;
  player: { id: string; profile: Profile | null } | null;
  team: Team | null;
}
interface Match {
  id: string;
  league_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  referee_id: string | null;
  scheduled_at: string | null;
  field_name: string | null;
  field_address: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  rejection_reason: string | null;
  validated_at: string | null;
  home_team: Team | null;
  away_team: Team | null;
  referee: Referee | null;
  league: { id: string; name: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Programado',
  in_progress: 'En Juego',
  finished: 'Finalizado',
  pending_validation: 'Pendiente Validación',
  validated: 'Validado',
  rejected: 'Rechazado',
};
const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  finished: 'bg-slate-100 text-slate-700',
  pending_validation: 'bg-orange-100 text-orange-700',
  validated: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

interface MatchesProps { onNavigate: (view: string) => void; }

export function Matches({ onNavigate }: MatchesProps) {
  const [view, setView] = useState<'list' | 'detail' | 'schedule' | 'referee-panel'>('list');
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'in_progress' | 'pending_validation' | 'validated'>('all');
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [refereeProfileId, setRefereeProfileId] = useState<string | null>(null);

  // schedule form
  const [teams, setTeams] = useState<Team[]>([]);
  const [referees, setReferees] = useState<Referee[]>([]);
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([]);
  const [scheduleForm, setScheduleForm] = useState({ league_id: '', home_team_id: '', away_team_id: '', referee_id: '', scheduled_at: '', field_name: '', field_address: '' });
  const [schedSaving, setSchedSaving] = useState(false);

  // referee panel
  const [homeSquad, setHomeSquad] = useState<any[]>([]);
  const [awaySquad, setAwaySquad] = useState<any[]>([]);
  const [eventForm, setEventForm] = useState({ event_type: 'goal', team_id: '', player_id: '', minute: '', notes: '' });
  const [scoreForm, setScoreForm] = useState({ home_score: '', away_score: '', observations: '' });
  const [panelSaving, setPanelSaving] = useState(false);

  // validation
  const [rejectReason, setRejectReason] = useState('');
  const [validSaving, setValidSaving] = useState(false);

  useEffect(() => { loadInit(); }, []);

  const loadInit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setCurrentProfile(prof);
    setUserRole(prof?.role || '');
    // get referee record if user is arbitro
    if (prof?.role === 'arbitro') {
      const { data: ref } = await supabase.from('referees').select('id').eq('profile_id', user.id).single();
      setRefereeProfileId(ref?.id || null);
    }
    await fetchMatches();
  };

  const fetchMatches = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('matches')
      .select(`*, home_team:teams!matches_home_team_id_fkey(id, name), away_team:teams!matches_away_team_id_fkey(id, name), referee:referees!matches_referee_id_fkey(id, profile:profiles(id, full_name)), league:leagues(id, name)`)
      .order('scheduled_at', { ascending: false });
    setMatches((data as Match[]) || []);
    setLoading(false);
  };

  const fetchMatchEvents = async (matchId: string) => {
    const { data } = await supabase
      .from('match_events')
      .select('*, player:players(id, profile:profiles(id, full_name)), team:teams(id, name)')
      .eq('match_id', matchId)
      .order('minute');
    setEvents((data as MatchEvent[]) || []);
  };

  const fetchSquads = async (match: Match) => {
    const [{ data: h }, { data: a }] = await Promise.all([
      supabase.from('players').select('id, jersey_number, position, profile:profiles(id, full_name)').eq('team_id', match.home_team_id!),
      supabase.from('players').select('id, jersey_number, position, profile:profiles(id, full_name)').eq('team_id', match.away_team_id!),
    ]);
    setHomeSquad(h || []);
    setAwaySquad(a || []);
  };

  const openDetail = async (match: Match) => {
    setSelected(match);
    await fetchMatchEvents(match.id);
    setRejectReason('');
    setView('detail');
  };

  const openRefereePanel = async (match: Match) => {
    setSelected(match);
    await Promise.all([fetchMatchEvents(match.id), fetchSquads(match)]);
    setEventForm({ event_type: 'goal', team_id: '', player_id: '', minute: '', notes: '' });
    setScoreForm({ home_score: '', away_score: '', observations: '' });
    setView('referee-panel');
  };

  const loadScheduleForm = async () => {
    const [{ data: t }, { data: r }, { data: l }] = await Promise.all([
      supabase.from('teams').select('id, name').eq('status', 'active').order('name'),
      supabase.from('referees').select('id, profile:profiles(id, full_name)'),
      supabase.from('leagues').select('id, name').order('name'),
    ]);
    setTeams(t || []);
    setReferees((r as Referee[]) || []);
    setLeagues(l || []);
    setView('schedule');
  };

  const handleScheduleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSchedSaving(true);
    const { data, error } = await supabase
      .from('matches')
      .insert({ ...scheduleForm, league_id: scheduleForm.league_id || null, referee_id: scheduleForm.referee_id || null, status: 'scheduled' })
      .select().single();
    if (!error && data) {
      await supabase.from('audit_logs').insert({ user_id: currentProfile?.id, action: 'schedule_match', table_name: 'matches', record_id: data.id }).catch(() => {});
      await fetchMatches();
      setView('list');
    } else {
      alert('Error al programar partido: ' + error?.message);
    }
    setSchedSaving(false);
  };

  const handleStartMatch = async () => {
    if (!selected) return;
    const { error } = await supabase.from('matches').update({ status: 'in_progress' }).eq('id', selected.id);
    if (!error) {
      setSelected({ ...selected, status: 'in_progress' });
      await fetchMatches();
    }
  };

  const handleRegisterEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !eventForm.team_id || !eventForm.player_id) return;
    setPanelSaving(true);
    const { error } = await supabase.from('match_events').insert({
      match_id: selected.id,
      event_type: eventForm.event_type,
      team_id: eventForm.team_id,
      player_id: eventForm.player_id,
      minute: eventForm.minute ? parseInt(eventForm.minute) : null,
      notes: eventForm.notes || null,
      referee_id: refereeProfileId,
    });
    if (!error) {
      setEventForm({ event_type: 'goal', team_id: '', player_id: '', minute: '', notes: '' });
      await fetchMatchEvents(selected.id);
    } else {
      alert('Error: ' + error.message);
    }
    setPanelSaving(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!selected) return;
    await supabase.from('match_events').delete().eq('id', eventId);
    await fetchMatchEvents(selected.id);
  };

  const handleFinalizeMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (scoreForm.home_score === '' || scoreForm.away_score === '') { alert('Ingresa el marcador final'); return; }
    setPanelSaving(true);
    const { error } = await supabase.from('matches').update({
      home_score: parseInt(scoreForm.home_score),
      away_score: parseInt(scoreForm.away_score),
      status: 'pending_validation',
    }).eq('id', selected.id);

    if (!error) {
      // Create or update match_report
      await supabase.from('match_reports').upsert({
        match_id: selected.id,
        referee_id: refereeProfileId,
        observations: scoreForm.observations || null,
        is_closed: true,
        closed_at: new Date().toISOString(),
      }, { onConflict: 'match_id' });
      await supabase.from('audit_logs').insert({ user_id: currentProfile?.id, action: 'close_match_report', table_name: 'matches', record_id: selected.id }).catch(() => {});
      await fetchMatches();
      setView('list');
    } else {
      alert('Error al finalizar: ' + error.message);
    }
    setPanelSaving(false);
  };

  const handleValidate = async () => {
    if (!selected) return;
    setValidSaving(true);
    const { error } = await supabase.from('matches').update({ status: 'validated', validated_by: currentProfile?.id, validated_at: new Date().toISOString() }).eq('id', selected.id);
    if (!error) {
      await supabase.from('audit_logs').insert({ user_id: currentProfile?.id, action: 'validate_match', table_name: 'matches', record_id: selected.id }).catch(() => {});
      await fetchMatches();
      setView('list');
    } else {
      alert('Error: ' + error.message);
    }
    setValidSaving(false);
  };

  const handleReject = async () => {
    if (!selected || !rejectReason.trim()) { alert('Escribe el motivo de rechazo'); return; }
    setValidSaving(true);
    const { error } = await supabase.from('matches').update({ status: 'rejected', rejection_reason: rejectReason, validated_by: currentProfile?.id, validated_at: new Date().toISOString() }).eq('id', selected.id);
    if (!error) {
      await supabase.from('audit_logs').insert({ user_id: currentProfile?.id, action: 'reject_match', table_name: 'matches', record_id: selected.id, new_value: rejectReason }).catch(() => {});
      await fetchMatches();
      setView('list');
    } else {
      alert('Error: ' + error.message);
    }
    setValidSaving(false);
  };

  const isMyMatch = (m: Match) => m.referee?.profile?.id === currentProfile?.id || refereeProfileId === m.referee_id;
  const canManage = userRole === 'admin_plataforma' || userRole === 'director_liga';
  const filteredMatches = matches.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const selectedSquad = (teamId: string) => teamId === selected?.home_team_id ? homeSquad : awaySquad;

  const fmtDate = (dt: string | null) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const eventIcon = (type: string) => {
    if (type === 'goal') return <Target className="w-4 h-4 text-green-600" />;
    if (type === 'yellow_card') return <div className="w-4 h-5 bg-yellow-400 rounded-sm" />;
    return <div className="w-4 h-5 bg-red-500 rounded-sm" />;
  };

  // ── SCHEDULE ──
  if (view === 'schedule') {
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Programar Partido</h2>
          <form onSubmit={handleScheduleMatch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Liga</label>
              <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={scheduleForm.league_id} onChange={e => setScheduleForm({ ...scheduleForm, league_id: e.target.value })}>
                <option value="">Sin liga</option>
                {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Equipo local *</label>
                <select required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={scheduleForm.home_team_id} onChange={e => setScheduleForm({ ...scheduleForm, home_team_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {teams.filter(t => t.id !== scheduleForm.away_team_id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Equipo visitante *</label>
                <select required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={scheduleForm.away_team_id} onChange={e => setScheduleForm({ ...scheduleForm, away_team_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {teams.filter(t => t.id !== scheduleForm.home_team_id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Árbitro</label>
              <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={scheduleForm.referee_id} onChange={e => setScheduleForm({ ...scheduleForm, referee_id: e.target.value })}>
                <option value="">Sin árbitro asignado</option>
                {referees.map(r => <option key={r.id} value={r.id}>{r.profile?.full_name || r.id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha y hora *</label>
              <input required type="datetime-local"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={scheduleForm.scheduled_at} onChange={e => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del campo *</label>
              <input required type="text" placeholder="Ej: Campo Municipal Norte"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={scheduleForm.field_name} onChange={e => setScheduleForm({ ...scheduleForm, field_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dirección del campo</label>
              <input type="text" placeholder="Ej: Calle Independencia 123, Colonia Centro"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={scheduleForm.field_address} onChange={e => setScheduleForm({ ...scheduleForm, field_address: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={schedSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50">
                <Save className="w-4 h-4" /> {schedSaving ? 'Guardando...' : 'Programar Partido'}
              </button>
              <button type="button" onClick={() => setView('list')}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── REFEREE PANEL ──
  if (view === 'referee-panel' && selected) {
    const currentSquad = eventForm.team_id ? selectedSquad(eventForm.team_id) : [];
    const goalCount = (teamId: string) => events.filter(e => e.event_type === 'goal' && e.team?.id === teamId).length;

    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-4xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium uppercase tracking-wide">Panel del Árbitro</p>
              <h2 className="text-xl font-bold text-white mt-1">{selected.home_team?.name} vs {selected.away_team?.name}</h2>
              <p className="text-amber-100 text-sm mt-1">{selected.field_name}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">
                {goalCount(selected.home_team_id || '')} — {goalCount(selected.away_team_id || '')}
              </div>
              <p className="text-amber-100 text-xs mt-1">marcador actual</p>
            </div>
          </div>
          {selected.status === 'scheduled' && (
            <button onClick={handleStartMatch}
              className="mt-4 px-5 py-2 bg-white text-amber-700 font-semibold rounded-lg hover:bg-amber-50 text-sm transition-colors">
              Iniciar Partido
            </button>
          )}
        </div>

        {selected.status === 'in_progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Register Event */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Registrar Evento</h3>
              <form onSubmit={handleRegisterEvent} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de evento</label>
                  <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={eventForm.event_type} onChange={e => setEventForm({ ...eventForm, event_type: e.target.value })}>
                    <option value="goal">Gol</option>
                    <option value="yellow_card">Tarjeta Amarilla</option>
                    <option value="red_card">Tarjeta Roja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Equipo *</label>
                  <select required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={eventForm.team_id} onChange={e => setEventForm({ ...eventForm, team_id: e.target.value, player_id: '' })}>
                    <option value="">Seleccionar equipo...</option>
                    <option value={selected.home_team_id || ''}>{selected.home_team?.name} (Local)</option>
                    <option value={selected.away_team_id || ''}>{selected.away_team?.name} (Visitante)</option>
                  </select>
                </div>
                {eventForm.team_id && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jugador *</label>
                    <select required className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      value={eventForm.player_id} onChange={e => setEventForm({ ...eventForm, player_id: e.target.value })}>
                      <option value="">Seleccionar jugador...</option>
                      {currentSquad.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.jersey_number ? `#${p.jersey_number} ` : ''}{p.profile?.full_name}
                        </option>
                      ))}
                    </select>
                    {currentSquad.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">Este equipo no tiene jugadores registrados en su plantilla</p>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Minuto</label>
                  <input type="number" min="1" max="120" placeholder="Ej: 45"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={eventForm.minute} onChange={e => setEventForm({ ...eventForm, minute: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
                  <input type="text" placeholder="Observación del evento"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={eventForm.notes} onChange={e => setEventForm({ ...eventForm, notes: e.target.value })} />
                </div>
                <button type="submit" disabled={panelSaving}
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50">
                  {panelSaving ? 'Registrando...' : 'Registrar Evento'}
                </button>
              </form>
            </div>

            {/* Events so far */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Eventos registrados ({events.length})</h3>
              {events.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-6">Sin eventos aún</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {events.map(ev => (
                    <div key={ev.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      ev.event_type === 'goal' ? 'bg-green-50' : ev.event_type === 'yellow_card' ? 'bg-yellow-50' : 'bg-red-50'
                    }`}>
                      <div className="flex items-center gap-3">
                        {eventIcon(ev.event_type)}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{ev.player?.profile?.full_name || '—'}</p>
                          <p className="text-xs text-slate-500">{ev.team?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ev.minute && <span className="text-xs font-medium text-slate-500">{ev.minute}'</span>}
                        <button onClick={() => handleDeleteEvent(ev.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Finalize match */}
        {selected.status === 'in_progress' && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" /> Cerrar Acta y Finalizar Partido
            </h3>
            <form onSubmit={handleFinalizeMatch} className="space-y-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-center">{selected.home_team?.name}</label>
                  <input required type="number" min="0" placeholder="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={scoreForm.home_score} onChange={e => setScoreForm({ ...scoreForm, home_score: e.target.value })} />
                </div>
                <div className="text-center text-3xl text-slate-400 font-bold">—</div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 text-center">{selected.away_team?.name}</label>
                  <input required type="number" min="0" placeholder="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={scoreForm.away_score} onChange={e => setScoreForm({ ...scoreForm, away_score: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones del partido</label>
                <textarea rows={3} placeholder="Describe incidencias relevantes del partido..."
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  value={scoreForm.observations} onChange={e => setScoreForm({ ...scoreForm, observations: e.target.value })} />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                Al cerrar el acta el partido queda en <strong>Pendiente Validación</strong> y el director de liga podrá validarlo o rechazarlo.
              </div>
              <button type="submit" disabled={panelSaving}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold disabled:opacity-50">
                {panelSaving ? 'Cerrando acta...' : 'Finalizar Partido y Enviar a Validación'}
              </button>
            </form>
          </div>
        )}

        {(selected.status === 'scheduled') && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-slate-500 text-sm">
            Inicia el partido primero para poder registrar eventos.
          </div>
        )}
      </div>
    );
  }

  // ── DETAIL ──
  if (view === 'detail' && selected) {
    const m = selected;
    const isDirector = canManage;
    const goalCount = (teamId: string) => events.filter(e => e.event_type === 'goal' && e.team?.id === teamId).length;

    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Volver a partidos
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900">Detalle del Partido</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[m.status]}`}>
              {STATUS_LABELS[m.status]}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center mb-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="font-bold text-green-700">{m.home_team?.name?.slice(0, 2).toUpperCase()}</span>
              </div>
              <p className="font-semibold text-slate-900 text-sm">{m.home_team?.name}</p>
              <p className="text-xs text-slate-400">Local</p>
            </div>
            <div className="text-center">
              {m.home_score !== null ? (
                <div className="text-4xl font-bold text-slate-900">{m.home_score} — {m.away_score}</div>
              ) : (
                <div className="text-2xl text-slate-300 font-bold">VS</div>
              )}
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="font-bold text-blue-700">{m.away_team?.name?.slice(0, 2).toUpperCase()}</span>
              </div>
              <p className="font-semibold text-slate-900 text-sm">{m.away_team?.name}</p>
              <p className="text-xs text-slate-400">Visitante</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{fmtDate(m.scheduled_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600">{m.field_name || '—'}</span>
            </div>
            {m.field_address && (
              <div className="flex items-center gap-2 col-span-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">{m.field_address}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Árbitro:</span>
              <span className="text-slate-700 font-medium">{m.referee?.profile?.full_name || 'Sin asignar'}</span>
            </div>
            {m.league && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Liga:</span>
                <span className="text-slate-700 font-medium">{m.league.name}</span>
              </div>
            )}
          </div>

          {m.rejection_reason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800">Motivo de rechazo:</p>
              <p className="text-sm text-red-700 mt-1">{m.rejection_reason}</p>
            </div>
          )}
        </div>

        {/* Events */}
        {events.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Eventos del Partido</h3>
            <div className="space-y-2">
              {events.map(ev => (
                <div key={ev.id} className={`flex items-center justify-between p-3 rounded-lg ${
                  ev.event_type === 'goal' ? 'bg-green-50' : ev.event_type === 'yellow_card' ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center gap-3">
                    {eventIcon(ev.event_type)}
                    <div>
                      <p className="text-sm font-medium text-slate-900">{ev.player?.profile?.full_name || '—'}</p>
                      <p className="text-xs text-slate-500">{ev.team?.name} · {ev.event_type === 'goal' ? 'Gol' : ev.event_type === 'yellow_card' ? 'Tarjeta Amarilla' : 'Tarjeta Roja'}</p>
                    </div>
                  </div>
                  {ev.minute && <span className="text-sm font-medium text-slate-500">{ev.minute}'</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation panel for director */}
        {isDirector && m.status === 'pending_validation' && (
          <div className="bg-white rounded-xl border border-amber-200 p-6">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" /> Validar Acta
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de rechazo (solo si se rechaza)</label>
              <textarea rows={2} placeholder="Describe por qué se rechaza el acta..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={handleValidate} disabled={validSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50">
                <CheckCircle className="w-4 h-4" /> Validar Partido
              </button>
              <button onClick={handleReject} disabled={validSaving || !rejectReason.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50">
                <XCircle className="w-4 h-4" /> Rechazar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LIST ──
  const pendingCount = matches.filter(m => m.status === 'pending_validation').length;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Partidos</h2>
          <p className="text-sm text-slate-500 mt-1">{matches.length} partidos registrados</p>
        </div>
        {canManage && (
          <button onClick={loadScheduleForm}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <Plus className="w-5 h-5" /> Programar Partido
          </button>
        )}
      </div>

      {pendingCount > 0 && (canManage) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{pendingCount} partido{pendingCount > 1 ? 's' : ''}</span> esperando validación.
            <button onClick={() => setFilter('pending_validation')} className="ml-2 underline">Ver ahora</button>
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'scheduled', label: 'Programados' },
          { key: 'in_progress', label: 'En Juego' },
          { key: 'pending_validation', label: 'Pendientes' },
          { key: 'validated', label: 'Validados' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === f.key ? 'bg-green-500 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}>
            {f.label}
            {f.key === 'pending_validation' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-xs">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando partidos...</div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No hay partidos en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map(match => (
            <div key={match.id} className="bg-white rounded-xl border border-slate-200 p-4 lg:p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[match.status]}`}>
                      {STATUS_LABELS[match.status]}
                    </span>
                    {match.league && <span className="px-2.5 py-1 rounded-full text-xs bg-slate-100 text-slate-600">{match.league.name}</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center mb-3">
                    <p className="font-semibold text-slate-900 text-right">{match.home_team?.name || '—'}</p>
                    <div className="text-center">
                      {match.home_score !== null ? (
                        <span className="text-2xl font-bold text-green-600">{match.home_score} — {match.away_score}</span>
                      ) : (
                        <span className="text-lg text-slate-300 font-bold">VS</span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900">{match.away_team?.name || '—'}</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{fmtDate(match.scheduled_at)}</span>
                    {match.field_name && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{match.field_name}</span>}
                    {match.referee?.profile && <span>Árb: {match.referee.profile.full_name}</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openDetail(match)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition-colors">
                    <Eye className="w-4 h-4" /> Ver
                  </button>
                  {isMyMatch(match) && (match.status === 'scheduled' || match.status === 'in_progress') && (
                    <button onClick={() => openRefereePanel(match)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm transition-colors">
                      <FileText className="w-4 h-4" /> Panel Árbitro
                    </button>
                  )}
                  {canManage && match.status === 'pending_validation' && (
                    <button onClick={() => openDetail(match)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors">
                      <CheckCircle className="w-4 h-4" /> Validar
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

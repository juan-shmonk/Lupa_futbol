import { useState, useEffect } from 'react';
import { Trophy, Plus, ArrowLeft, Calendar, CheckCircle, Clock, ChevronRight, Send, Users, Flag } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Team { id: string; name: string; }
interface Referee { id: string; profile: { full_name: string } | null; }
interface Tournament {
  id: string;
  name: string;
  format: 'liga' | 'eliminacion';
  num_legs: number;
  status: 'draft' | 'active' | 'finished';
  created_at: string;
}
interface TournamentRound {
  id: string;
  tournament_id: string;
  round_number: number;
  name: string;
  status: 'draft' | 'published';
  published_at: string | null;
}
interface RoundMatch {
  id: string;
  home_team_id: string;
  away_team_id: string;
  scheduled_at: string | null;
  field_name: string | null;
  referee_id: string | null;
  status: string;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
  referee: { id: string; profile: { full_name: string } | null } | null;
}

// ── Round-robin algorithm ──────────────────────────────────────────────────────
function buildRoundRobin(ids: string[]): Array<Array<[string, string]>> {
  const t = ids.length % 2 === 0 ? [...ids] : [...ids, '__bye__'];
  const n = t.length;
  const rounds: Array<Array<[string, string]>> = [];
  for (let r = 0; r < n - 1; r++) {
    const round: Array<[string, string]> = [];
    for (let i = 0; i < n / 2; i++) {
      const home = t[i], away = t[n - 1 - i];
      if (home !== '__bye__' && away !== '__bye__') round.push([home, away]);
    }
    rounds.push(round);
    t.splice(1, 0, t.pop()!);
  }
  return rounds;
}

function buildFixtures(ids: string[], numLegs: number): Array<Array<[string, string]>> {
  const leg1 = buildRoundRobin(ids);
  if (numLegs === 1) return leg1;
  return [...leg1, ...leg1.map(r => r.map(([h, a]) => [a, h] as [string, string]))];
}

function roundLabel(format: string, numLegs: number, totalRounds: number, idx: number): string {
  if (format === 'eliminacion') {
    const rem = totalRounds - idx;
    if (rem === 1) return 'Final';
    if (rem === 2) return 'Semifinal';
    if (rem === 4) return 'Cuartos de Final';
    if (rem === 8) return 'Octavos de Final';
    return `Ronda ${idx + 1}`;
  }
  if (numLegs === 2) {
    const half = totalRounds / 2;
    if (idx < half) return `Jornada ${idx + 1} (Ida)`;
    return `Jornada ${idx - half + 1} (Vuelta)`;
  }
  return `Jornada ${idx + 1}`;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function Tournaments() {
  type View = 'list' | 'create' | 'detail' | 'round';
  const [view, setView] = useState<View>('list');
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [allReferees, setAllReferees] = useState<Referee[]>([]);

  // Wizard
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', format: 'liga' as 'liga' | 'eliminacion', numLegs: 1, teamIds: [] as string[] });
  const [preview, setPreview] = useState<Array<Array<[string, string]>>>([]);
  const [creating, setCreating] = useState(false);

  // Detail
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [rounds, setRounds] = useState<TournamentRound[]>([]);

  // Round
  const [round, setRound] = useState<TournamentRound | null>(null);
  const [matches, setMatches] = useState<RoundMatch[]>([]);
  const [edits, setEdits] = useState<Record<string, { scheduled_at: string; field_name: string; referee_id: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => { init(); }, []);

  const init = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setCurrentProfile(prof);

    const [{ data: teams }, { data: refs }, { data: tourns }] = await Promise.all([
      supabase.from('teams').select('id, name').eq('status', 'active').order('name'),
      supabase.from('referees').select('id, profile:profiles(full_name)').order('id'),
      supabase.from('tournaments').select('*').order('created_at', { ascending: false }),
    ]);

    setAllTeams((teams as Team[]) || []);
    setAllReferees((refs as Referee[]) || []);
    setTournaments((tourns as Tournament[]) || []);
    setLoading(false);
  };

  const openTournament = async (t: Tournament) => {
    setTournament(t);
    const { data } = await supabase.from('tournament_rounds').select('*').eq('tournament_id', t.id).order('round_number');
    setRounds((data as TournamentRound[]) || []);
    setView('detail');
  };

  const openRound = async (r: TournamentRound) => {
    setRound(r);
    const { data, error } = await supabase
      .from('matches')
      .select('id, home_team_id, away_team_id, scheduled_at, field_name, referee_id, status')
      .eq('round_id', r.id)
      .order('home_team_id');

    if (error) {
      alert('Error al cargar partidos: ' + error.message);
      setMatches([]);
      setView('round');
      return;
    }

    const ms: RoundMatch[] = (data || []).map(m => ({
      ...m,
      home_team: allTeams.find(t => t.id === m.home_team_id) ?? null,
      away_team: allTeams.find(t => t.id === m.away_team_id) ?? null,
      referee: allReferees.find(ref => ref.id === m.referee_id) ?? null,
    }));

    setMatches(ms);
    const init: Record<string, any> = {};
    ms.forEach(m => {
      init[m.id] = {
        scheduled_at: m.scheduled_at ? m.scheduled_at.slice(0, 16) : '',
        field_name: m.field_name || '',
        referee_id: m.referee_id || '',
      };
    });
    setEdits(init);
    setView('round');
  };

  const saveMatch = async (id: string) => {
    const e = edits[id];
    if (!e) return;
    setSavingId(id);
    const { error } = await supabase.from('matches').update({
      scheduled_at: e.scheduled_at || null,
      field_name: e.field_name || null,
      referee_id: e.referee_id || null,
    }).eq('id', id);
    if (error) {
      alert('Error al guardar: ' + error.message);
    } else {
      setMatches(prev => prev.map(m => m.id !== id ? m : {
        ...m,
        scheduled_at: e.scheduled_at || null,
        field_name: e.field_name || null,
        referee_id: e.referee_id || null,
        referee: allReferees.find(r => r.id === e.referee_id) ?? null,
      }));
    }
    setSavingId(null);
  };

  const finalizeTournament = async () => {
    if (!tournament) return;
    if (!confirm(`¿Finalizar el torneo "${tournament.name}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('tournaments').update({ status: 'finished' }).eq('id', tournament.id);
    if (error) { alert('Error: ' + error.message); return; }
    const updated = { ...tournament, status: 'finished' as const };
    setTournament(updated);
    setTournaments(prev => prev.map(t => t.id === tournament.id ? updated : t));
  };

  const publishRound = async () => {
    if (!round) return;
    setPublishing(true);
    await supabase.from('tournament_rounds').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', round.id);
    const updated = { ...round, status: 'published' as const };
    setRound(updated);
    setRounds(prev => prev.map(r => r.id === round.id ? updated : r));
    setPublishing(false);
  };

  const createTournament = async () => {
    if (!currentProfile) return;
    setCreating(true);

    const { data: t, error } = await supabase.from('tournaments').insert({
      name: form.name,
      format: form.format,
      num_legs: form.numLegs,
      status: 'active',
      created_by: currentProfile.id,
    }).select().single();

    if (error || !t) { alert('Error al crear el torneo: ' + error?.message); setCreating(false); return; }

    await supabase.from('tournament_teams').insert(form.teamIds.map(tid => ({ tournament_id: t.id, team_id: tid })));

    const fixtures = form.format === 'liga'
      ? buildFixtures(form.teamIds, form.numLegs)
      : preview;

    for (let i = 0; i < fixtures.length; i++) {
      const name = roundLabel(form.format, form.numLegs, fixtures.length, i);
      const { data: rnd, error: rndErr } = await supabase.from('tournament_rounds').insert({
        tournament_id: t.id, round_number: i + 1, name, status: 'draft',
      }).select().single();
      if (rndErr || !rnd) { alert(`Error al crear ${name}: ${rndErr?.message}`); setCreating(false); return; }
      if (fixtures[i].length > 0) {
        const { error: mErr } = await supabase.from('matches').insert(
          fixtures[i].map(([h, a]) => ({
            tournament_id: t.id, round_id: rnd.id,
            home_team_id: h, away_team_id: a, status: 'scheduled',
          }))
        );
        if (mErr) { alert(`Error al crear partidos de ${name}: ${mErr.message}`); setCreating(false); return; }
      }
    }

    await init();
    const { data: fresh } = await supabase.from('tournaments').select('*').eq('id', t.id).single();
    setCreating(false);
    resetWizard();
    if (fresh) openTournament(fresh as Tournament);
  };

  const resetWizard = () => {
    setStep(1);
    setForm({ name: '', format: 'liga', numLegs: 1, teamIds: [] });
    setPreview([]);
  };

  const goToPreview = () => {
    const fixtures = form.format === 'liga' ? buildFixtures(form.teamIds, form.numLegs) : [];
    setPreview(fixtures);
    setStep(3);
  };

  const teamName = (id: string) => allTeams.find(t => t.id === id)?.name || '—';

  const toggleTeam = (id: string) =>
    setForm(f => ({ ...f, teamIds: f.teamIds.includes(id) ? f.teamIds.filter(x => x !== id) : [...f.teamIds, id] }));

  // ── VIEW: ROUND ──────────────────────────────────────────────────────────────
  if (view === 'round' && round && tournament) {
    const isPublished = round.status === 'published';
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
        <button onClick={() => setView('detail')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver al torneo
        </button>

        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-5 text-white">
          <p className="text-violet-200 text-sm mb-1">{tournament.name}</p>
          <h2 className="text-xl font-bold">{round.name}</h2>
          <span className={`mt-2 inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${isPublished ? 'bg-green-400/80' : 'bg-white/20'}`}>
            {isPublished ? 'Publicada' : 'Borrador'}
          </span>
        </div>

        {matches.length === 0 && (
          <div className="py-12 text-center text-slate-400">No hay partidos en esta jornada.</div>
        )}

        <div className="space-y-4">
          {matches.map(m => (
            <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <span className="font-bold text-slate-900 text-right flex-1">{m.home_team?.name ?? '—'}</span>
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500">VS</span>
                <span className="font-bold text-slate-900 text-left flex-1">{m.away_team?.name ?? '—'}</span>
              </div>

              {isPublished ? (
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 justify-center">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Sin fecha'}
                  </span>
                  {m.field_name && <span>📍 {m.field_name}</span>}
                  {m.referee?.profile?.full_name && <span>🏁 {m.referee.profile.full_name}</span>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha y hora</label>
                    <input type="datetime-local"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={edits[m.id]?.scheduled_at || ''}
                      onChange={e => setEdits(prev => ({ ...prev, [m.id]: { ...prev[m.id], scheduled_at: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cancha / Campo</label>
                    <input type="text" placeholder="Estadio Municipal"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={edits[m.id]?.field_name || ''}
                      onChange={e => setEdits(prev => ({ ...prev, [m.id]: { ...prev[m.id], field_name: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Árbitro</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={edits[m.id]?.referee_id || ''}
                      onChange={e => setEdits(prev => ({ ...prev, [m.id]: { ...prev[m.id], referee_id: e.target.value } }))}>
                      <option value="">Sin árbitro</option>
                      {allReferees.map(r => (
                        <option key={r.id} value={r.id}>{r.profile?.full_name ?? r.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {!isPublished && (
                <div className="flex justify-end">
                  <button onClick={() => saveMatch(m.id)} disabled={savingId === m.id}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium disabled:opacity-50">
                    {savingId === m.id ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {!isPublished && matches.length > 0 && (
          <button onClick={publishRound} disabled={publishing}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" />
            {publishing ? 'Publicando...' : 'Publicar Jornada'}
          </button>
        )}
      </div>
    );
  }

  // ── VIEW: DETAIL ─────────────────────────────────────────────────────────────
  if (view === 'detail' && tournament) {
    const publishedCount = rounds.filter(r => r.status === 'published').length;
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
          <ArrowLeft className="w-4 h-4" /> Volver a torneos
        </button>

        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-violet-200 text-sm mb-1">
            {tournament.format === 'liga' ? 'Liga' : 'Eliminación Directa'}
            {tournament.format === 'liga' && (tournament.num_legs === 2 ? ' · Ida y vuelta' : ' · Una vuelta')}
          </p>
          <h2 className="text-2xl font-bold">{tournament.name}</h2>
          <div className="mt-3 flex gap-4 text-sm text-violet-200">
            <span>{rounds.length} jornadas</span>
            <span>{publishedCount} publicadas</span>
          </div>
        </div>

        {rounds.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No hay jornadas generadas.</div>
        ) : (
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Jornadas</h3>
            <div className="space-y-2">
              {rounds.map(r => (
                <button key={r.id} onClick={() => openRound(r)}
                  className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    {r.status === 'published'
                      ? <CheckCircle className="w-5 h-5 text-green-500" />
                      : <Clock className="w-5 h-5 text-slate-400" />}
                    <div>
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.status === 'published' ? 'Publicada' : 'Pendiente de horarios'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {tournament.status === 'active' && (
          <button onClick={finalizeTournament}
            className="w-full py-3 border-2 border-slate-300 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 rounded-xl font-medium text-sm transition-colors">
            Finalizar torneo
          </button>
        )}

        {tournament.status === 'finished' && (
          <div className="flex items-center justify-center gap-2 py-3 bg-slate-100 rounded-xl text-sm text-slate-500 font-medium">
            <CheckCircle className="w-4 h-4 text-green-500" /> Torneo finalizado
          </div>
        )}
      </div>
    );
  }

  // ── VIEW: CREATE WIZARD ──────────────────────────────────────────────────────
  if (view === 'create') {
    const fixtureCount = form.format === 'liga' ? buildFixtures(form.teamIds, form.numLegs).length : 0;
    const matchesPerRound = Math.floor(form.teamIds.length / 2);

    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
        <button onClick={() => { setView('list'); resetWizard(); }}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm">
          <ArrowLeft className="w-4 h-4" /> Cancelar
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-900">Nuevo Torneo</h2>
          <div className="flex gap-1.5 mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${step >= s ? 'bg-violet-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Paso {step} de 3</p>
        </div>

        {/* STEP 1: Nombre */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del torneo</label>
              <input type="text" placeholder="Ej: Torneo Apertura 2025"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>
            <button disabled={!form.name.trim()} onClick={() => setStep(2)}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold disabled:opacity-40">
              Siguiente
            </button>
          </div>
        )}

        {/* STEP 2: Formato y equipos */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Formato</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 'liga', label: 'Liga (todos vs todos)', desc: 'Round-robin automático. Cada equipo enfrenta a todos los demás.' },
                  { val: 'eliminacion', label: 'Eliminación directa', desc: 'Cuartos, semis y final. Ideal para liguillas al final de la temporada.' },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setForm(f => ({ ...f, format: opt.val as any }))}
                    className={`p-4 border-2 rounded-xl text-left transition-colors ${form.format === opt.val ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <p className="font-semibold text-sm text-slate-900">{opt.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {form.format === 'liga' && (
              <div>
                <p className="text-sm font-medium text-slate-700 mb-2">Vueltas</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: 1, label: 'Una vuelta', desc: 'Cada partido se juega una sola vez.' },
                    { val: 2, label: 'Ida y vuelta', desc: 'Cada enfrentamiento se repite con equipos invertidos.' },
                  ].map(opt => (
                    <button key={opt.val} onClick={() => setForm(f => ({ ...f, numLegs: opt.val }))}
                      className={`p-3 border-2 rounded-xl text-left transition-colors ${form.numLegs === opt.val ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-semibold text-sm text-slate-900">{opt.label}</p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">
                Equipos participantes <span className="text-violet-600 font-bold">({form.teamIds.length} seleccionados)</span>
              </p>
              {allTeams.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No hay equipos activos en el sistema.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {allTeams.map(team => {
                    const sel = form.teamIds.includes(team.id);
                    return (
                      <button key={team.id} onClick={() => toggleTeam(team.id)}
                        className={`w-full flex items-center gap-3 p-3 border-2 rounded-lg text-left transition-colors ${sel ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${sel ? 'bg-violet-500 border-violet-500' : 'border-slate-300'}`}>
                          {sel && <CheckCircle className="w-3 h-3 text-white fill-white" />}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{team.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {form.teamIds.length >= 2 && form.format === 'liga' && (
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-3 text-sm text-violet-800">
                Se generarán <strong>{fixtureCount} jornadas</strong> con <strong>{matchesPerRound}</strong> partido{matchesPerRound !== 1 ? 's' : ''} cada una
                {form.teamIds.length % 2 !== 0 && ' (un equipo descansa por jornada)'}.
              </div>
            )}

            <button disabled={form.teamIds.length < 2} onClick={goToPreview}
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold disabled:opacity-40">
              Ver resumen
            </button>
          </div>
        )}

        {/* STEP 3: Preview y confirmar */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Torneo</span><span className="font-semibold text-slate-900">{form.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Formato</span><span className="font-semibold text-slate-900">{form.format === 'liga' ? 'Liga (round-robin)' : 'Eliminación directa'}</span></div>
              {form.format === 'liga' && <div className="flex justify-between"><span className="text-slate-500">Vueltas</span><span className="font-semibold text-slate-900">{form.numLegs === 2 ? 'Ida y vuelta' : 'Una vuelta'}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">Equipos</span><span className="font-semibold text-slate-900">{form.teamIds.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Jornadas</span><span className="font-semibold text-slate-900">{preview.length}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total de partidos</span><span className="font-semibold text-slate-900">{preview.reduce((s, r) => s + r.length, 0)}</span></div>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {preview.map((rnd, ri) => (
                <div key={ri} className="bg-white border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    {roundLabel(form.format, form.numLegs, preview.length, ri)}
                  </p>
                  <div className="space-y-2">
                    {rnd.map(([h, a], mi) => (
                      <div key={mi} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 text-right text-slate-800 font-medium">{teamName(h)}</span>
                        <span className="text-xs text-slate-400 px-1">vs</span>
                        <span className="flex-1 text-slate-800 font-medium">{teamName(a)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium">
                Atrás
              </button>
              <button onClick={createTournament} disabled={creating}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold disabled:opacity-50">
                {creating ? 'Creando...' : 'Crear Torneo'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── VIEW: LIST ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Torneos y Jornadas</h2>
          <p className="text-sm text-slate-500 mt-0.5">Genera emparejamientos y programa los partidos por jornada</p>
        </div>
        <button onClick={() => setView('create')}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium text-sm">
          <Plus className="w-4 h-4" /> Nuevo Torneo
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Cargando...</div>
      ) : tournaments.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flag className="w-7 h-7 text-violet-500" />
          </div>
          <p className="font-semibold text-slate-600">No hay torneos creados</p>
          <p className="text-sm text-slate-400 mt-1">Crea el primer torneo para organizar jornadas automáticamente</p>
          <button onClick={() => setView('create')}
            className="mt-5 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium text-sm">
            Crear primer torneo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tournaments.map(t => (
            <button key={t.id} onClick={() => openTournament(t)}
              className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.format === 'liga' ? 'Liga' : 'Eliminación'} · {t.num_legs === 2 ? 'Ida y vuelta' : 'Una vuelta'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.status === 'active' ? 'bg-green-100 text-green-700' : t.status === 'finished' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>
                  {t.status === 'active' ? 'Activo' : t.status === 'finished' ? 'Finalizado' : 'Borrador'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Trophy, Star, CheckCircle, XCircle, ArrowLeft, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Profile { id: string; full_name: string; email: string; city: string | null; }
interface RefereeRow {
  id: string;
  profile_id: string;
  license_number: string | null;
  experience_years: number | null;
  city: string | null;
  state: string | null;
  approved_at: string | null;
  profile: Profile | null;
  avg_score: number | null;
  total_matches: number;
  total_ratings: number;
}

const stars = (score: number) => {
  const full = Math.round(score);
  return Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={`w-4 h-4 ${i < full ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
  ));
};

export function Referees() {
  const [view, setView] = useState<'list' | 'profile' | 'pending'>('list');
  const [referees, setReferees] = useState<RefereeRow[]>([]);
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [selected, setSelected] = useState<RefereeRow | null>(null);
  const [selectedRatings, setSelectedRatings] = useState<any[]>([]);
  const [refereeMatches, setRefereeMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [myPlayer, setMyPlayer] = useState<any>(null);

  // Rating form
  const [ratingForm, setRatingForm] = useState({ score: 5, comment: '' });
  const [canRateSelected, setCanRateSelected] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [ratingSaving, setRatingSaving] = useState(false);

  useEffect(() => { loadInit(); }, []);

  const loadInit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    setCurrentProfile(prof);
    setUserRole(prof?.role || '');
    if (prof?.role === 'jugador') {
      const { data: pl } = await supabase.from('players').select('id, team_id').eq('profile_id', user.id).single();
      setMyPlayer(pl);
    }
    await fetchReferees();
  };

  const fetchReferees = async () => {
    setLoading(true);
    const { data: refs } = await supabase.from('referees').select('*, profile:profiles(id, full_name, email, city)');

    if (!refs) { setLoading(false); return; }

    const enriched = await Promise.all(refs.map(async r => {
      const { data: ratings } = await supabase.from('referee_ratings').select('score').eq('referee_id', r.id);
      const { count: matchCount } = await supabase
        .from('matches').select('id', { count: 'exact', head: true }).eq('referee_id', r.id).eq('status', 'validated');
      const scores = (ratings || []).map(x => x.score);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      return {
        ...r,
        avg_score: avg ? Math.round(avg * 10) / 10 : null,
        total_ratings: scores.length,
        total_matches: matchCount ?? 0,
      } as RefereeRow;
    }));

    setReferees(enriched);
    setLoading(false);
  };

  const fetchPendingUsers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email, city').eq('role', 'arbitro').eq('status', 'pending');
    setPendingUsers(data || []);
  };

  const openProfile = async (ref: RefereeRow) => {
    setSelected(ref);
    const { data: ratings } = await supabase
      .from('referee_ratings')
      .select('score, comment, created_at, player:players(profile:profiles(full_name))')
      .eq('referee_id', ref.id)
      .order('created_at', { ascending: false });
    setSelectedRatings(ratings || []);

    const { data: matchesData } = await supabase
      .from('matches')
      .select('id, scheduled_at, status, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name), home_score, away_score')
      .eq('referee_id', ref.id)
      .order('scheduled_at', { ascending: false })
      .limit(10);
    setRefereeMatches(matchesData || []);

    // Check if current player can rate this referee
    setCanRateSelected(false);
    setAlreadyRated(false);
    if (myPlayer?.team_id) {
      // Find validated match where ref was referee and player's team participated
      const { data: eligible } = await supabase
        .from('matches')
        .select('id')
        .eq('referee_id', ref.id)
        .eq('status', 'validated')
        .or(`home_team_id.eq.${myPlayer.team_id},away_team_id.eq.${myPlayer.team_id}`)
        .limit(1);
      if (eligible && eligible.length > 0) {
        setCanRateSelected(true);
        const { data: existing } = await supabase
          .from('referee_ratings')
          .select('id')
          .eq('referee_id', ref.id)
          .eq('player_id', myPlayer.id)
          .limit(1);
        setAlreadyRated(!!(existing && existing.length > 0));
      }
    }
    setView('profile');
  };

  const handleApprove = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ status: 'active' }).eq('id', userId);
    if (error) { alert('Error al aprobar: ' + error.message); return; }

    // Crear fila en referees si no existe
    const { data: existing } = await supabase.from('referees').select('id').eq('profile_id', userId).maybeSingle();
    if (!existing) {
      const { error: refErr } = await supabase.from('referees').insert({ profile_id: userId, approved_at: new Date().toISOString() });
      if (refErr) alert('Perfil aprobado pero error al crear registro de árbitro: ' + refErr.message);
    }

    try { await supabase.from('audit_logs').insert({ user_id: currentProfile?.id, action: 'approve_referee', table_name: 'profiles', record_id: userId }); } catch (_) {}
    await fetchPendingUsers();
    await fetchReferees();
  };

  const handleReject = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ status: 'suspended' }).eq('id', userId);
    if (!error) {
      try { await supabase.from('audit_logs').insert({ user_id: currentProfile?.id, action: 'reject_referee', table_name: 'profiles', record_id: userId }); } catch (_) {}
      await fetchPendingUsers();
    } else {
      alert('Error: ' + error.message);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !myPlayer) return;
    setRatingSaving(true);
    // Find a validated match to attach the rating
    const { data: eligibleMatch } = await supabase
      .from('matches').select('id').eq('referee_id', selected.id).eq('status', 'validated')
      .or(`home_team_id.eq.${myPlayer.team_id},away_team_id.eq.${myPlayer.team_id}`).limit(1).single();

    const { error } = await supabase.from('referee_ratings').insert({
      referee_id: selected.id,
      player_id: myPlayer.id,
      match_id: eligibleMatch?.id || null,
      score: ratingForm.score,
      comment: ratingForm.comment || null,
    });
    if (!error) {
      setAlreadyRated(true);
      setRatingForm({ score: 5, comment: '' });
      await fetchReferees();
    } else {
      alert('Error al calificar: ' + error.message);
    }
    setRatingSaving(false);
  };

  const canManageApprovals = userRole === 'admin_plataforma';

  // ── PENDING APPROVALS ──
  if (view === 'pending') {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-6">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Volver a árbitros
        </button>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-5 bg-amber-50 border-b border-amber-200">
            <h2 className="text-lg font-semibold text-slate-900">Solicitudes Pendientes de Árbitros</h2>
            <p className="text-sm text-amber-700 mt-1">{pendingUsers.length} solicitud{pendingUsers.length !== 1 ? 'es' : ''} esperando revisión</p>
          </div>
          {pendingUsers.length === 0 ? (
            <div className="p-10 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400" />
              <p>No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingUsers.map(u => (
                <div key={u.id} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {u.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{u.full_name}</p>
                      <p className="text-sm text-slate-500">{u.email}</p>
                      {u.city && <p className="text-xs text-slate-400">{u.city}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(u.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors">
                      <CheckCircle className="w-4 h-4" /> Aprobar
                    </button>
                    <button onClick={() => handleReject(u.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors">
                      <XCircle className="w-4 h-4" /> Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PROFILE ──
  if (view === 'profile' && selected) {
    const r = selected;
    return (
      <div className="p-4 lg:p-6 space-y-6 max-w-3xl mx-auto">
        <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Volver a árbitros
        </button>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {r.profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{r.profile?.full_name}</h2>
              {r.license_number && <p className="text-blue-100">Licencia: {r.license_number}</p>}
              {r.city && <p className="text-blue-100 text-sm">{r.city}{r.state ? `, ${r.state}` : ''}</p>}
              {r.experience_years != null && <p className="text-blue-100 text-sm">{r.experience_years} años de experiencia</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{r.total_matches}</p>
            <p className="text-xs text-slate-500 mt-1">Partidos arbitrados</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{r.avg_score ?? '—'}</p>
            <div className="flex justify-center mt-1">{r.avg_score ? stars(r.avg_score) : <span className="text-xs text-slate-400">Sin calificaciones</span>}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{r.total_ratings}</p>
            <p className="text-xs text-slate-500 mt-1">Calificaciones recibidas</p>
          </div>
        </div>

        {refereeMatches.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Últimos partidos arbitrados</h3>
            <div className="space-y-2">
              {refereeMatches.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                  <span className="text-slate-700">{(m.home_team as any)?.name} vs {(m.away_team as any)?.name}</span>
                  <div className="flex items-center gap-3">
                    {m.home_score !== null && <span className="font-bold text-slate-900">{m.home_score} — {m.away_score}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${m.status === 'validated' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {m.status === 'validated' ? 'Validado' : m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating form for players */}
        {canRateSelected && !alreadyRated && (
          <div className="bg-white rounded-xl border border-green-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" /> Calificar Árbitro
            </h3>
            <form onSubmit={handleSubmitRating} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Puntuación (1-5 estrellas)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => setRatingForm({ ...ratingForm, score: n })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${ratingForm.score >= n ? 'bg-yellow-400 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Star className="w-5 h-5" fill={ratingForm.score >= n ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                  <span className="ml-2 self-center text-slate-600 font-medium">{ratingForm.score}/5</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Comentario (opcional)</label>
                <textarea rows={2} placeholder="¿Qué destacarías del árbitro?"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-sm"
                  value={ratingForm.comment} onChange={e => setRatingForm({ ...ratingForm, comment: e.target.value })} />
              </div>
              <button type="submit" disabled={ratingSaving}
                className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-white rounded-lg font-medium text-sm disabled:opacity-50">
                {ratingSaving ? 'Enviando...' : 'Enviar Calificación'}
              </button>
            </form>
          </div>
        )}

        {canRateSelected && alreadyRated && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Ya calificaste a este árbitro. Gracias por tu opinión.
          </div>
        )}

        {selectedRatings.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Opiniones de jugadores</h3>
            <div className="space-y-3">
              {selectedRatings.map((rat, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-700">{(rat.player as any)?.profile?.full_name || 'Jugador anónimo'}</p>
                    <div className="flex">{stars(rat.score)}</div>
                  </div>
                  {rat.comment && <p className="text-xs text-slate-500">{rat.comment}</p>}
                </div>
              ))}
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
          <h2 className="text-xl font-bold text-slate-900">Árbitros</h2>
          <p className="text-sm text-slate-500 mt-1">{referees.length} árbitros registrados</p>
        </div>
        {canManageApprovals && (
          <button onClick={async () => { await fetchPendingUsers(); setView('pending'); }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors">
            <Trophy className="w-5 h-5" /> Solicitudes Pendientes
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Árbitros Activos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{referees.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Calificación Promedio</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-bold text-slate-900">
                  {referees.filter(r => r.avg_score).length > 0
                    ? (referees.filter(r => r.avg_score).reduce((acc, r) => acc + (r.avg_score || 0), 0) / referees.filter(r => r.avg_score).length).toFixed(1)
                    : '—'}
                </p>
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Partidos Arbitrados</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {referees.reduce((acc, r) => acc + r.total_matches, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando árbitros...</div>
      ) : referees.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No hay árbitros registrados</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-slate-500 uppercase tracking-wide">Árbitro</th>
                  <th className="px-6 py-3 text-center text-xs text-slate-500 uppercase tracking-wide">Partidos</th>
                  <th className="px-6 py-3 text-center text-xs text-slate-500 uppercase tracking-wide">Calificación</th>
                  <th className="px-6 py-3 text-center text-xs text-slate-500 uppercase tracking-wide">Reseñas</th>
                  <th className="px-6 py-3 text-center text-xs text-slate-500 uppercase tracking-wide">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referees.map(ref => (
                  <tr key={ref.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {ref.profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{ref.profile?.full_name}</p>
                          <p className="text-xs text-slate-400">{ref.city || ref.profile?.city || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-900">{ref.total_matches}</td>
                    <td className="px-6 py-4 text-center">
                      {ref.avg_score ? (
                        <div className="flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-bold">{ref.avg_score}</span>
                        </div>
                      ) : <span className="text-slate-300 text-sm">Sin calificaciones</span>}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-600">{ref.total_ratings}</td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openProfile(ref)}
                        className="flex items-center gap-1 px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors mx-auto">
                        <Eye className="w-3.5 h-3.5" /> Ver Perfil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-4">
            {referees.map(ref => (
              <div key={ref.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {ref.profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{ref.profile?.full_name}</p>
                    <p className="text-sm text-slate-500">{ref.city || '—'}</p>
                  </div>
                  {ref.avg_score && (
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="font-bold text-lg">{ref.avg_score}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3 text-center text-sm">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-slate-400 text-xs">Partidos</p>
                    <p className="font-bold text-slate-900">{ref.total_matches}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-slate-400 text-xs">Calificaciones</p>
                    <p className="font-bold text-slate-900">{ref.total_ratings}</p>
                  </div>
                </div>
                <button onClick={() => openProfile(ref)}
                  className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                  Ver Perfil Completo
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

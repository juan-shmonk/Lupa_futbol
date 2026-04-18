import { useState, useEffect } from 'react';
import { Search, UserPlus, Eye, Trophy, Target, TrendingUp, Calendar, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function Players({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [view, setView] = useState<'list' | 'profile' | 'edit'>('list');
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState('');
  const [form, setForm] = useState({
    position: '', jersey_number: '', birth_date: '',
    height_cm: '', weight_kg: '', dominant_foot: '', bio: ''
  });

  useEffect(() => {
    fetchPlayers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();
    setCurrentProfile(profile);
    setUserRole(profile?.role || '');
  };

  const fetchPlayers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('players')
      .select(`
        *,
        profile:profiles(id, full_name, email, city, state, avatar_url),
        team:teams(id, name)
      `)
      .order('created_at', { ascending: false });
    setPlayers(data || []);
    setLoading(false);
  };

  const openProfile = (player: any) => {
    setSelectedPlayer(player);
    setView('profile');
  };

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
    const { error } = await supabase
      .from('players')
      .update({
        position: form.position || null,
        jersey_number: form.jersey_number ? parseInt(form.jersey_number) : null,
        birth_date: form.birth_date || null,
        height_cm: form.height_cm ? parseInt(form.height_cm) : null,
        weight_kg: form.weight_kg ? parseInt(form.weight_kg) : null,
        dominant_foot: form.dominant_foot || null,
        bio: form.bio || null,
      })
      .eq('id', selectedPlayer.id);
    setSaving(false);
    if (!error) {
      await fetchPlayers();
      setView('list');
    } else {
      alert('Error al guardar: ' + error.message);
    }
  };

  const handleCreateMyProfile = async () => {
    if (!currentProfile) {
      alert('Cargando tu sesión, intenta de nuevo en un momento.');
      return;
    }

    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('players')
      .select(`*, profile:profiles(id, full_name, email, city, state, avatar_url), team:teams(id, name)`)
      .eq('profile_id', currentProfile.id)
      .single();

    if (existing) {
      // Ya existe — ir directo a editar
      openEdit(existing);
      return;
    }

    // Crear el perfil nuevo
    const { data: created, error } = await supabase
      .from('players')
      .insert({ profile_id: currentProfile.id })
      .select(`*, profile:profiles(id, full_name, email, city, state, avatar_url), team:teams(id, name)`)
      .single();

    if (!error && created) {
      await fetchPlayers();
      openEdit(created); // Ir directo al formulario de edición
    } else {
      alert('Error al crear perfil: ' + (error?.message || 'desconocido'));
    }
  };

  const canEdit = (player: any) => {
    return userRole === 'admin_plataforma' ||
      userRole === 'director_liga' ||
      player.profile?.id === currentProfile?.id;
  };

  const filteredPlayers = players.filter(p =>
    p.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── VISTA EDITAR ──
  if (view === 'edit' && selectedPlayer) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto">
        <button onClick={() => setView('profile')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al perfil
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
                  value={form.position} onChange={e => setForm({...form, position: e.target.value})}>
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
                  value={form.jersey_number} onChange={e => setForm({...form, jersey_number: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de nacimiento</label>
                <input type="date"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pie dominante</label>
                <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.dominant_foot} onChange={e => setForm({...form, dominant_foot: e.target.value})}>
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
                  value={form.height_cm} onChange={e => setForm({...form, height_cm: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
                <input type="number" min="40" max="150" placeholder="Ej: 70"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.weight_kg} onChange={e => setForm({...form, weight_kg: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bio / Presentación</label>
              <textarea rows={3} placeholder="Cuéntanos sobre ti como jugador..."
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button type="button" onClick={() => setView('profile')}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ── VISTA PERFIL ──
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
              <p className="text-green-100">{p.position || 'Posición no asignada'} {p.jersey_number ? `· #${p.jersey_number}` : ''}</p>
              <p className="text-green-100 text-sm">{p.team?.name || 'Sin equipo'}</p>
            </div>
            {canEdit(p) && (
              <button onClick={() => openEdit(p)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
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
            <div>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-sm text-slate-500 mt-1">Goles</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">0</p>
              <p className="text-sm text-slate-500 mt-1">Partidos</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-500">0</p>
              <p className="text-sm text-slate-500 mt-1">Tarjetas</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 text-center mt-4">Las estadísticas se actualizan después de partidos validados</p>
        </div>
      </div>
    );
  }

  // ── VISTA LISTA ──
  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Jugadores</h2>
          <p className="text-sm text-slate-500 mt-1">{players.length} jugadores registrados</p>
        </div>
        {userRole === 'jugador' && (
          <button onClick={handleCreateMyProfile}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            <UserPlus className="w-5 h-5" />
            Crear mi perfil deportivo
          </button>
        )}
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
          <p className="text-slate-400 text-sm mt-1">Los jugadores aparecerán aquí cuando creen su perfil deportivo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player) => (
            <div key={player.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                  {player.profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{player.profile?.full_name}</p>
                  <p className="text-sm text-slate-500 truncate">{player.team?.name || 'Sin equipo'}</p>
                </div>
                {player.jersey_number && (
                  <span className="text-lg font-bold text-slate-400">#{player.jersey_number}</span>
                )}
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
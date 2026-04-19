import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Trophy, Menu, X, Star, Shield, Users, Calendar,
  TrendingUp, Eye, Award, CheckCircle, ChevronRight,
  Facebook, Instagram, Twitter
} from 'lucide-react';
import TodayMatchesBoard from './TodayMatchesBoard';

export default function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toApp = () => navigate('/app');

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 bg-white">

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <button onClick={() => scrollTo('inicio')} className="flex items-center gap-2 font-bold text-xl text-slate-900">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              Lupa Fútbol
            </button>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'Inicio', id: 'inicio' },
                { label: 'Cómo funciona', id: 'como-funciona' },
                { label: 'Rankings', id: 'rankings' },
                { label: 'Partidos de Hoy', id: 'partidos-hoy' },
                { label: 'Contacto', id: 'footer' },
              ].map(l => (
                <button key={l.id} onClick={() => scrollTo(l.id)}
                  className="text-sm text-slate-600 hover:text-green-600 transition-colors font-medium">
                  {l.label}
                </button>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-3">
              <button onClick={toApp}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors px-4 py-2">
                Iniciar sesión
              </button>
              <button onClick={toApp}
                className="text-sm font-semibold bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
                Registrarse
              </button>
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 text-slate-700" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3">
            {[
              { label: 'Inicio', id: 'inicio' },
              { label: 'Cómo funciona', id: 'como-funciona' },
              { label: 'Rankings', id: 'rankings' },
              { label: 'Partidos de Hoy', id: 'partidos-hoy' },
              { label: 'Contacto', id: 'footer' },
            ].map(l => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="block w-full text-left text-sm text-slate-700 py-2 font-medium">
                {l.label}
              </button>
            ))}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button onClick={toApp}
                className="flex-1 text-sm font-medium border border-slate-300 text-slate-700 py-2 rounded-lg">
                Iniciar sesión
              </button>
              <button onClick={toApp}
                className="flex-1 text-sm font-semibold bg-green-500 text-white py-2 rounded-lg">
                Registrarse
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section id="inicio" className="relative min-h-screen flex items-center pt-16 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #0f172a 100%)' }}>

        {/* SVG decorativo fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute -right-20 top-10 opacity-10" width="600" height="600" viewBox="0 0 600 600">
            <circle cx="300" cy="300" r="280" fill="none" stroke="#22c55e" strokeWidth="2" />
            <circle cx="300" cy="300" r="200" fill="none" stroke="#22c55e" strokeWidth="1.5" />
            <circle cx="300" cy="300" r="120" fill="none" stroke="#22c55e" strokeWidth="1" />
            <line x1="20" y1="300" x2="580" y2="300" stroke="#22c55e" strokeWidth="1" />
            <line x1="300" y1="20" x2="300" y2="580" stroke="#22c55e" strokeWidth="1" />
            <rect x="175" y="175" width="250" height="250" fill="none" stroke="#22c55e" strokeWidth="1" />
            <circle cx="300" cy="300" r="30" fill="#22c55e" opacity="0.3" />
          </svg>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500 rounded-full opacity-5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500 rounded-full opacity-5 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-1.5 mb-6">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-sm font-medium">Plataforma en México</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                Donde el talento amateur se{' '}
                <span className="text-green-400">registra, se mide</span>{' '}
                y se da a conocer
              </h1>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                La primera plataforma que le da visibilidad real a los jugadores de fútbol amateur en México.
                Estadísticas verificadas, rankings por liga y reputación que abre puertas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={toApp}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-400 text-white font-semibold rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-green-500/25">
                  Crear mi perfil de jugador
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={toApp}
                  className="flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 hover:border-white/60 text-white font-semibold rounded-xl text-lg transition-all hover:bg-white/10">
                  Registrar mi liga
                </button>
              </div>
              <div className="flex items-center gap-6 mt-8">
                {[
                  { value: '100%', label: 'Gratis para jugadores' },
                  { value: 'Verificado', label: 'Por árbitros oficiales' },
                  { value: 'En tiempo real', label: 'Rankings actualizados' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-green-400 font-bold text-sm">{s.value}</p>
                    <p className="text-slate-400 text-xs">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Ilustración campo de fútbol */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-96 h-96">
                {/* Campo */}
                <div className="absolute inset-0 border-4 border-green-500/40 rounded-2xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border-4 border-green-500/40 rounded-full" />
                </div>
                <div className="absolute inset-x-0 top-1/2 border-t-2 border-green-500/30" />
                {/* Áreas */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-28 border-4 border-l-0 border-green-500/40 rounded-r-lg" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-28 border-4 border-r-0 border-green-500/40 rounded-l-lg" />
                {/* Stats flotantes */}
                <div className="absolute -top-4 -left-4 bg-white rounded-xl p-3 shadow-xl">
                  <p className="text-xs text-slate-500">Goles</p>
                  <p className="text-2xl font-bold text-green-600">24</p>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-white rounded-xl p-3 shadow-xl">
                  <p className="text-xs text-slate-500">Árbitro</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <p className="text-lg font-bold text-slate-900">4.8</p>
                  </div>
                </div>
                <div className="absolute top-1/2 -right-8 -translate-y-1/2 bg-green-500 rounded-xl p-3 shadow-xl">
                  <p className="text-xs text-white/80">Ranking</p>
                  <p className="text-2xl font-bold text-white">#1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              El esfuerzo de los jugadores amateur merece ser registrado
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Millones de partidos se juegan cada fin de semana en México. Nadie los registra. Eso cambia hoy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="w-8 h-8 text-red-500" />,
                color: 'bg-red-50 border-red-100',
                iconBg: 'bg-red-100',
                title: 'Sin registro oficial',
                desc: 'Los partidos se juegan y los goles se olvidan. No hay forma de probar que jugaste o lo que lograste.',
              },
              {
                icon: <Eye className="w-8 h-8 text-orange-500" />,
                color: 'bg-orange-50 border-orange-100',
                iconBg: 'bg-orange-100',
                title: 'Sin visibilidad',
                desc: 'Los cazatalentos no tienen cómo encontrar jugadores destacados fuera del fútbol profesional.',
              },
              {
                icon: <Shield className="w-8 h-8 text-red-600" />,
                color: 'bg-red-50 border-red-100',
                iconBg: 'bg-red-100',
                title: 'Sin trazabilidad',
                desc: 'La corrupción arbitral queda impune sin evidencia. Los árbitros malos no tienen consecuencias.',
              },
            ].map((card, i) => (
              <div key={i} className={`rounded-2xl border p-8 ${card.color}`}>
                <div className={`w-16 h-16 ${card.iconBg} rounded-2xl flex items-center justify-center mb-6`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{card.title}</h3>
                <p className="text-slate-600 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ── */}
      <section id="como-funciona" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Simple para todos</h2>
            <p className="text-lg text-slate-500">Cada rol tiene su propio flujo claro y directo</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Jugador',
                color: 'border-green-500',
                headerBg: 'bg-green-500',
                icon: <Users className="w-6 h-6 text-white" />,
                steps: [
                  'Se registra en Lupa Fútbol',
                  'Juega sus partidos de liga',
                  'El árbitro registra sus goles y tarjetas',
                  'Su perfil crece con cada partido',
                ],
              },
              {
                title: 'Árbitro',
                color: 'border-amber-500',
                headerBg: 'bg-amber-500',
                icon: <Award className="w-6 h-6 text-white" />,
                steps: [
                  'Se registra y es verificado',
                  'Arbitra partidos oficiales de liga',
                  'Los jugadores lo califican al terminar',
                  'Construye reputación verificada',
                ],
              },
              {
                title: 'Director de liga',
                color: 'border-purple-500',
                headerBg: 'bg-purple-500',
                icon: <Trophy className="w-6 h-6 text-white" />,
                steps: [
                  'Crea su liga en la plataforma',
                  'Programa partidos y asigna árbitros',
                  'Valida las actas de cada partido',
                  'Su liga gana credibilidad oficial',
                ],
              },
            ].map((col, i) => (
              <div key={i} className={`bg-white rounded-2xl border-t-4 ${col.color} shadow-sm overflow-hidden`}>
                <div className={`${col.headerBg} px-6 py-4 flex items-center gap-3`}>
                  {col.icon}
                  <h3 className="text-lg font-bold text-white">{col.title}</h3>
                </div>
                <div className="p-6 space-y-4">
                  {col.steps.map((step, j) => (
                    <div key={j} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-slate-600">{j + 1}</span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RANKINGS ── */}
      <section id="rankings" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Rankings en tiempo real</h2>
            <p className="text-lg text-slate-500">Los mejores jugadores y árbitros, visibles para todos</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Top goleadores */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-green-500 px-6 py-4 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white">Top Goleadores</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { pos: 1, name: 'Carlos Mendoza', team: 'Tigres FC', goals: 18, city: 'Monterrey' },
                  { pos: 2, name: 'Jesús Ramírez', team: 'Águilas del Sur', goals: 15, city: 'CDMX' },
                  { pos: 3, name: 'Miguel Ángel Torres', team: 'Deportivo Azteca', goals: 13, city: 'Guadalajara' },
                  { pos: 4, name: 'Roberto Sánchez', team: 'FC Norteño', goals: 11, city: 'Monterrey' },
                  { pos: 5, name: 'Andrés Flores', team: 'Unidos Puebla', goals: 10, city: 'Puebla' },
                ].map((p) => (
                  <div key={p.pos} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        p.pos === 1 ? 'bg-yellow-400 text-yellow-900' :
                        p.pos === 2 ? 'bg-slate-300 text-slate-700' :
                        p.pos === 3 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {p.pos}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.team} · {p.city}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 font-bold">
                      <Trophy className="w-4 h-4" />
                      <span>{p.goals}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top árbitros */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-amber-500 px-6 py-4 flex items-center gap-3">
                <Star className="w-5 h-5 text-white" />
                <h3 className="font-bold text-white">Árbitros Mejor Calificados</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { pos: 1, name: 'Fernando Castillo', matches: 34, score: 4.9 },
                  { pos: 2, name: 'Luis Alberto Vega', matches: 28, score: 4.8 },
                  { pos: 3, name: 'Héctor Morales', matches: 41, score: 4.7 },
                  { pos: 4, name: 'Ricardo Domínguez', matches: 22, score: 4.6 },
                  { pos: 5, name: 'Juan Carlos Reyes', matches: 19, score: 4.5 },
                ].map((r) => (
                  <div key={r.pos} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        r.pos === 1 ? 'bg-yellow-400 text-yellow-900' :
                        r.pos === 2 ? 'bg-slate-300 text-slate-700' :
                        r.pos === 3 ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {r.pos}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{r.name}</p>
                        <p className="text-xs text-slate-500">{r.matches} partidos arbitrados</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span className="text-slate-900">{r.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Los rankings se actualizan automáticamente después de cada partido validado
          </p>
          <div className="text-center mt-6">
            <button onClick={toApp}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors">
              Ver rankings completos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── TABLERO PARTIDOS DE HOY ── */}
      <TodayMatchesBoard onEnterApp={toApp} />

      {/* ── BENEFICIOS POR ROL ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Diseñada para cada rol</h2>
            <p className="text-lg text-slate-500">Cada persona en el ecosistema del fútbol amateur tiene su lugar aquí</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                role: 'Jugador',
                icon: <Users className="w-8 h-8 text-green-600" />,
                bg: 'bg-green-50',
                border: 'border-green-200',
                accent: 'text-green-600',
                badge: 'bg-green-500',
                benefits: [
                  'Perfil deportivo oficial y verificado',
                  'Estadísticas registradas por árbitros',
                  'Visibilidad ante cazatalentos',
                  'Historial completo de partidos',
                  '100% gratuito para siempre',
                ],
              },
              {
                role: 'Árbitro',
                icon: <Award className="w-8 h-8 text-amber-600" />,
                bg: 'bg-amber-50',
                border: 'border-amber-200',
                accent: 'text-amber-600',
                badge: 'bg-amber-500',
                benefits: [
                  'Ranking profesional verificado',
                  'Reputación construida partido a partido',
                  'Más oportunidades de trabajo',
                  'Historial limpio y transparente',
                  'Calificaciones de jugadores y directores',
                ],
              },
              {
                role: 'Director de liga',
                icon: <Trophy className="w-8 h-8 text-purple-600" />,
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                accent: 'text-purple-600',
                badge: 'bg-purple-500',
                benefits: [
                  'Administración completa de la liga',
                  'Programación de partidos simplificada',
                  'Validación digital de actas',
                  'Control de equipos y jugadores',
                  'Liga con credibilidad institucional',
                ],
              },
            ].map((card, i) => (
              <div key={i} className={`rounded-2xl border ${card.border} ${card.bg} p-8 relative overflow-hidden`}>
                <div className={`inline-flex items-center gap-2 ${card.badge} text-white text-xs font-bold px-3 py-1 rounded-full mb-6`}>
                  {card.role}
                </div>
                <div className="mb-6">{card.icon}</div>
                <ul className="space-y-3">
                  {card.benefits.map((b, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 ${card.accent} flex-shrink-0 mt-0.5`} />
                      <span className="text-slate-700 text-sm">{b}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={toApp}
                  className={`mt-8 w-full py-3 ${card.badge} hover:opacity-90 text-white font-semibold rounded-xl transition-opacity text-sm`}>
                  Empezar como {card.role.toLowerCase()}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 bg-green-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            ¿Listo para darle visibilidad a tu liga?
          </h2>
          <p className="text-xl text-green-100 mb-10">
            Únete a la plataforma que está transformando el fútbol amateur en México
          </p>
          <button onClick={toApp}
            className="inline-flex items-center gap-3 px-10 py-5 bg-white hover:bg-green-50 text-green-700 font-bold text-xl rounded-2xl transition-all hover:scale-105 shadow-2xl">
            Comenzar ahora
            <ChevronRight className="w-6 h-6" />
          </button>
          <p className="text-green-200 text-sm mt-6">Gratis para jugadores · Sin tarjeta de crédito</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer id="footer" className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white">Lupa Fútbol</span>
              </div>
              <p className="text-sm leading-relaxed">
                La primera plataforma que le da visibilidad real a los jugadores de fútbol amateur en México.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Inicio', id: 'inicio' },
                  { label: 'Cómo funciona', id: 'como-funciona' },
                  { label: 'Rankings', id: 'rankings' },
                  { label: 'Partidos de Hoy', id: 'partidos-hoy' },
                  { label: 'Iniciar sesión', action: toApp },
                ].map((l, i) => (
                  <li key={i}>
                    <button onClick={l.action ?? (() => scrollTo(l.id!))}
                      className="hover:text-green-400 transition-colors">
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold text-white mb-4">Síguenos</h4>
              <div className="flex gap-4">
                {[
                  { icon: <Facebook className="w-5 h-5" />, label: 'Facebook' },
                  { icon: <Instagram className="w-5 h-5" />, label: 'Instagram' },
                  { icon: <Twitter className="w-5 h-5" />, label: 'Twitter' },
                ].map((s, i) => (
                  <button key={i} aria-label={s.label}
                    className="w-10 h-10 bg-slate-800 hover:bg-green-500 rounded-lg flex items-center justify-center transition-colors">
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-6 text-center text-sm">
            © 2026 Lupa Fútbol · Hecho en México
          </div>
        </div>
      </footer>

    </div>
  );
}

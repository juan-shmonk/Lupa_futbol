import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Players } from './components/Players';
import { Teams } from './components/Teams';
import { Matches } from './components/Matches';
import { Referees } from './components/Referees';
import { Rankings } from './components/Rankings';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    if (data?.role === 'jugador') setCurrentView('players');
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={() => {}} />;
  }

  if (profile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Cuenta pendiente de aprobación</h2>
          <p className="text-slate-500 text-sm mb-6">
            Tu solicitud como <span className="font-semibold capitalize">{profile.role}</span> está siendo revisada por el administrador. Te notificaremos por correo cuando sea aprobada.
          </p>
          <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-slate-600">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  if (profile?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Cuenta suspendida</h2>
          <p className="text-slate-500 text-sm mb-6">Tu cuenta ha sido suspendida. Contacta al administrador para más información.</p>
          <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-slate-600">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentView} />;
      case 'players': return <Players onNavigate={setCurrentView} />;
      case 'teams': return <Teams />;
      case 'matches': return <Matches onNavigate={setCurrentView} />;
      case 'referees': return <Referees />;
      case 'rankings': return <Rankings />;
      case 'reports': return <Reports />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout
      currentView={currentView}
      onNavigate={setCurrentView}
      profile={profile}
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
}
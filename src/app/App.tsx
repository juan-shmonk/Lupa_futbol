import { useState } from 'react';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'players':
        return <Players onNavigate={setCurrentView} />;
      case 'teams':
        return <Teams />;
      case 'matches':
        return <Matches onNavigate={setCurrentView} />;
      case 'referees':
        return <Referees />;
      case 'rankings':
        return <Rankings />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </Layout>
  );
}
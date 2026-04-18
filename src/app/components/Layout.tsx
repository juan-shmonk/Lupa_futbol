import { useState } from 'react';
import { Menu, X, Home, Users, Shield, Calendar, Trophy, BarChart3, FileText, Settings, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

export function Layout({ children, currentView, onNavigate }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'players', label: 'Jugadores', icon: Users },
    { id: 'teams', label: 'Equipos', icon: Shield },
    { id: 'matches', label: 'Partidos', icon: Calendar },
    { id: 'referees', label: 'Árbitros', icon: Trophy },
    { id: 'rankings', label: 'Rankings', icon: BarChart3 },
    { id: 'reports', label: 'Reportes', icon: FileText },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden">
      {/* Sidebar Desktop */}
      <aside
        className={`hidden lg:flex flex-col bg-slate-900 text-white transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold">FútbolPro</h2>
                <p className="text-xs text-slate-400">Gestión Amateur</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button className="w-full flex items-center gap-3 px-3 py-3 text-slate-300 hover:bg-slate-800 rounded-lg">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <aside className="w-64 h-full bg-slate-900 text-white" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold">FútbolPro</h2>
                  <p className="text-xs text-slate-400">Gestión Amateur</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="p-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg ${
                      isActive
                        ? 'bg-green-500 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-slate-900">
              {menuItems.find(item => item.id === currentView)?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
              <Shield className="w-5 h-5 text-slate-600" />
              <span className="text-sm text-slate-700">Liga Centro MX</span>
            </div>
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
              JD
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-slate-50">
          {children}
        </main>

        {/* Bottom Navigation Mobile */}
        <nav className="lg:hidden bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around">
          {[
            { id: 'dashboard', icon: Home },
            { id: 'players', icon: Users },
            { id: 'matches', icon: Calendar },
            { id: 'rankings', icon: BarChart3 },
            { id: 'settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg ${
                  isActive ? 'text-green-500' : 'text-slate-400'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{menuItems.find(m => m.id === item.id)?.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

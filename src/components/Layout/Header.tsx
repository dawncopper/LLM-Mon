import { Link, useLocation } from 'react-router-dom';
import { Settings, Activity } from 'lucide-react';

export default function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-primary/80 backdrop-blur-md border-b border-accent/50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Activity className="w-7 h-7 text-sky-blue transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-sky-blue/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              LLM 服务质量监控
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                location.pathname === '/'
                  ? 'bg-accent text-sky-blue'
                  : 'text-zinc-400 hover:text-white hover:bg-accent/50'
              }`}
            >
              监控面板
            </Link>
            <Link
              to="/settings"
              className={`p-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/settings'
                  ? 'bg-accent text-sky-blue'
                  : 'text-zinc-400 hover:text-white hover:bg-accent/50'
              }`}
            >
              <Settings className="w-5 h-5" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const isCommissioner = location.pathname === '/commissioner';

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            NBA Playoff Draft 2026
          </h1>
          <p className="text-xs text-slate-500">Fantasy Auction Draft</p>
        </div>
        <nav className="flex gap-3">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              !isCommissioner
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Draft Board
          </Link>
          <Link
            to="/commissioner"
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              isCommissioner
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Commissioner
          </Link>
        </nav>
      </div>
    </header>
  );
}

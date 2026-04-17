import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const isCommissioner = location.pathname === '/commissioner';

  return (
    <header className="bg-slate-900 border-b border-slate-700 px-4 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white tracking-tight">
          NBA Playoff Draft 2026
        </h1>
        <nav className="flex gap-2">
          <Link
            to="/"
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              !isCommissioner
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Draft Board
          </Link>
          <Link
            to="/commissioner"
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
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

import { useState, useEffect } from 'react';

const COMMISSIONER_PASSWORD = 'qwert';
const STORAGE_KEY = 'commissioner_authed';

interface PasswordGateProps {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY) === 'true') {
      setAuthed(true);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password === COMMISSIONER_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  }

  if (authed) return <>{children}</>;

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-800 border border-slate-700 rounded-xl p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-white mb-2">Commissioner Access</h2>
        <p className="text-slate-400 text-sm mb-5">
          Enter the password to access the commissioner panel.
        </p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          className={`w-full px-4 py-3 bg-slate-900 border rounded-lg text-lg text-white placeholder-slate-500 focus:outline-none mb-3 ${
            error ? 'border-red-500' : 'border-slate-600 focus:border-blue-500'
          }`}
        />

        {error && (
          <div className="text-red-400 text-sm mb-3">Incorrect password. Try again.</div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          Enter
        </button>
      </form>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { searchPlayers } from '../api';
import type { Player } from '../types';

interface PlayerSearchProps {
  onSelect: (player: Player) => void;
  selectedPlayer: Player | null;
  onClear: () => void;
}

export default function PlayerSearch({ onSelect, selectedPlayer, onClear }: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Player[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      const players = await searchPlayers(query);
      setResults(players);
      setIsOpen(players.length > 0);
      setHighlightIndex(0);
    }, 150);

    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  function handleSelect(player: Player) {
    onSelect(player);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[highlightIndex]) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  if (selectedPlayer) {
    return (
      <div className="flex items-center gap-2 bg-slate-900 border border-blue-500 rounded px-3 py-2">
        <span className="text-white font-medium">{selectedPlayer.name}</span>
        <span className="text-slate-400 text-sm">
          {selectedPlayer.position} · {selectedPlayer.teamAbbr}
        </span>
        <button
          onClick={onClear}
          className="ml-auto text-slate-400 hover:text-white text-sm"
        >
          x
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search for a player..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
      />
      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded shadow-xl max-h-60 overflow-y-auto">
          {results.map((player, i) => (
            <button
              key={player.id}
              onMouseDown={() => handleSelect(player)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                i === highlightIndex ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="font-medium">{player.name}</span>
              <span className="text-slate-400 text-xs">
                {player.position} · {player.teamAbbr}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

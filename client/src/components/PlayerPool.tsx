import { useState } from 'react';
import type { Player } from '../types';

interface PlayerPoolProps {
  players: Player[];
  draggable?: boolean;
}

export default function PlayerPool({ players, draggable }: PlayerPoolProps) {
  const [filter, setFilter] = useState('');
  const [showPool, setShowPool] = useState(false);

  const filtered = filter
    ? players.filter(p =>
        p.name.toLowerCase().includes(filter.toLowerCase()) ||
        p.teamAbbr.toLowerCase().includes(filter.toLowerCase()) ||
        p.position.toLowerCase().includes(filter.toLowerCase())
      )
    : players;

  // Group by NBA team, sort players by rank within each team
  const grouped = filtered.reduce<Record<string, Player[]>>((acc, p) => {
    (acc[p.teamAbbr] ??= []).push(p);
    return acc;
  }, {});

  // Sort players within each team by rank
  for (const team of Object.keys(grouped)) {
    grouped[team].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }

  function handleDragStart(e: React.DragEvent, player: Player) {
    e.dataTransfer.setData('application/json', JSON.stringify(player));
    e.dataTransfer.effectAllowed = 'move';
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 mt-6">
      <button
        onClick={() => setShowPool(!showPool)}
        className="flex items-center justify-between w-full text-left"
      >
        <h2 className="text-lg font-bold text-white">
          Available Players ({players.length})
        </h2>
        <span className="text-slate-400 text-sm">{showPool ? 'Hide' : 'Show'}</span>
      </button>

      {showPool && (
        <>
          <input
            type="text"
            placeholder="Filter by name, team, or position..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full mt-3 px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <div className="mt-3 max-h-80 overflow-y-auto space-y-3">
            {Object.entries(grouped).sort().map(([team, teamPlayers]) => (
              <div key={team}>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {team} ({teamPlayers.length})
                </div>
                <div className="space-y-0.5">
                  {teamPlayers.map(p => (
                    <div
                      key={p.id}
                      draggable={draggable}
                      onDragStart={draggable ? (e) => handleDragStart(e, p) : undefined}
                      className={`text-sm text-slate-300 flex gap-2 px-2 py-0.5 rounded ${
                        draggable ? 'cursor-grab active:cursor-grabbing hover:bg-slate-700 select-none' : ''
                      }`}
                    >
                      <span className="text-slate-600 w-7 text-right shrink-0">#{p.rank}</span>
                      <span className="text-slate-500 w-6 shrink-0">{p.position}</span>
                      <span>{p.name}</span>
                      {draggable && (
                        <span className="ml-auto text-slate-600 text-xs">drag</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-slate-500 text-sm text-center py-4">No players found</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

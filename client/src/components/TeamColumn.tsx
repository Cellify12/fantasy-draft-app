import { useState } from 'react';
import type { Team, Player, Pick } from '../types';
import BudgetBar from './BudgetBar';
import PickRow from './PickRow';

const ROSTER_SIZE = 9;

const TEAM_STYLES = [
  { border: 'border-blue-400',    bg: 'bg-blue-950',    header: 'bg-blue-600',    text: 'text-white', ring: 'ring-blue-400'    },
  { border: 'border-red-400',     bg: 'bg-red-950',     header: 'bg-red-600',     text: 'text-white', ring: 'ring-red-400'     },
  { border: 'border-emerald-400', bg: 'bg-emerald-950', header: 'bg-emerald-600', text: 'text-white', ring: 'ring-emerald-400' },
  { border: 'border-amber-400',   bg: 'bg-amber-950',   header: 'bg-amber-500',   text: 'text-black', ring: 'ring-amber-400'   },
  { border: 'border-purple-400',  bg: 'bg-purple-950',  header: 'bg-purple-600',  text: 'text-white', ring: 'ring-purple-400'  },
  { border: 'border-pink-400',    bg: 'bg-pink-950',    header: 'bg-pink-600',    text: 'text-white', ring: 'ring-pink-400'    },
];

interface TeamColumnProps {
  team: Team;
  index: number;
  onDrop?: (player: Player, team: Team) => void;
  onRemovePick?: (pick: Pick) => void;
}

export default function TeamColumn({ team, index, onDrop, onRemovePick }: TeamColumnProps) {
  const [dragOver, setDragOver] = useState(false);
  const style = TEAM_STYLES[index % TEAM_STYLES.length];
  const rosterFull = team.picks.length >= ROSTER_SIZE;

  function handleDragOver(e: React.DragEvent) {
    if (!onDrop || rosterFull) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!onDrop || rosterFull) return;
    try {
      const player: Player = JSON.parse(e.dataTransfer.getData('application/json'));
      onDrop(player, team);
    } catch { /* ignore bad data */ }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border-2 ${style.border} ${style.bg} overflow-hidden transition-all ${
        dragOver ? `ring-4 ${style.ring} scale-[1.02]` : ''
      } ${rosterFull ? 'opacity-75' : ''}`}
    >
      {/* Bold colored header banner */}
      <div className={`${style.header} px-3 py-2 flex items-center justify-between`}>
        <h3 className={`font-extrabold text-2xl ${style.text} truncate`}>{team.name}</h3>
        {rosterFull && (
          <span className={`text-xs font-bold ${style.text} bg-black/20 px-2 py-0.5 rounded`}>FULL</span>
        )}
      </div>

      <div className="px-3 py-2">
        <BudgetBar budget={team.budget} spent={team.spent} remaining={team.remaining} pickCount={team.picks.length} />
      </div>

      {dragOver && !rosterFull && (
        <div className="text-center text-sm text-slate-400 py-2 bg-slate-700/50 border-t border-slate-700">
          Drop here to draft
        </div>
      )}
      <div>
        {team.picks.length === 0 && !dragOver ? (
          <div className="text-slate-600 text-lg text-center py-6 italic">No picks yet</div>
        ) : (
          team.picks.map(pick => (
            <PickRow key={pick.id} pick={pick} onRemove={onRemovePick} />
          ))
        )}
      </div>
    </div>
  );
}

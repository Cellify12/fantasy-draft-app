import { useState } from 'react';
import type { Team, Player } from '../types';
import BudgetBar from './BudgetBar';
import PickRow from './PickRow';

const TEAM_COLORS = [
  'border-blue-500',
  'border-red-500',
  'border-emerald-500',
  'border-amber-500',
  'border-purple-500',
  'border-pink-500',
];

const TEAM_TEXT_COLORS = [
  'text-blue-400',
  'text-red-400',
  'text-emerald-400',
  'text-amber-400',
  'text-purple-400',
  'text-pink-400',
];

const TEAM_DRAG_COLORS = [
  'ring-blue-500',
  'ring-red-500',
  'ring-emerald-500',
  'ring-amber-500',
  'ring-purple-500',
  'ring-pink-500',
];

interface TeamColumnProps {
  team: Team;
  index: number;
  onDrop?: (player: Player, team: Team) => void;
}

export default function TeamColumn({ team, index, onDrop }: TeamColumnProps) {
  const [dragOver, setDragOver] = useState(false);
  const borderColor = TEAM_COLORS[index % TEAM_COLORS.length];
  const textColor = TEAM_TEXT_COLORS[index % TEAM_TEXT_COLORS.length];
  const dragColor = TEAM_DRAG_COLORS[index % TEAM_DRAG_COLORS.length];

  function handleDragOver(e: React.DragEvent) {
    if (!onDrop) return;
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
    if (!onDrop) return;
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
      className={`bg-slate-800 rounded-lg border-t-2 ${borderColor} overflow-hidden transition-all ${
        dragOver ? `ring-2 ${dragColor} scale-[1.02] bg-slate-750` : ''
      }`}
    >
      <div className="p-3">
        <h3 className={`font-bold text-lg ${textColor} mb-1 truncate`}>{team.name}</h3>
        <BudgetBar budget={team.budget} spent={team.spent} remaining={team.remaining} />
        <div className="text-xs text-slate-500">{team.picks.length} players</div>
      </div>
      {dragOver && (
        <div className="text-center text-sm text-slate-400 py-2 bg-slate-700/50 border-t border-slate-700">
          Drop here to draft
        </div>
      )}
      <div className="max-h-60 overflow-y-auto">
        {team.picks.length === 0 && !dragOver ? (
          <div className="text-slate-600 text-sm text-center py-4 italic">No picks yet</div>
        ) : (
          team.picks.map(pick => <PickRow key={pick.id} pick={pick} />)
        )}
      </div>
    </div>
  );
}

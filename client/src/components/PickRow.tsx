import type { Pick } from '../types';

interface PickRowProps {
  pick: Pick;
  onRemove?: (pick: Pick) => void;
}

export default function PickRow({ pick, onRemove }: PickRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 px-3 text-base border-b border-slate-700/50 last:border-0 group">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-slate-500 text-sm w-6 shrink-0">#{pick.pickOrder}</span>
        <span className="text-white font-bold truncate">{pick.playerName}</span>
        <span className="text-slate-400 text-sm shrink-0">
          {pick.playerPosition} · {pick.playerTeamAbbr}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-emerald-400 font-mono text-lg font-bold">${pick.bidAmount}</span>
        {onRemove && (
          <button
            onClick={() => onRemove(pick)}
            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-sm px-1.5 py-0.5 rounded hover:bg-red-400/10 transition-all"
            title="Remove pick"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

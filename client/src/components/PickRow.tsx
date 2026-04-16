import type { Pick } from '../types';

interface PickRowProps {
  pick: Pick;
}

export default function PickRow({ pick }: PickRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2 text-sm border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-slate-500 text-xs w-5 shrink-0">#{pick.pickOrder}</span>
        <span className="text-white font-medium truncate">{pick.playerName}</span>
        <span className="text-slate-400 text-xs shrink-0">
          {pick.playerPosition} · {pick.playerTeamAbbr}
        </span>
      </div>
      <span className="text-emerald-400 font-mono text-sm shrink-0 ml-2">${pick.bidAmount}</span>
    </div>
  );
}

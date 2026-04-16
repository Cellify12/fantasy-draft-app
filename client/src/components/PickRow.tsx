import type { Pick } from '../types';

interface PickRowProps {
  pick: Pick;
}

export default function PickRow({ pick }: PickRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-4 text-lg border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-slate-500 text-base w-7 shrink-0">#{pick.pickOrder}</span>
        <span className="text-white font-bold truncate">{pick.playerName}</span>
        <span className="text-slate-400 text-base shrink-0">
          {pick.playerPosition} · {pick.playerTeamAbbr}
        </span>
      </div>
      <span className="text-emerald-400 font-mono text-xl font-bold shrink-0 ml-3">${pick.bidAmount}</span>
    </div>
  );
}

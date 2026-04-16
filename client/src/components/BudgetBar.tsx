const ROSTER_SIZE = 9;

interface BudgetBarProps {
  budget: number;
  spent: number;
  remaining: number;
  pickCount: number;
}

export default function BudgetBar({ budget, spent, remaining, pickCount }: BudgetBarProps) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const color = pct < 50 ? 'bg-emerald-500' : pct < 80 ? 'bg-yellow-500' : 'bg-red-500';
  const emptySlots = ROSTER_SIZE - pickCount;
  const maxBid = emptySlots > 0 ? remaining - (emptySlots - 1) : 0;

  return (
    <div className="mb-2">
      <div className="flex justify-between text-base text-slate-400 mb-1">
        <span className="font-semibold">${spent} spent</span>
        <span className="font-bold text-yellow-400">Max Bid: ${Math.max(maxBid, 0)}</span>
      </div>
      <div className="flex justify-between text-sm text-slate-500 mb-1">
        <span>{pickCount}/{ROSTER_SIZE} roster</span>
        <span>${remaining} left</span>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface BudgetBarProps {
  budget: number;
  spent: number;
  remaining: number;
}

export default function BudgetBar({ budget, spent, remaining }: BudgetBarProps) {
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const color = pct < 50 ? 'bg-emerald-500' : pct < 80 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>${spent} spent</span>
        <span>${remaining} left</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

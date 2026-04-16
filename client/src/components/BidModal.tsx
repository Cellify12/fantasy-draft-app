import { useState, useEffect, useRef } from 'react';

interface BidModalProps {
  playerName: string;
  teamName: string;
  onConfirm: (bidAmount: number) => void;
  onCancel: () => void;
  defaultBid?: number;
}

export default function BidModal({ playerName, teamName, onConfirm, onCancel, defaultBid }: BidModalProps) {
  const [bid, setBid] = useState(defaultBid?.toString() ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseInt(bid);
    if (amount > 0) onConfirm(amount);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div
        className="bg-slate-800 border border-slate-600 rounded-lg p-5 shadow-2xl w-80"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-white font-bold text-lg mb-3">Confirm Draft Pick</h3>
        <div className="text-sm text-slate-300 mb-4">
          <span className="text-white font-medium">{playerName}</span>
          <span className="text-slate-500 mx-2">→</span>
          <span className="text-blue-400 font-medium">{teamName}</span>
        </div>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm text-slate-400 mb-1">Bid Amount ($)</label>
          <input
            ref={inputRef}
            type="number"
            min="1"
            value={bid}
            onChange={e => setBid(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white text-lg font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 mb-4"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!bid || parseInt(bid) <= 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Confirm
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

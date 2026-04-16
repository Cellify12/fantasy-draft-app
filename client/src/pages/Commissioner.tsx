import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDraft, createPick, deletePick, updateTeam, resetDraft } from '../api';
import type { Player, Team, Pick } from '../types';
import TeamGrid from '../components/TeamGrid';
import PlayerSearch from '../components/PlayerSearch';
import PlayerPool from '../components/PlayerPool';
import BidModal from '../components/BidModal';
import VoiceControl from '../components/VoiceControl';
import EmailResults from '../components/EmailResults';

const ROSTER_SIZE = 9;

function getMaxBid(team: Team): number {
  const emptySlots = ROSTER_SIZE - team.picks.length;
  return emptySlots > 0 ? Math.max(team.remaining - (emptySlots - 1), 0) : 0;
}

export default function Commissioner() {
  const queryClient = useQueryClient();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(1);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Drag-and-drop state
  const [dropTarget, setDropTarget] = useState<{ player: Player; team: Team } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['draft'],
    queryFn: fetchDraft,
    refetchInterval: 5000,
  });

  const pickMutation = useMutation({
    mutationFn: (params: { playerId: number; teamId: number; bidAmount: number }) =>
      createPick(params.playerId, params.teamId, params.bidAmount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft'] });
      setSelectedPlayer(null);
      setBidAmount('');
      setDropTarget(null);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setDropTarget(null);
    },
  });

  const undoMutation = useMutation({
    mutationFn: (pickId: number) => deletePick(pickId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft'] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const renameMutation = useMutation({
    mutationFn: (params: { teamId: number; name: string }) =>
      updateTeam(params.teamId, { name: params.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft'] });
      setEditingTeam(null);
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetDraft,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['draft'] }),
  });

  function handleDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlayer) {
      setError('Select a player first');
      return;
    }
    const bid = parseInt(bidAmount);
    if (!bid || bid <= 0) {
      setError('Enter a valid bid amount');
      return;
    }
    setError(null);
    pickMutation.mutate({ playerId: selectedPlayer.id, teamId: selectedTeamId, bidAmount: bid });
  }

  function handleUndo() {
    if (!data || data.picks.length === 0) return;
    const lastPick = data.picks[data.picks.length - 1];
    if (confirm(`Undo pick #${lastPick.pickOrder}: ${lastPick.playerName} to Team ${lastPick.teamId}?`)) {
      undoMutation.mutate(lastPick.id);
    }
  }

  function handleReset() {
    if (confirm('Reset the entire draft? This will remove all picks.')) {
      resetMutation.mutate();
    }
  }

  // Remove any pick (not just the last)
  function handleRemovePick(pick: Pick) {
    if (confirm(`Remove ${pick.playerName} ($${pick.bidAmount}) from the draft?`)) {
      undoMutation.mutate(pick.id);
    }
  }

  function handleDrop(player: Player, team: Team) {
    setDropTarget({ player, team });
  }

  function handleDropConfirm(bidAmount: number) {
    if (!dropTarget) return;
    pickMutation.mutate({
      playerId: dropTarget.player.id,
      teamId: dropTarget.team.id,
      bidAmount,
    });
  }

  function handleVoiceConfirm(playerId: number, teamId: number, bidAmount: number) {
    pickMutation.mutate({ playerId, teamId, bidAmount });
  }

  if (isLoading || !data) {
    return <div className="text-slate-400 text-center text-2xl py-20">Loading...</div>;
  }

  const selectedTeam = data.teams.find(t => t.id === selectedTeamId);

  return (
    <div className="px-4 py-4">
      {/* Compact Commissioner Control Panel */}
      <div className="bg-slate-800 rounded-lg p-3 mb-4 border border-slate-700">
        <form onSubmit={handleDraft}>
          <div className="flex items-end gap-3 flex-wrap">
            {/* Player search */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-400 mb-1">Player</label>
              <PlayerSearch
                selectedPlayer={selectedPlayer}
                onSelect={setSelectedPlayer}
                onClear={() => setSelectedPlayer(null)}
              />
            </div>

            {/* Team select */}
            <div className="w-64">
              <label className="block text-xs text-slate-400 mb-1">Team</label>
              <select
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {data.teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} — Max: ${getMaxBid(team)} ({team.picks.length}/{ROSTER_SIZE})
                  </option>
                ))}
              </select>
            </div>

            {/* Bid amount */}
            <div className="w-32">
              <label className="block text-xs text-slate-400 mb-1">
                Bid {selectedTeam && <span className="text-yellow-400">(max ${getMaxBid(selectedTeam)})</span>}
              </label>
              <input
                type="number"
                min="1"
                max={selectedTeam ? getMaxBid(selectedTeam) : undefined}
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                placeholder="$"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Buttons */}
            <button
              type="submit"
              disabled={pickMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-blue-400 text-white font-bold py-2 px-5 rounded transition-colors"
            >
              {pickMutation.isPending ? 'Drafting...' : 'Draft'}
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={data.picks.length === 0}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Undo
            </button>

            {/* Voice button — inline */}
            <VoiceControl
              players={data.availablePlayers}
              teams={data.teams}
              onConfirm={handleVoiceConfirm}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded px-3 py-2 mt-2">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Draft Board — BIG */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-white">Draft Board</h2>
        <div className="flex items-center gap-4">
          <span className="text-lg text-slate-400">
            {data.picks.length} picks · {data.availablePlayers.length} available
          </span>
          <EmailResults />
          <button
            onClick={handleReset}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Reset Draft
          </button>
        </div>
      </div>

      <TeamGrid teams={data.teams} onDrop={handleDrop} onRemovePick={handleRemovePick} />
      <PlayerPool players={data.availablePlayers} draggable />

      {/* Team Name Editor — at the bottom */}
      <div className="bg-slate-800 rounded-lg p-4 mt-6 border border-slate-700">
        <h3 className="text-sm font-semibold text-slate-400 mb-3">Team Names (click to edit)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {data.teams.map(team => (
            <div key={team.id}>
              {editingTeam === team.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => {
                    if (editName.trim() && editName.trim() !== team.name) {
                      renameMutation.mutate({ teamId: team.id, name: editName.trim() });
                    } else {
                      setEditingTeam(null);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur();
                    } else if (e.key === 'Escape') {
                      setEditingTeam(null);
                    }
                  }}
                  className="w-full px-2 py-1 bg-slate-900 border border-blue-500 rounded text-white text-sm focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditingTeam(team.id);
                    setEditName(team.name);
                  }}
                  className="w-full text-left px-2 py-1 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  {team.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bid Modal for drag-and-drop */}
      {dropTarget && (
        <BidModal
          playerName={dropTarget.player.name}
          teamName={dropTarget.team.name}
          onConfirm={handleDropConfirm}
          onCancel={() => setDropTarget(null)}
        />
      )}
    </div>
  );
}

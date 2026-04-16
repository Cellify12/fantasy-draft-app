import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDraft, createPick, deletePick, updateTeam, resetDraft } from '../api';
import type { Player, Team } from '../types';
import TeamGrid from '../components/TeamGrid';
import PlayerSearch from '../components/PlayerSearch';
import PlayerPool from '../components/PlayerPool';
import BidModal from '../components/BidModal';
import VoiceControl from '../components/VoiceControl';

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

  // Drag-and-drop handler
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

  // Voice control handler
  function handleVoiceConfirm(playerId: number, teamId: number, bidAmount: number) {
    pickMutation.mutate({ playerId, teamId, bidAmount });
  }

  if (isLoading || !data) {
    return <div className="text-slate-400 text-center text-2xl py-20">Loading...</div>;
  }

  const selectedTeam = data.teams.find(t => t.id === selectedTeamId);

  return (
    <div className="px-4 py-6">
      {/* Voice Control */}
      <VoiceControl
        players={data.availablePlayers}
        teams={data.teams}
        onConfirm={handleVoiceConfirm}
      />

      {/* Commissioner Control Panel */}
      <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-5">Commissioner Panel</h2>

        <form onSubmit={handleDraft} className="space-y-4">
          <div>
            <label className="block text-lg text-slate-400 mb-2">Player</label>
            <PlayerSearch
              selectedPlayer={selectedPlayer}
              onSelect={setSelectedPlayer}
              onClear={() => setSelectedPlayer(null)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-lg text-slate-400 mb-2">Team</label>
              <select
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-lg text-white focus:outline-none focus:border-blue-500"
              >
                {data.teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} — Max Bid: ${getMaxBid(team)} ({team.picks.length}/{ROSTER_SIZE})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-lg text-slate-400 mb-2">
                Bid Amount ($)
                {selectedTeam && (
                  <span className="text-yellow-400 ml-2">
                    Max: ${getMaxBid(selectedTeam)}
                  </span>
                )}
              </label>
              <input
                type="number"
                min="1"
                max={selectedTeam ? getMaxBid(selectedTeam) : undefined}
                value={bidAmount}
                onChange={e => setBidAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-lg bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pickMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:text-blue-400 text-white text-xl font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {pickMutation.isPending ? 'Drafting...' : 'Draft Player'}
            </button>
            <button
              type="button"
              onClick={handleUndo}
              disabled={data.picks.length === 0}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xl font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Undo
            </button>
          </div>
        </form>
      </div>

      {/* Team Name Editor */}
      <div className="bg-slate-800 rounded-xl p-5 mb-6 border border-slate-700">
        <h3 className="text-lg font-semibold text-slate-400 mb-3">Team Names (click to edit)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  className="w-full px-3 py-2 bg-slate-900 border border-blue-500 rounded-lg text-white text-lg focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditingTeam(team.id);
                    setEditName(team.name);
                  }}
                  className="w-full text-left px-3 py-2 text-lg text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {team.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Draft Board — drop targets enabled */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-white">Draft Board</h2>
        <div className="flex items-center gap-4">
          <span className="text-lg text-slate-400">
            {data.picks.length} picks · {data.availablePlayers.length} available
          </span>
          <button
            onClick={handleReset}
            className="text-base text-red-400 hover:text-red-300 transition-colors"
          >
            Reset Draft
          </button>
        </div>
      </div>

      <TeamGrid teams={data.teams} onDrop={handleDrop} />
      <PlayerPool players={data.availablePlayers} draggable />

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

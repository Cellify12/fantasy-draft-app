import { useQuery } from '@tanstack/react-query';
import { fetchDraft } from '../api';
import TeamGrid from '../components/TeamGrid';
import PlayerPool from '../components/PlayerPool';

export default function DraftBoard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['draft'],
    queryFn: fetchDraft,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400">Loading draft...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-400">Failed to load draft. Is the server running?</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">
          Draft Board
        </h2>
        <div className="text-sm text-slate-400">
          {data.picks.length} picks made · {data.availablePlayers.length} players available
        </div>
      </div>

      <TeamGrid teams={data.teams} />
      <PlayerPool players={data.availablePlayers} />

      {/* Recent picks ticker */}
      {data.picks.length > 0 && (
        <div className="mt-6 bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Recent Picks</h3>
          <div className="space-y-1">
            {data.picks.slice(-5).reverse().map(pick => {
              const team = data.teams.find(t => t.id === pick.teamId);
              return (
                <div key={pick.id} className="text-sm text-slate-300">
                  <span className="text-slate-500">#{pick.pickOrder}</span>{' '}
                  <span className="text-white font-medium">{pick.playerName}</span>{' '}
                  <span className="text-slate-400">({pick.playerPosition}, {pick.playerTeamAbbr})</span>{' '}
                  to <span className="text-blue-400">{team?.name ?? `Team ${pick.teamId}`}</span>{' '}
                  for <span className="text-emerald-400">${pick.bidAmount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

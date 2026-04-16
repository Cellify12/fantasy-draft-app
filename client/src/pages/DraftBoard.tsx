import { useQuery } from '@tanstack/react-query';
import { fetchDraft } from '../api';
import TeamGrid from '../components/TeamGrid';
import PlayerPool from '../components/PlayerPool';
import EmailResults from '../components/EmailResults';

export default function DraftBoard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['draft'],
    queryFn: fetchDraft,
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-slate-400 text-2xl">Loading draft...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-400 text-2xl">Failed to load draft. Is the server running?</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-white">
          Draft Board
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-lg text-slate-400">
            {data.picks.length} picks made · {data.availablePlayers.length} players available
          </span>
          <EmailResults />
        </div>
      </div>

      <TeamGrid teams={data.teams} />
      <PlayerPool players={data.availablePlayers} />

      {/* Recent picks ticker */}
      {data.picks.length > 0 && (
        <div className="mt-6 bg-slate-800 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-slate-400 mb-3">Recent Picks</h3>
          <div className="space-y-2">
            {data.picks.slice(-5).reverse().map(pick => {
              const team = data.teams.find(t => t.id === pick.teamId);
              return (
                <div key={pick.id} className="text-lg text-slate-300">
                  <span className="text-slate-500">#{pick.pickOrder}</span>{' '}
                  <span className="text-white font-bold">{pick.playerName}</span>{' '}
                  <span className="text-slate-400">({pick.playerPosition}, {pick.playerTeamAbbr})</span>{' '}
                  to <span className="text-blue-400 font-semibold">{team?.name ?? `Team ${pick.teamId}`}</span>{' '}
                  for <span className="text-emerald-400 font-bold">${pick.bidAmount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

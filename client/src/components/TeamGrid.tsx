import type { Team, Player, Pick } from '../types';
import TeamColumn from './TeamColumn';

interface TeamGridProps {
  teams: Team[];
  onDrop?: (player: Player, team: Team) => void;
  onRemovePick?: (pick: Pick) => void;
}

export default function TeamGrid({ teams, onDrop, onRemovePick }: TeamGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {teams.map((team, i) => (
        <TeamColumn key={team.id} team={team} index={i} onDrop={onDrop} onRemovePick={onRemovePick} />
      ))}
    </div>
  );
}

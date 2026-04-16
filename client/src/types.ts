export interface Player {
  id: number;
  name: string;
  teamAbbr: string;
  position: string;
  seed: number | null;
  rank: number | null;
}

export interface Pick {
  id: number;
  playerId: number;
  playerName: string;
  playerTeamAbbr: string;
  playerPosition: string;
  teamId: number;
  bidAmount: number;
  pickOrder: number;
}

export interface Team {
  id: number;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  picks: Pick[];
}

export interface DraftState {
  teams: Team[];
  picks: Pick[];
  availablePlayers: Player[];
}

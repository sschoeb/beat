export interface Person {
  id: number;
  name: string;
  createdAt: Date;
}

export interface Team {
  player1: Person;
  player2?: Person;
}

export interface Match {
  id: number;
  team1: Team;
  team2?: Team | undefined;
  winner?: Team | undefined;
  startTime: Date;
  endTime?: Date | undefined;
  isActive: boolean;
}

export interface QueueEntry {
  id: number;
  team: Team;
  timestamp: Date;
}

export interface StartMatchRequest {
  team1Player1Id: number;
  team1Player2Id?: number;
  team2Player1Id: number;
  team2Player2Id?: number;
}

export interface EndMatchRequest {
  matchId: number;
  winnerTeam: 1 | 2;
}

export interface EndMatchResponse {
  endedMatch: Match;
  nextMatch?: Match;
  autoStarted: boolean;
}

export interface AddToQueueRequest {
  player1Id: number;
  player2Id?: number | null;
}

export interface PlayerRanking {
  id: number;
  name: string;
  wins: number;
  totalGames: number;
  buchholz: number;
}

export interface AdminMatch {
  id: number;
  team1: string;
  team2: string;
  winner: string | null;
  startTime: string;
  endTime: string | null;
  isActive: boolean;
}

export interface PlayerMatch {
  id: number;
  team1_player1_id: number;
  team1_player2_id?: number;
  team2_player1_id: number;
  team2_player2_id?: number;
  team1_player1_name: string;
  team1_player2_name?: string;
  team2_player1_name: string;
  team2_player2_name?: string;
  winner_team: number;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
}

export interface HeadToHead {
  opponent_id: number;
  opponent_name: string;
  wins: number;
  losses: number;
  total_matches: number;
}

export interface WeeklyData {
  week: string;
  wins: number;
  losses: number;
  total: number;
}

export interface PlayerStats {
  playerId: number;
  playerName: string;
  totalMatches: number;
  totalWins: number;
  totalLosses: number;
  winPercentage: number;
  singlesRecord: { wins: number; losses: number; total: number };
  doublesRecord: { wins: number; losses: number; total: number };
  weeklyData: WeeklyData[];
  longestWinStreak: number;
  currentWinStreak: number;
  buchholzRating: number;
  headToHead: HeadToHead[];
  recentMatches: PlayerMatch[];
  allMatches: PlayerMatch[];
}

export interface EloRanking {
  playerId: number;
  playerName: string;
  elo: number;
  gamesPlayed: number;
  mu: number;
  sigma: number;
  conservativeRating: number;
}
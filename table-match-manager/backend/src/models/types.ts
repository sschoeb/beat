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
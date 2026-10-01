export type MatchEndReason = 'time_up' | 'player_destroyed' | 'surrender';

export interface MatchRecord {
  id: string;
  playerId: string;
  playerName: string;
  score: number;
  durationSeconds: number;
  endReason: MatchEndReason;
  createdAt: string;
  configSnapshot: {
    sessionDuration: number;
    enemySpawnInterval: number;
  };
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  durationSeconds: number;
  createdAt: string;
  sessionDurationConfig: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

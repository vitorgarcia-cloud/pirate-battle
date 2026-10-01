import { http, HttpResponse, delay } from 'msw';
import type { LeaderboardEntry, MatchRecord, PaginatedResponse } from '../api/types';

const STORAGE_MATCHES_KEY = 'pirate_battle_matches';
const STORAGE_LEADERBOARD_KEY = 'pirate_battle_leaderboard';
const STORAGE_NETWORK_MODE_KEY = 'pirate_battle_network_mode';

export type NetworkScenario = 'success' | 'slow' | 'error' | 'timeout';

export function getNetworkScenario(): NetworkScenario {
  return (localStorage.getItem(STORAGE_NETWORK_MODE_KEY) as NetworkScenario) || 'success';
}

export function setNetworkScenario(mode: NetworkScenario): void {
  localStorage.setItem(STORAGE_NETWORK_MODE_KEY, mode);
}

function getStoredMatches(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_MATCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getStoredLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_LEADERBOARD_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }

  const defaultEntries: LeaderboardEntry[] = [
    { id: '1', rank: 1, playerId: 'p1', playerName: 'Blackbeard', score: 42, durationSeconds: 90, createdAt: new Date(Date.now() - 86400000).toISOString(), sessionDurationConfig: 90 },
    { id: '2', rank: 2, playerId: 'p2', playerName: 'Captain Hook', score: 35, durationSeconds: 90, createdAt: new Date(Date.now() - 72000000).toISOString(), sessionDurationConfig: 90 },
    { id: '3', rank: 3, playerId: 'p3', playerName: 'Anne Bonny', score: 28, durationSeconds: 90, createdAt: new Date(Date.now() - 36000000).toISOString(), sessionDurationConfig: 90 },
    { id: '4', rank: 4, playerId: 'p4', playerName: 'Jack Sparrow', score: 20, durationSeconds: 90, createdAt: new Date(Date.now() - 18000000).toISOString(), sessionDurationConfig: 90 },
    { id: '5', rank: 5, playerId: 'p5', playerName: 'Henry Morgan', score: 15, durationSeconds: 90, createdAt: new Date(Date.now() - 9000000).toISOString(), sessionDurationConfig: 90 },
    { id: '6', rank: 6, playerId: 'p6', playerName: 'Calico Jack', score: 10, durationSeconds: 90, createdAt: new Date(Date.now() - 4000000).toISOString(), sessionDurationConfig: 90 },
  ];
  localStorage.setItem(STORAGE_LEADERBOARD_KEY, JSON.stringify(defaultEntries));
  return defaultEntries;
}

export function resetMockData(): void {
  localStorage.removeItem(STORAGE_MATCHES_KEY);
  localStorage.removeItem(STORAGE_LEADERBOARD_KEY);
  localStorage.removeItem('pirate_battle_pending_matches');
  getStoredLeaderboard();
}

export const handlers = [
  // GET /api/leaderboard
  http.get('/api/leaderboard', async ({ request }) => {
    const mode = getNetworkScenario();
    if (mode === 'slow') await delay(1500);
    else if (mode === 'timeout') {
      await delay(6000);
      return HttpResponse.error();
    } else if (mode === 'error') {
      await delay(200);
      return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } else {
      await delay(120);
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '5', 10);

    const list = getStoredLeaderboard();
    const sorted = [...list].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.durationSeconds - b.durationSeconds;
    }).map((item, idx) => ({ ...item, rank: idx + 1 }));

    const start = (page - 1) * pageSize;
    const paginated = sorted.slice(start, start + pageSize);

    const response: PaginatedResponse<LeaderboardEntry> = {
      data: paginated,
      page,
      pageSize,
      total: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    };

    return HttpResponse.json(response);
  }),

  // GET /api/matches
  http.get('/api/matches', async ({ request }) => {
    const mode = getNetworkScenario();
    if (mode === 'slow') await delay(1500);
    else if (mode === 'timeout') {
      await delay(6000);
      return HttpResponse.error();
    } else if (mode === 'error') {
      await delay(200);
      return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    } else {
      await delay(120);
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '5', 10);

    const list = getStoredMatches();
    const sorted = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = (page - 1) * pageSize;
    const paginated = sorted.slice(start, start + pageSize);

    const response: PaginatedResponse<MatchRecord> = {
      data: paginated,
      page,
      pageSize,
      total: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    };

    return HttpResponse.json(response);
  }),

  // POST /api/matches
  http.post('/api/matches', async ({ request }) => {
    const mode = getNetworkScenario();
    if (mode === 'slow') await delay(1500);
    else if (mode === 'timeout') {
      await delay(6000);
      return HttpResponse.error();
    } else if (mode === 'error') {
      await delay(200);
      return HttpResponse.json({ message: 'Service Unavailable' }, { status: 503 });
    } else {
      await delay(150);
    }

    const match = (await request.json()) as MatchRecord;

    const matches = getStoredMatches();
    // Idempotência: verificar se registro já foi salvo
    const exists = matches.some((m) => m.id === match.id);
    if (!exists) {
      matches.push(match);
      localStorage.setItem(STORAGE_MATCHES_KEY, JSON.stringify(matches));

      // Atualizar Ranking
      const leaderboard = getStoredLeaderboard();
      const existingEntryIdx = leaderboard.findIndex((e) => e.id === match.id);
      if (existingEntryIdx === -1) {
        leaderboard.push({
          id: match.id,
          rank: 0,
          playerId: match.playerId,
          playerName: match.playerName,
          score: match.score,
          durationSeconds: match.durationSeconds,
          createdAt: match.createdAt,
          sessionDurationConfig: match.configSnapshot.sessionDuration,
        });
        localStorage.setItem(STORAGE_LEADERBOARD_KEY, JSON.stringify(leaderboard));
      }
    }

    return HttpResponse.json(match, { status: 201 });
  }),
];

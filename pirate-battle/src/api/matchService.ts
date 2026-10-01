import { apiClient } from './client';
import type { LeaderboardEntry, MatchRecord, PaginatedResponse } from './types';

const STORAGE_PENDING_KEY = 'pirate_battle_pending_matches';

export const matchService = {
  // Obter ranking paginado
  async getLeaderboard(page: number = 1, pageSize: number = 5): Promise<PaginatedResponse<LeaderboardEntry>> {
    const response = await apiClient.get<PaginatedResponse<LeaderboardEntry>>('/leaderboard', {
      params: { page, pageSize },
    });
    return response.data;
  },

  // Obter histórico de partidas do jogador paginado
  async getMatchHistory(page: number = 1, pageSize: number = 5): Promise<PaginatedResponse<MatchRecord>> {
    const response = await apiClient.get<PaginatedResponse<MatchRecord>>('/matches', {
      params: { page, pageSize },
    });
    return response.data;
  },

  // Submeter partida com suporte a idempotência e fila de envio resiliente
  async submitMatch(record: MatchRecord): Promise<MatchRecord> {
    try {
      const response = await apiClient.post<MatchRecord>('/matches', record);
      // Se deu certo, remove de pendentes caso estivesse salvo
      matchService.removePendingMatch(record.id);
      return response.data;
    } catch (err) {
      // Se falhar a rede/timeout, salva na fila pendente local
      matchService.savePendingMatch(record);
      throw err;
    }
  },

  // Gerenciamento da fila pendente no localStorage
  getPendingMatches(): MatchRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_PENDING_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  savePendingMatch(record: MatchRecord): void {
    const pending = this.getPendingMatches();
    if (!pending.some((m) => m.id === record.id)) {
      pending.push(record);
      localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(pending));
    }
  },

  removePendingMatch(id: string): void {
    const pending = this.getPendingMatches().filter((m) => m.id !== id);
    localStorage.setItem(STORAGE_PENDING_KEY, JSON.stringify(pending));
  },

  // Processa pendências pendentes (sincronização em background)
  async syncPendingMatches(): Promise<void> {
    const pending = this.getPendingMatches();
    for (const match of pending) {
      try {
        await apiClient.post('/matches', match);
        this.removePendingMatch(match.id);
      } catch (e) {
        console.warn('Retry pending match sync failed, will retry next time:', e);
      }
    }
  },
};

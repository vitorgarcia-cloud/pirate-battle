import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchService } from '../api/matchService';
import type { MatchRecord } from '../api/types';

export const QUERY_KEYS = {
  leaderboard: (page: number, pageSize: number) => ['leaderboard', page, pageSize] as const,
  matchHistory: (page: number, pageSize: number) => ['matchHistory', page, pageSize] as const,
  pendingMatches: ['pendingMatches'] as const,
};

// Hook para consultar ranking
export function useLeaderboard(page: number = 1, pageSize: number = 5) {
  return useQuery({
    queryKey: QUERY_KEYS.leaderboard(page, pageSize),
    queryFn: () => matchService.getLeaderboard(page, pageSize),
    staleTime: 1000 * 30, // 30 segundos de cache fresco
  });
}

// Hook para consultar histórico de partidas
export function useMatchHistory(page: number = 1, pageSize: number = 5) {
  return useQuery({
    queryKey: QUERY_KEYS.matchHistory(page, pageSize),
    queryFn: () => matchService.getMatchHistory(page, pageSize),
    staleTime: 1000 * 30,
  });
}

// Hook de submissão de partida com invalidação automática de cache
export function useSubmitMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (record: MatchRecord) => matchService.submitMatch(record),
    onSuccess: () => {
      // Invalida cache de ranking e histórico para recarregar com dados mais recentes
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['matchHistory'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingMatches });
    },
    onError: () => {
      // Se falhar, atualiza a lista de pendentes para que o usuário veja
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingMatches });
    },
  });
}

// Hook para retentar envio de partidas pendentes
export function useSyncPendingMatches() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => matchService.syncPendingMatches(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['matchHistory'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pendingMatches });
    },
  });
}

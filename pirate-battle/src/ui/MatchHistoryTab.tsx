import React, { useState } from 'react';
import { useMatchHistory, useSyncPendingMatches } from '../hooks/useMatchData';
import { matchService } from '../api/matchService';

export const MatchHistoryTab: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const pageSize = 5;
  const { data, isLoading, isError, error, refetch, isFetching } = useMatchHistory(page, pageSize);
  const syncMutation = useSyncPendingMatches();

  const pendingMatches = matchService.getPendingMatches();

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gold-warm)', fontFamily: 'var(--font-heading)' }}>
        Loading Battle Records...
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: '#fca5a5' }}>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
          Failed to load match history: {(error as Error)?.message || 'Network error'}
        </p>
        <button onClick={() => refetch()} className="pirate-btn-secondary" style={{ margin: '0 auto' }}>
          Retry
        </button>
      </div>
    );
  }

  const entries = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[d.getMonth()];
      const hours = d.getHours().toString().padStart(2, '0');
      const mins = d.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} · ${hours}:${mins}`;
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Subtitle */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--color-parchment-dim)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: '14px',
        }}
      >
        CAPTAIN JACK · YOUR RECENT BATTLES
      </div>

      {/* Unsynced Matches Alert Banner */}
      {pendingMatches.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(245, 176, 65, 0.15)',
            border: '1px solid var(--color-gold-warm)',
            borderRadius: '6px',
            padding: '8px 12px',
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ color: 'var(--color-gold-bright)', fontSize: '12px' }}>
            ⚠️ <strong>{pendingMatches.length}</strong> unsynced offline battle(s) pending.
          </span>
          <button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="pirate-btn-secondary"
            style={{ width: '100px', height: '32px', fontSize: '11px' }}
          >
            {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--color-parchment-dim)', padding: '30px' }}>
          No recorded battles yet. Set sail to fight!
        </div>
      ) : (
        <table className="pirate-table">
          <thead>
            <tr>
              <th style={{ width: '150px' }}>Date</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Points</th>
              <th style={{ width: '100px', textAlign: 'center' }}>Duration</th>
              <th style={{ textAlign: 'right' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isTimeUp = entry.endReason === 'time_up';
              const resultText = isTimeUp ? 'TIME UP' : 'DEFEATED';
              const resultColor = isTimeUp ? 'var(--color-parchment)' : '#f87171';

              return (
                <tr key={entry.id}>
                  <td style={{ fontSize: '12px', color: 'var(--color-parchment)' }}>
                    {formatDate(entry.createdAt)}
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--color-gold-warm)', fontSize: '15px' }}>
                    {entry.score}
                  </td>
                  <td style={{ textAlign: 'center', fontSize: '13px', color: 'var(--color-parchment)' }}>
                    {formatDuration(entry.durationSeconds)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '12px', color: resultColor, letterSpacing: '1px' }}>
                    {resultText}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Pagination Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          marginTop: '16px',
        }}
      >
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || isFetching}
          className="pirate-btn-round"
          style={{ width: '38px', height: '38px' }}
          aria-label="Previous Page"
        >
          <img src="/assets/png/default/ui/controls/icon_turn_left.png" alt="Prev" style={{ width: '18px', height: '18px' }} />
        </button>

        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1.5px',
            color: 'var(--color-parchment)',
          }}
        >
          PAGE {page} OF {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || isFetching}
          className="pirate-btn-round"
          style={{ width: '38px', height: '38px' }}
          aria-label="Next Page"
        >
          <img src="/assets/png/default/ui/controls/icon_turn_right.png" alt="Next" style={{ width: '18px', height: '18px' }} />
        </button>
      </div>
    </div>
  );
};


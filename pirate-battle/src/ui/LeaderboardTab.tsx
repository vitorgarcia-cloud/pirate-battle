import React, { useState } from 'react';
import { useLeaderboard } from '../hooks/useMatchData';

export const LeaderboardTab: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const pageSize = 5;
  const { data, isLoading, isError, error, refetch, isFetching } = useLeaderboard(page, pageSize);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-gold-warm)', fontFamily: 'var(--font-heading)' }}>
        Loading Captain's Log...
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ textAlign: 'center', padding: '30px', color: '#fca5a5' }}>
        <p style={{ margin: '0 0 12px 0', fontSize: '14px' }}>
          Failed to load ranking: {(error as Error)?.message || 'Network error'}
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
        120 SECOND BATTLES · 3 SECOND SPAWN INTERVAL
      </div>

      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--color-parchment-dim)', padding: '30px' }}>
          No records found in this category.
        </div>
      ) : (
        <table className="pirate-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Rank</th>
              <th>Captain</th>
              <th style={{ width: '80px', textAlign: 'center' }}>Points</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Played</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const isFirst = entry.rank === 1;
              const isLocal = entry.playerId === 'player_local';
              const rankFormatted = entry.rank.toString().padStart(2, '0');

              return (
                <tr key={entry.id} className={isLocal ? 'highlight' : ''}>
                  <td style={{ fontWeight: 800, color: 'var(--color-parchment)' }}>
                    {rankFormatted}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isFirst && <span style={{ color: 'var(--color-gold-bright)', fontSize: '15px' }}>★</span>}
                      <span style={{ fontWeight: 700, color: isLocal ? 'var(--color-gold-bright)' : '#ffffff' }}>
                        {entry.playerName}
                      </span>
                      {isLocal && (
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 800,
                            backgroundColor: 'var(--color-gold-warm)',
                            color: '#1a0f07',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            textTransform: 'uppercase',
                          }}
                        >
                          YOU
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--color-gold-warm)', fontSize: '15px' }}>
                    {entry.score}
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-parchment-dim)' }}>
                    {formatDate(entry.createdAt)}
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


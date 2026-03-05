import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';

/**
 * Hook to connect to tournament room and listen for real-time vote updates.
 * @param {string|null} tournamentId - Tournament ID to join
 * @param {function} onVoteUpdate - Callback when vote-update is received
 */
export function useTournamentSocket(tournamentId, onVoteUpdate) {
  const onVoteUpdateRef = useRef(onVoteUpdate);
  onVoteUpdateRef.current = onVoteUpdate;

  useEffect(() => {
    if (!tournamentId || !API_CONFIG.SOCKET_URL) return;

    const socket = io(API_CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      socket.emit('join-tournament', tournamentId);
    });

    socket.on('vote-update', (data) => {
      if (onVoteUpdateRef.current) {
        onVoteUpdateRef.current(data);
      }
    });

    return () => {
      socket.off('vote-update');
      socket.disconnect();
    };
  }, [tournamentId]);
}

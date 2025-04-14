// pages/game/[gameId].tsx

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000'); // Have to replace this with acctual backend server URL once deployed.

type Player = {
  id: string;
  name: string;
};

export default function GameRoom() {
  const router = useRouter();
  const { gameId } = router.query;

  const [players, setPlayers] = useState<Player[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [isFull, setIsFull] = useState(false);
  const [roomUrl, setRoomUrl] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [name, setName] = useState(''); // line to manage game name.

  useEffect(() => {
    if (gameId) {
      const userName = prompt('Enter your name:');
      if (!userName) return;
      setName(userName);

      socket.emit('join-room', { roomId: gameId, name: userName });

      socket.on('room-update', ({ players, hostId }) => {
        setPlayers(players);
        setHostId(hostId);
        setIsFull(false);
      });

      socket.on('room-full', (message: string) => {
        setIsFull(true);
        alert(message);
      });

      socket.on('game-started', () => {
        setGameStarted(true);
      });

      setRoomUrl(window.location.href);

      return () => {
        socket.emit('leave-room', gameId);
        socket.off('room-update');
        socket.off('room-full');
        socket.off('game-started');
      };
    }
  }, [gameId]);

  const isHost = socket.id === hostId;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Game Room: {gameId}</h1>
      <p>Share this link with your friends: <strong>{roomUrl}</strong></p>

      {isFull && <p style={{ color: 'red' }}>This room is full.</p>}

      <h2>Waiting Lobby</h2>
      <p>Players in room: {players.length}/10</p>
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {player.name} {player.id === hostId && <strong>(Host)</strong>}
          </li>
        ))}
      </ul>

      {!gameStarted && isHost && (
        <button onClick={() => socket.emit('start-game', gameId)}>
          Start Game
        </button>
      )}

      {!gameStarted && !isHost && <p>Waiting for host to start the game...</p>}

      {gameStarted && <p>🎮 Game has started!</p>}
    </div>
  );
}

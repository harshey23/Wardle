import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  const createGame = () => {
    const gameId = Math.random().toString(36).substr(2, 6); // Generate a random ID
    router.push(`/game/${gameId}`);
  };

  return (
    <div>
      <h1>Multiplayer Game</h1>
      <button onClick={createGame}>Create Game</button>
    </div>
  );
}
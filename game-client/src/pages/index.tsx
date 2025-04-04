import useWebSocket from '../hooks/useWebSocket';

export default function Home() {
  const { socket, messages } = useWebSocket();

  const sendMessage = () => {
    if (socket) {
      socket.emit('message', `Hello Server! ${Date.now()}`);
    }
  };

  return (
    <div>
      <h1>Multiplayer Game</h1>
      <button onClick={sendMessage}>Send Message</button>
      <div>
        <h2>Messages:</h2>
        <ul>
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

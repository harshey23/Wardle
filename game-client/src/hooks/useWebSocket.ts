import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

export default function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
    });

    newSocket.on('connected', (data) => {
      console.log(data.message);
    });

    newSocket.on('message', (msg) => {
      console.log('Received message:', msg);
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return { socket, messages };
}

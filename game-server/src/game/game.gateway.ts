// src/game/game.gateway.ts

import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type Room = {
  players: string[];
  hostId: string | null;
};

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private rooms: Record<string, Room> = {};

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    for (const roomId in this.rooms) {
      const room = this.rooms[roomId];
      room.players = room.players.filter(id => id !== client.id);

      // Reassign host if host left
      if (room.hostId === client.id) {
        room.hostId = room.players[0] || null;
      }

      if (room.players.length === 0) {
        delete this.rooms[roomId];
      } else {
        this.server.to(roomId).emit('room-update', {
          players: room.players,
          hostId: room.hostId,
        });
      }
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, roomId: string) {
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = {
        players: [],
        hostId: null,
      };
    }

    const room = this.rooms[roomId];

    if (room.players.length >= 10) {
      client.emit('room-full', 'Room is full (max 10 players).');
      return;
    }

    client.join(roomId);
    room.players.push(client.id);

    if (!room.hostId) {
      room.hostId = client.id;
    }

    console.log(`Client ${client.id} joined room ${roomId}`);
    this.server.to(roomId).emit('room-update', {
      players: room.players,
      hostId: room.hostId,
    });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, roomId: string) {
    const room = this.rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(id => id !== client.id);
    if (room.hostId === client.id) {
      room.hostId = room.players[0] || null;
    }

    client.leave(roomId);

    if (room.players.length === 0) {
      delete this.rooms[roomId];
    } else {
      this.server.to(roomId).emit('room-update', {
        players: room.players,
        hostId: room.hostId,
      });
    }

    console.log(`Client ${client.id} left room ${roomId}`);
  }

  @SubscribeMessage('start-game')
  handleStartGame(client: Socket, roomId: string) {
    const room = this.rooms[roomId];
    if (room && client.id === room.hostId) {
      this.server.to(roomId).emit('game-started');
    } else {
      client.emit('error', 'Only the host can start the game.');
    }
  }
}

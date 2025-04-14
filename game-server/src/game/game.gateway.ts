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
  players: string[]; // list of socket IDs
  hostId: string | null;
  playerNames: Record<string, string>; // socket.id -> name
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
      
      //Remove player from room if  disconnected.
      room.players = room.players.filter(id => id !== client.id);
      delete room.playerNames[client.id];
      
      // Reassign host if host left
      if (room.hostId === client.id) {
        room.hostId = room.players[0] || null;
      }

      // If no players left, delete room
      if (room.players.length === 0) {
        delete this.rooms[roomId];
      } else {
        this.server.to(roomId).emit('room-update', {
          players: room.players.map(id => ({ id, name: room.playerNames[id] })),
          hostId: room.hostId,
        });
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, payload: { roomId: string; name: string }) {
    const { roomId, name } = payload;
  
    if (!this.rooms[roomId]) {
      this.rooms[roomId] = {
        players: [],
        hostId: null,
        playerNames: {},
      };
    }
  
    const room = this.rooms[roomId];
  
    if (room.players.length >= 10) {
      client.emit('room-full', 'Room is full (max 10 players).');
      return;
    }
  
    client.join(roomId);
    room.players.push(client.id);
    room.playerNames[client.id] = name;
  
    if (!room.hostId) {
      room.hostId = client.id;
    }
  
    this.server.to(roomId).emit('room-update', {
      players: room.players.map(id => ({ id, name: room.playerNames[id] })),
      hostId: room.hostId,
    });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, roomId: string) {
    const room = this.rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(id => id !== client.id);
    delete room.playerNames[client.id]; // Remove player name
    
    // Reassign host if host left
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

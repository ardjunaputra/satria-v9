import { io, Socket } from 'socket.io-client';
import { IArticle } from '@shared';

class SocketService {
  private socket: Socket | null = null;
  private callbacks: Map<string, Set<Function>> = new Map();

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(socketUrl, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.emit('connected', null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.emit('error', error);
    });

    // Article events
    this.socket.on('new-article', (article: IArticle) => {
      this.emit('new-article', article);
    });

    this.socket.on('article-updated', (article: IArticle) => {
      this.emit('article-updated', article);
    });

    // Alert events
    this.socket.on('alert-triggered', (data: any) => {
      this.emit('alert-triggered', data);
    });

    // Aggregation status events
    this.socket.on('aggregation-status', (data: any) => {
      this.emit('aggregation-status', data);
    });

    // System events
    this.socket.on('system-notification', (data: any) => {
      this.emit('system-notification', data);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.callbacks.clear();
    }
  }

  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set());
    }
    this.callbacks.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    const eventCallbacks = this.callbacks.get(event);
    if (eventCallbacks) {
      eventCallbacks.delete(callback);
    }
  }

  private emit(event: string, data: any): void {
    const eventCallbacks = this.callbacks.get(event);
    if (eventCallbacks) {
      eventCallbacks.forEach((callback) => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

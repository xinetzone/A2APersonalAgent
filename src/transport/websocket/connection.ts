export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

export interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts: number = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private heartbeatTimeoutTimer?: NodeJS.Timeout;
  private messageQueue: WebSocketMessage[] = [];
  private listeners: Map<string, ((data: unknown) => void)[]> = new Map();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      heartbeatTimeout: 10000,
      ...config,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onclose = () => {
          this.stopHeartbeat();
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(message);
          } catch {
            console.error('Failed to parse message:', event.data);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  on(eventType: string, callback: (data: unknown) => void): () => void {
    const listeners = this.listeners.get(eventType) || [];
    listeners.push(callback);
    this.listeners.set(eventType, listeners);
    return () => {
      const callbacks = this.listeners.get(eventType) || [];
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  private handleMessage(message: WebSocketMessage): void {
    if (message.type === 'pong') {
      this.handlePong();
      return;
    }
    const callbacks = this.listeners.get(message.type) || [];
    callbacks.forEach(cb => cb(message.payload));
    const globalCallbacks = this.listeners.get('*') || [];
    globalCallbacks.forEach(cb => cb(message.payload));
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.error('Max reconnect attempts reached');
      return;
    }
    this.reconnectAttempts++;
    setTimeout(() => {
      this.connect().catch(console.error);
    }, this.config.reconnectInterval);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping', payload: null, timestamp: new Date().toISOString() });
      this.heartbeatTimeoutTimer = setTimeout(() => {
        console.error('Heartbeat timeout');
        this.ws?.close();
      }, this.config.heartbeatTimeout);
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
    }
  }

  private handlePong(): void {
    if (this.heartbeatTimeoutTimer) {
      clearTimeout(this.heartbeatTimeoutTimer);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      this.send(message);
    }
  }
}

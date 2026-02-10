/**
 * Wi-Care WebSocket 即時數據服務
 * 
 * 連接後端 WebSocket 接收即時感測器數據、跌倒警報
 * 取代前端 Math.sin 模擬數據
 */

export type WSMessageType = 
  | 'connected'
  | 'sensor_update'
  | 'fall_alert'
  | 'alert_resolved'
  | 'alert_cleared'
  | 'device_status';

export interface WSMessage {
  type: WSMessageType;
  device_id?: string;
  movement_score?: number;
  motion_detected?: boolean;
  status?: string;
  event_id?: number;
  location?: string;
  elderly?: { id: number; name: string; room: string } | null;
  ai_analysis?: string;
  message?: string;
  timestamp?: string;
}

type Listener = (msg: WSMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners = new Map<string, Set<Listener>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 2000;
  private maxReconnectDelay = 30000;
  private currentDelay = 2000;
  private isManualClose = false;
  private _connected = false;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.url = import.meta.env.VITE_WS_URL || `${protocol}//localhost:3001/ws`;
  }

  /** 目前是否已連線 */
  get connected(): boolean {
    return this._connected;
  }

  /** 連接 WebSocket */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    this.isManualClose = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[WS] ✅ 已連線:', this.url);
        this._connected = true;
        this.currentDelay = this.reconnectDelay;
        this.emit('connected', { type: 'connected', message: 'WebSocket 已連線' });
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          this.emit(msg.type, msg);
          this.emit('*', msg); // 萬用監聽
        } catch {
          console.warn('[WS] 無法解析訊息:', event.data);
        }
      };

      this.ws.onclose = () => {
        this._connected = false;
        if (!this.isManualClose) {
          console.log(`[WS] 斷線，${this.currentDelay / 1000}s 後重連...`);
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        // onclose 會自動觸發
      };
    } catch (err) {
      console.error('[WS] 連線失敗:', err);
      this.scheduleReconnect();
    }
  }

  /** 斷開連線 */
  disconnect(): void {
    this.isManualClose = true;
    this._connected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /** 訂閱特定類型的訊息 */
  on(type: string, listener: Listener): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);

    // 返回取消訂閱函式
    return () => {
      this.listeners.get(type)?.delete(listener);
    };
  }

  /** 訂閱所有訊息 */
  onAny(listener: Listener): () => void {
    return this.on('*', listener);
  }

  /** 取消所有監聽 */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  private emit(type: string, msg: WSMessage): void {
    this.listeners.get(type)?.forEach(fn => {
      try { fn(msg); } catch (e) { console.error('[WS] Listener error:', e); }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
      // 指數退避
      this.currentDelay = Math.min(this.currentDelay * 1.5, this.maxReconnectDelay);
    }, this.currentDelay);
  }
}

// 全域單例
export const wsService = new WebSocketService();
export default wsService;

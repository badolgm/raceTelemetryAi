import { LapData, TelemetryDataPoint, Track } from '../types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface TelemetryAdapter {
  start(): void;
  stop(): void;
  onFrame(cb: (frame: TelemetryDataPoint) => void): void;
  onLapData?(cb: (lap: LapData) => void): void;
  onStatus(cb: (status: ConnectionStatus) => void): void;
}

export class SimulatedAdapter implements TelemetryAdapter {
  private track: Track;
  private lapData: LapData;
  private frameCb: ((frame: TelemetryDataPoint) => void) | null = null;
  private statusCb: ((status: ConnectionStatus) => void) | null = null;
  private timer: any = null;
  private index = 0;
  private intervalMs: number;

  constructor(track: Track, lapData: LapData, intervalMs: number = 50) {
    this.track = track;
    this.lapData = lapData;
    this.intervalMs = intervalMs;
  }

  start(): void {
    this.statusCb?.('connecting');
    this.index = 0;
    this.statusCb?.('connected');
    const telemetry = this.lapData.telemetry;
    if (!telemetry || telemetry.length === 0) {
      this.statusCb?.('disconnected');
      return;
    }
    this.timer = setInterval(() => {
      this.frameCb?.(telemetry[this.index]);
      this.index = (this.index + 1) % telemetry.length;
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.statusCb?.('disconnected');
  }

  onFrame(cb: (frame: TelemetryDataPoint) => void): void {
    this.frameCb = cb;
  }

  onLapData?(cb: (lap: LapData) => void): void {
    cb(this.lapData);
  }

  onStatus(cb: (status: ConnectionStatus) => void): void {
    this.statusCb = cb;
  }
}

export class WebSocketAdapter implements TelemetryAdapter {
  private url?: string;
  private ws: WebSocket | null = null;
  private statusCb: ((status: ConnectionStatus) => void) | null = null;
  private frameCb: ((frame: TelemetryDataPoint) => void) | null = null;
  private mockTimer: any = null;
  private lapData?: LapData;
  private index = 0;

  constructor(url?: string, lapDataForMock?: LapData) {
    this.url = url;
    this.lapData = lapDataForMock;
  }

  start(): void {
    this.statusCb?.('connecting');
    if (this.url) {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => this.statusCb?.('connected');
        this.ws.onclose = () => this.statusCb?.('disconnected');
        this.ws.onerror = () => this.statusCb?.('disconnected');
        this.ws.onmessage = (ev: MessageEvent) => {
          try {
            const data = JSON.parse(ev.data);
            // Se espera que data tenga el contrato TelemetryDataPoint
            this.frameCb?.(data as TelemetryDataPoint);
          } catch {}
        };
      } catch {
        this.statusCb?.('disconnected');
      }
    } else if (this.lapData && this.lapData.telemetry.length) {
      // Modo mock: simular streaming si no hay URL
      this.statusCb?.('connected');
      this.mockTimer = setInterval(() => {
        const f = this.lapData!.telemetry[this.index];
        this.frameCb?.(f);
        this.index = (this.index + 1) % this.lapData!.telemetry.length;
      }, 60);
    } else {
      this.statusCb?.('disconnected');
    }
  }

  stop(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.mockTimer) clearInterval(this.mockTimer);
    this.mockTimer = null;
    this.statusCb?.('disconnected');
  }

  onFrame(cb: (frame: TelemetryDataPoint) => void): void { this.frameCb = cb; }
  onLapData?(cb: (lap: LapData) => void): void { if (this.lapData) cb(this.lapData); }
  onStatus(cb: (status: ConnectionStatus) => void): void { this.statusCb = cb; }
}
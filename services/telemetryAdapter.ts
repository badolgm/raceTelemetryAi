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

// CSV Mapping specification for raw telemetry files
export interface CsvMappingSpec {
  Laptrigger_lapdist_dls: string; // column name for distance from S/F (meters preferred)
  Speed: string;                   // column name for speed
  rpm: string;                     // column name for engine rpm
  Gear: string;                    // column name for gear
  at: string;                      // column name for throttle
  pbrake_f?: string;               // optional column for front brake pressure
  SteeringAngle?: string;          // optional column for steering angle
  units?: {
    Laptrigger_lapdist_dls?: 'm' | 'ft';
    Speed?: 'km/h' | 'mph';
    at?: '%' | 'fraction';
    pbrake_f?: 'bar' | 'psi';
    SteeringAngle?: 'deg';
  };
  sampling_hz?: number;
}

export interface CsvSourceConfig {
  csvUrl: string;              // URL under public/ to the CSV file
  mapping?: CsvMappingSpec;    // mapping object inline
  mappingUrl?: string;         // or URL under public/ to mapping JSON
  track: Track;                // track reference
  lapNumber?: number;          // lap number (if known)
  intervalMs?: number;         // frame stream interval
}

/**
 * CsvFileAdapter — streams telemetry from a CSV using a mapping spec
 * Assumes the CSV has a header row and numeric values in subsequent rows.
 * Keeps conversions coherent with riskEngine units.
 */
export class CsvFileAdapter implements TelemetryAdapter {
  private cfg: CsvSourceConfig;
  private frameCb: ((frame: TelemetryDataPoint) => void) | null = null;
  private statusCb: ((status: ConnectionStatus) => void) | null = null;
  private lapCb: ((lap: LapData) => void) | null = null;
  private timer: any = null;
  private index = 0;
  private lapData: LapData | null = null;

  constructor(cfg: CsvSourceConfig) {
    this.cfg = cfg;
  }

  async start(): Promise<void> {
    this.statusCb?.('connecting');
    try {
      // Load mapping
      let mapping = this.cfg.mapping || null;
      if (!mapping && this.cfg.mappingUrl) {
        const mres = await fetch(this.cfg.mappingUrl);
        mapping = await mres.json();
      }
      if (!mapping) {
        throw new Error('CsvFileAdapter requires mapping or mappingUrl');
      }

      // Load CSV
      const res = await fetch(this.cfg.csvUrl);
      const text = await res.text();
      const { headers, rows } = parseCsv(text);
      const hmap = headers.reduce<Record<string, number>>((acc, h, i) => { acc[h] = i; return acc; }, {});

      const idx = (name?: string) => {
        if (!name) return -1;
        if (hmap[name] !== undefined) return hmap[name];
        // fallback: case-insensitive search
        const found = Object.entries(hmap).find(([k]) => k.toLowerCase() === name.toLowerCase());
        return found ? found[1] : -1;
      };

      const conv = converters(mapping);

      const telemetry: TelemetryDataPoint[] = [];
      const di = idx(mapping.Laptrigger_lapdist_dls);
      const si = idx(mapping.Speed);
      const ri = idx(mapping.rpm);
      const gi = idx(mapping.Gear);
      const ti = idx(mapping.at);
      const bi = idx(mapping.pbrake_f);
      const ai = idx(mapping.SteeringAngle);

      for (const r of rows) {
        const pick = (i: number) => (i >= 0 && i < r.length ? r[i] : '');
        const dp: TelemetryDataPoint = {
          Laptrigger_lapdist_dls: conv.distance(toNum(pick(di))),
          Speed: conv.speed(toNum(pick(si))),
          rpm: toNum(pick(ri)) || 0,
          Gear: toInt(pick(gi)) || 0,
          at: conv.throttle(toNum(pick(ti))),
          pbrake_f: conv.brake(toNum(pick(bi))),
          SteeringAngle: toNum(pick(ai)) || 0,
        };
        telemetry.push(dp);
      }

      this.lapData = {
        lapNumber: this.cfg.lapNumber ?? 1,
        lapTime: 'unknown',
        telemetry,
      };
      this.statusCb?.('connected');
      this.lapCb?.(this.lapData);
      const interval = this.cfg.intervalMs ?? (mapping.sampling_hz ? Math.max(10, Math.round(1000 / mapping.sampling_hz)) : 50);
      this.index = 0;
      this.timer = setInterval(() => {
        if (!this.lapData) return;
        const frame = this.lapData.telemetry[this.index];
        this.frameCb?.(frame);
        this.index = (this.index + 1) % this.lapData.telemetry.length;
      }, interval);
    } catch (err) {
      console.error('CsvFileAdapter start error:', err);
      this.statusCb?.('disconnected');
    }
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.statusCb?.('disconnected');
  }

  onFrame(cb: (frame: TelemetryDataPoint) => void): void { this.frameCb = cb; }
  onLapData(cb: (lap: LapData) => void): void { this.lapCb = cb; }
  onStatus(cb: (status: ConnectionStatus) => void): void { this.statusCb = cb; }
}

// --- Helpers ---
function toNum(v: string): number { if (!v) return 0; const t = v.replace(',', '.'); const n = Number(t); return isFinite(n) ? n : 0; }
function toInt(v: string): number { const n = Math.trunc(toNum(v)); return isFinite(n) ? n : 0; }

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    rows.push(splitCsvLine(lines[i]));
  }
  return { headers, rows };
}

function splitCsvLine(line: string): string[] {
  // simple CSV splitter with quotes support
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function converters(mapping: CsvMappingSpec) {
  const speedUnit = mapping.units?.Speed ?? 'km/h';
  const thrUnit = mapping.units?.at ?? '%';
  const brakeUnit = mapping.units?.pbrake_f ?? 'bar';
  const distUnit = mapping.units?.Laptrigger_lapdist_dls ?? 'm';
  return {
    speed: (v: number) => speedUnit === 'mph' ? v * 1.60934 : v,
    throttle: (v: number) => thrUnit === 'fraction' ? v * 100 : v,
    brake: (v: number) => brakeUnit === 'psi' ? v * 0.0689476 : v,
    distance: (v: number) => distUnit === 'ft' ? v * 0.3048 : v,
  };
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
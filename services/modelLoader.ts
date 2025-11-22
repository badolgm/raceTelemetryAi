export interface TrackModelNormalization {
  speedMax: number;   // km/h
  rpmMax: number;     // rpm
  brakeMax: number;   // presión/porcentaje
  steerMax: number;   // grados
}

export interface TrackModel {
  id: string;
  normalization: TrackModelNormalization;
  sectorCount?: number;
  // Definición opcional de sectores precisos por longitud
  sectors?: Array<{ name?: string; length_m: number }>
  // Pit lane positions opcionales en metros desde línea de meta
  pit?: { entry_m?: number | null; exit_m?: number | null };
  // Longitud opcional para sobreescribir si difiere del catálogo
  lapDistance_m?: number;
  // Espacio para parámetros físicos futuros (coeficientes térmicos, mu, etc.)
  physics?: Record<string, number>;
}

export interface RiskModel {
  weights?: { tire: number; engine: number; brake: number };
  thresholds?: {
    overallHigh?: number;
    engineHigh?: number;
    engineCritical?: number;
    tireWearHigh?: number;
    tireWearMedium?: number;
    fuelCriticalPct?: number;
    fuelHighPct?: number;
  };
}

const defaultModel: TrackModel = {
  id: 'default',
  normalization: {
    speedMax: 280,
    rpmMax: 8500,
    brakeMax: 80,
    steerMax: 45,
  },
  sectorCount: 12,
};

let cache: Record<string, TrackModel> = {};
let riskCache: Record<string, RiskModel> = {};

export async function loadTrackModel(trackId: string): Promise<TrackModel> {
  if (cache[trackId]) return cache[trackId];
  try {
    const res = await fetch(`/DataFiles/models/trackModels.json`);
    if (!res.ok) throw new Error('no model file');
    const json = await res.json();
    const entry = json[trackId] || {};
    const model: TrackModel = {
      ...defaultModel,
      id: trackId,
      normalization: { ...defaultModel.normalization, ...(entry.normalization || {}) },
      sectorCount: entry.sectorCount ?? defaultModel.sectorCount,
      sectors: Array.isArray(entry.sectors) ? entry.sectors : undefined,
      pit: entry.pit || undefined,
      lapDistance_m: typeof entry.lapDistance_m === 'number' ? entry.lapDistance_m : undefined,
      physics: entry.physics || {},
    };
    cache[trackId] = model;
    return model;
  } catch {
    cache[trackId] = { ...defaultModel, id: trackId };
    return cache[trackId];
  }
}

export function getTrackModelSync(trackId: string): TrackModel {
  return cache[trackId] || { ...defaultModel, id: trackId };
}

export async function loadRiskModel(trackId: string): Promise<RiskModel> {
  if (riskCache[trackId]) return riskCache[trackId];
  try {
    const res = await fetch(`/DataFiles/models/riskModel.json`);
    if (!res.ok) throw new Error('no risk model file');
    const json = await res.json();
    const entry = json[trackId] || {};
    const defaults: RiskModel = { weights: { tire: 0.45, engine: 0.3, brake: 0.25 }, thresholds: {} };
    riskCache[trackId] = { ...defaults, ...entry };
    return riskCache[trackId];
  } catch {
    const defaults: RiskModel = { weights: { tire: 0.45, engine: 0.3, brake: 0.25 }, thresholds: {} };
    riskCache[trackId] = defaults;
    return defaults;
  }
}

export function getRiskModelSync(trackId: string): RiskModel {
  return riskCache[trackId] || { weights: { tire: 0.45, engine: 0.3, brake: 0.25 }, thresholds: {} };
}
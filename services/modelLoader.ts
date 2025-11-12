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
  // Espacio para parámetros físicos futuros (coeficientes térmicos, mu, etc.)
  physics?: Record<string, number>;
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
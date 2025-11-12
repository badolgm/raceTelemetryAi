export interface TrackCalibration {
  engineTempCritical?: number; // °C
  engineTempHigh?: number; // °C
  tireWearHigh?: number; // 0..1
  tireWearMedium?: number; // 0..1
  fuelCriticalPct?: number; // 0..1
  fuelHighPct?: number; // 0..1
  // Transformación del overlay del mapa para alinear el cursor con el PDF/imagen
  mapTransform?: {
    scaleX: number;
    scaleY: number;
    offsetX: number; // en el sistema 0..100 del overlay
    offsetY: number; // en el sistema 0..100 del overlay
    rotate: number;  // grados, sentido horario
  };
}

const defaults: TrackCalibration = {
  engineTempCritical: 110,
  engineTempHigh: 105,
  tireWearHigh: 0.9,
  tireWearMedium: 0.75,
  fuelCriticalPct: 0.08,
  fuelHighPct: 0.12,
  mapTransform: { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0, rotate: 0 },
};

let cache: Record<string, TrackCalibration> = {};

export async function loadCalibration(trackId: string): Promise<TrackCalibration> {
  if (cache[trackId]) return cache[trackId];
  try {
    const res = await fetch(`/DataFiles/config/calibration.json`);
    if (!res.ok) throw new Error('no calibration file');
    const json = await res.json();
    const cal = json[trackId] || {};
    cache[trackId] = { ...defaults, ...cal };
    return cache[trackId];
  } catch {
    cache[trackId] = defaults;
    return defaults;
  }
}

export function getCalibrationSync(trackId: string): TrackCalibration {
  return cache[trackId] || defaults;
}
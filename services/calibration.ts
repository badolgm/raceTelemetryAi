export interface TrackCalibration {
  engineTempCritical?: number; // °C
  engineTempHigh?: number; // °C
  tireWearHigh?: number; // 0..1
  tireWearMedium?: number; // 0..1
  fuelCriticalPct?: number; // 0..1
  fuelHighPct?: number; // 0..1
}

const defaults: TrackCalibration = {
  engineTempCritical: 110,
  engineTempHigh: 105,
  tireWearHigh: 0.9,
  tireWearMedium: 0.75,
  fuelCriticalPct: 0.08,
  fuelHighPct: 0.12,
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
import { LapData, Track, TelemetryDataPoint, AIAnalysis } from '../types';
import { getCalibrationSync } from './calibration';
import { getTrackModelSync, getRiskModelSync } from './modelLoader';

export interface SectorRisk {
  sector: number;
  start: number; // meters
  end: number;   // meters
  tireRisk: number;   // 0..1
  engineRisk: number; // 0..1
  brakeRisk: number;  // 0..1
  overall: number;    // 0..1
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

const movingAvg = (arr: number[], window: number) => {
  const res: number[] = [];
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= window) sum -= arr[i - window];
    res.push(sum / Math.min(i + 1, window));
  }
  return res;
};

export const computeSectorRisks = (lapData: LapData, track: Track, numSectors = 12): SectorRisk[] => {
  const model = getTrackModelSync(track.id);
  const sectors: SectorRisk[] = [];

  // Si hay sectores configurados con longitudes precisas, calcular start/end acumulados
  let boundaries: Array<{ start: number; end: number }> = [];
  const lapLen = model.lapDistance_m ?? track.lapDistance;
  if (Array.isArray(model.sectors) && model.sectors.length > 0) {
    let accum = 0;
    for (const seg of model.sectors) {
      const len = Math.max(0, seg.length_m);
      const start = accum;
      const end = Math.min(lapLen, accum + len);
      boundaries.push({ start, end });
      accum = end;
    }
    // Si la suma no alcanza la vuelta completa, rellenar el último tramo
    if (accum < lapLen) boundaries.push({ start: accum, end: lapLen });
  } else {
    const count = model.sectorCount ?? numSectors;
    const sectorLen = lapLen / count;
    for (let s = 0; s < count; s++) {
      boundaries.push({ start: s * sectorLen, end: (s + 1) * sectorLen });
    }
  }

  // Precompute arrays
  const speeds = lapData.telemetry.map(t => t.Speed);
  const rpms = lapData.telemetry.map(t => t.rpm);
  const brakes = lapData.telemetry.map(t => t.pbrake_f ?? 0);
  const steer = lapData.telemetry.map(t => Math.abs(t.SteeringAngle ?? 0));

  const speedMA = movingAvg(speeds, 12);
  const rpmMA = movingAvg(rpms, 12);
  const brakeMA = movingAvg(brakes, 12);
  const steerMA = movingAvg(steer, 12);

  const points = lapData.telemetry;

  for (let s = 0; s < boundaries.length; s++) {
    const start = boundaries[s].start;
    const end = boundaries[s].end;

    const inSector: TelemetryDataPoint[] = points.filter(p => p.Laptrigger_lapdist_dls >= start && p.Laptrigger_lapdist_dls < end);
    const idxs = inSector.map(p => points.indexOf(p));

    if (inSector.length === 0) {
      sectors.push({ sector: s + 1, start, end, tireRisk: 0, engineRisk: 0, brakeRisk: 0, overall: 0 });
      continue;
    }

    const avgSpeed = inSector.reduce((a, b) => a + b.Speed, 0) / inSector.length;
    const avgSteer = idxs.reduce((a, i) => a + steerMA[i], 0) / inSector.length;
    const avgBrake = idxs.reduce((a, i) => a + brakeMA[i], 0) / inSector.length;
    const avgRpm = idxs.reduce((a, i) => a + rpmMA[i], 0) / inSector.length;

    // Tire risk proxy: speed * steering + braking spikes
    const norm = model.normalization;
    const tireRisk = clamp01((avgSpeed / (norm.speedMax || 280)) * (avgSteer / (norm.steerMax || 45)) + (avgBrake / (norm.brakeMax || 80)) * 0.4);

    // Engine risk proxy: sustained high RPM relative to gear and speed
    const engineRisk = clamp01((avgRpm / (norm.rpmMax || 8500)) * 0.9 + (avgSpeed / (norm.speedMax || 300)) * 0.1);

    // Brake risk proxy: pressure and decel intensity
    const brakeRisk = clamp01((avgBrake / (norm.brakeMax || 80)) * 0.8 + (avgSteer / (norm.steerMax || 45)) * 0.2);

    const rm = getRiskModelSync(track.id);
    const w = rm.weights || { tire: 0.45, engine: 0.3, brake: 0.25 };
    const overall = clamp01(tireRisk * (w.tire ?? 0.45) + engineRisk * (w.engine ?? 0.3) + brakeRisk * (w.brake ?? 0.25));

    sectors.push({ sector: s + 1, start, end, tireRisk, engineRisk, brakeRisk, overall });
  }

  return sectors;
};

export const computeRiskAnalysis = (lapData: LapData, track: Track): AIAnalysis & { pitWindow: string; } => {
  const sectors = computeSectorRisks(lapData, track);
  const avgOverall = sectors.reduce((a, s) => a + s.overall, 0) / Math.max(1, sectors.length);

  // Simple pit window heuristic: if average overall risk > 0.6, suggest pit in next 2 sectors
  const maxSector = sectors.reduce((prev, curr) => (curr.overall > prev.overall ? curr : prev), sectors[0]);
  const pitWindow = avgOverall > 0.6
    ? `High risk. Consider pit between sector ${maxSector.sector} and ${Math.min(maxSector.sector + 2, sectors.length)}.`
    : `Risk moderate. Monitor sectors ${maxSector.sector}-${Math.min(maxSector.sector + 1, sectors.length)}.`;

  const areas = [
    maxSector.tireRisk > 0.6 ? 'Elevado desgaste de llantas en sectores críticos.' : 'Desgaste de llantas controlado.',
    maxSector.engineRisk > 0.6 ? 'RPM sostenido alto: riesgo térmico del motor.' : 'RPM dentro de rangos seguros.',
    maxSector.brakeRisk > 0.6 ? 'Calentamiento/fatiga de frenos por presión sostenida.' : 'Frenos en rango aceptable.'
  ];

  const detailed = sectors.slice(0, 5).map(s => ({
    location: `Sector ${s.sector}`,
    advice: `Riesgo global ${(s.overall*100).toFixed(0)}%. Reducir velocidad media y suavizar ángulo de dirección. Evitar frenadas prolongadas.`
  }));

  const analysis: AIAnalysis & { pitWindow: string } = {
    overallSummary: `Riesgo medio ${(avgOverall*100).toFixed(0)}%. ${pitWindow}`,
    areasForImprovement: areas,
    detailedRecommendations: detailed,
    pitWindow
  };

  return analysis;
};

// ---- Visual Alerts integration (minimal) ----
// Estructura que usan las alertas visuales para mostrar estado de componentes y riesgo
export interface RiskAnalysis {
  overallRisk: number; // 0..1
  componentStatus: {
    engine: { temp: number; risk: number };
    tires: { wear: number };
    brakes: { wear: number };
    fuel: { level: number };
  };
  pitWindow?: {
    urgency: 'low' | 'medium' | 'high' | 'critical';
    lapsRemaining: number;
    reason: string;
    timeToDecision: number; // seconds
    recommended: boolean;
  };
}

// Convierte telemetría actual a un resumen utilizable por VisualAlerts
export const computeVisualRiskAnalysis = (lapData: LapData, track: Track): RiskAnalysis => {
  const sectors = computeSectorRisks(lapData, track);
  const overall = sectors.reduce((a, s) => a + s.overall, 0) / Math.max(1, sectors.length);

  const last = lapData.telemetry[lapData.telemetry.length - 1];
  const rpm = last?.rpm ?? 0;
  const brake = last?.pbrake_f ?? 0;
  const steer = Math.abs(last?.SteeringAngle ?? 0);
  const speed = last?.Speed ?? 0;
  const dist = last?.Laptrigger_lapdist_dls ?? 0;

  const cal = getCalibrationSync(track.id);
  const model = getTrackModelSync(track.id);
  const norm = model.normalization;
  const rm = getRiskModelSync(track.id);
  const engineTemp = Math.min(115, 70 + (rpm / (norm.rpmMax || 8500)) * 45);
  const eCrit = (rm.thresholds?.engineCritical ?? cal.engineTempCritical ?? 110);
  const eHigh = (rm.thresholds?.engineHigh ?? cal.engineTempHigh ?? 105);
  const engineRisk = engineTemp > eCrit ? 1.0 : engineTemp > eHigh ? 0.9 : engineTemp > 95 ? 0.7 : overall;
  const tireWear = Math.min(1, (steer / Math.max(60, norm.steerMax || 45)) * 0.6 + (speed / Math.max(300, norm.speedMax || 280)) * 0.4);
  const brakeWear = Math.min(1, (brake / (norm.brakeMax || 80)));
  const lapLen = model.lapDistance_m ?? track.lapDistance;
  const fuelLevel = Math.max(0, 1 - dist / Math.max(1, lapLen));

  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let reason = '';
  const fCrit = (rm.thresholds?.fuelCriticalPct ?? cal.fuelCriticalPct ?? 0.08);
  const fHigh = (rm.thresholds?.fuelHighPct ?? cal.fuelHighPct ?? 0.12);
  const tHigh = (rm.thresholds?.tireWearHigh ?? cal.tireWearHigh ?? 0.9);
  const tMed = (rm.thresholds?.tireWearMedium ?? cal.tireWearMedium ?? 0.75);
  if (fuelLevel < fCrit) { urgency = 'critical'; reason = 'Combustible crítico'; }
  else if (fuelLevel < fHigh) { urgency = 'high'; reason = 'Combustible bajo'; }
  else if (tireWear > tHigh) { urgency = 'high'; reason = 'Desgaste de llantas'; }
  else if (tireWear > tMed) { urgency = 'medium'; reason = 'Desgaste de llantas'; }
  else if (engineRisk > 0.9) { urgency = 'high'; reason = 'Temperatura del motor'; }
  else if (engineRisk > 0.8) { urgency = 'medium'; reason = 'Temperatura del motor'; }

  const lapsRemaining = Math.max(0, Math.round((fuelLevel * track.lapDistance) / Math.max(1, track.lapDistance)));

  return {
    overallRisk: overall,
    componentStatus: {
      engine: { temp: engineTemp, risk: engineRisk * 100 },
      tires: { wear: tireWear * 100 },
      brakes: { wear: brakeWear * 100 },
      fuel: { level: fuelLevel * 100 },
    },
    pitWindow: urgency === 'low' ? undefined : {
      urgency,
      lapsRemaining,
      reason: reason || 'Estrategia',
      timeToDecision: 30,
      recommended: true,
    },
  };
};
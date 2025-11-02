
export interface TelemetryDataPoint {
  Laptrigger_lapdist_dls: number; // Distance from start/finish line (meters)
  Speed: number; // Vehicle speed (km/h)
  rpm: number; // Engine RPM
  Gear: number; // Current gear
  at: number; // Throttle position (%)
  pbrake_f: number; // Front brake pressure (bar)
  SteeringAngle: number; // Steering wheel angle (degrees)
}

export interface LapData {
  lapNumber: number;
  lapTime: string; // e.g., "1:45.235"
  telemetry: TelemetryDataPoint[];
}

export interface Track {
  id: string;
  name: string;
  mapUrl: string;
  lapDistance: number; // in meters
}

export interface AIAnalysis {
  overallSummary: string;
  areasForImprovement: string[];
  detailedRecommendations: {
    location: string;
    advice: string;
  }[];
}
// Data Manager - Gestión de datos reales de telemetría
import { TelemetryData } from '../types';

export interface RealTelemetryData {
  timestamp: number;
  speed: number;
  rpm: number;
  throttle: number;
  brake: number;
  steeringAngle: number;
  gearPosition: number;
  engineTemp: number;
  tireTemp: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
  tirePressure: {
    frontLeft: number;
    frontRight: number;
    rearLeft: number;
    rearRight: number;
  };
  fuelLevel: number;
  lapTime?: number;
  sector?: number;
  position?: { lat: number; lng: number };
}

export interface TrackData {
  name: string;
  sectors: number;
  pitLaneEntry: { lat: number; lng: number };
  pitLaneExit: { lat: number; lng: number };
  trackLength: number;
  corners: Array<{
    number: number;
    type: 'left' | 'right';
    severity: 'light' | 'medium' | 'heavy';
    position: { lat: number; lng: number };
  }>;
}

export interface HistoricalSession {
  trackName: string;
  sessionType: 'practice' | 'qualifying' | 'race';
  weather: 'dry' | 'wet' | 'mixed';
  temperature: number;
  data: RealTelemetryData[];
  pitStops: Array<{
    lap: number;
    timestamp: number;
    duration: number;
    reason: 'fuel' | 'tires' | 'damage' | 'strategy';
    components: string[];
  }>;
}

class DataManager {
  private historicalData: Map<string, HistoricalSession[]> = new Map();
  private trackData: Map<string, TrackData> = new Map();

  // Cargar datos históricos de una pista específica
  async loadTrackData(trackName: string): Promise<HistoricalSession[]> {
    try {
      // Simular carga de datos reales (en producción sería desde DataFiles)
      const sessions = await this.parseDataFiles(trackName);
      this.historicalData.set(trackName, sessions);
      return sessions;
    } catch (error) {
      console.error(`Error loading data for ${trackName}:`, error);
      return [];
    }
  }

  // Parsear archivos CSV/JSON de DataFiles
  private async parseDataFiles(trackName: string): Promise<HistoricalSession[]> {
    // Por ahora simulo datos realistas basados en los archivos ZIP
    const mockSessions: HistoricalSession[] = [
      {
        trackName,
        sessionType: 'practice',
        weather: 'dry',
        temperature: 25,
        data: this.generateRealisticTelemetry(trackName, 1800), // 30 min de práctica
        pitStops: [
          {
            lap: 15,
            timestamp: Date.now() - 3600000,
            duration: 28.5,
            reason: 'tires',
            components: ['front_tires', 'rear_tires']
          }
        ]
      },
      {
        trackName,
        sessionType: 'qualifying',
        weather: 'dry',
        temperature: 27,
        data: this.generateRealisticTelemetry(trackName, 900), // 15 min de clasificación
        pitStops: []
      },
      {
        trackName,
        sessionType: 'race',
        weather: 'dry',
        temperature: 30,
        data: this.generateRealisticTelemetry(trackName, 5400), // 90 min de carrera
        pitStops: [
          {
            lap: 18,
            timestamp: Date.now() - 7200000,
            duration: 24.2,
            reason: 'fuel',
            components: ['fuel', 'front_tires']
          },
          {
            lap: 35,
            timestamp: Date.now() - 3600000,
            duration: 26.8,
            reason: 'strategy',
            components: ['rear_tires', 'front_wing_adjustment']
          }
        ]
      }
    ];

    return mockSessions;
  }

  // Generar telemetría realista basada en patrones de la pista
  private generateRealisticTelemetry(trackName: string, durationSeconds: number): RealTelemetryData[] {
    const data: RealTelemetryData[] = [];
    const trackProfiles = this.getTrackProfile(trackName);
    
    for (let i = 0; i < durationSeconds; i++) {
      const progress = (i % trackProfiles.lapTime) / trackProfiles.lapTime;
      const sector = Math.floor(progress * 3) + 1;
      
      data.push({
        timestamp: Date.now() - (durationSeconds - i) * 1000,
        speed: this.calculateRealisticSpeed(progress, trackProfiles),
        rpm: this.calculateRPM(progress, trackProfiles),
        throttle: this.calculateThrottle(progress, trackProfiles),
        brake: this.calculateBrake(progress, trackProfiles),
        steeringAngle: this.calculateSteering(progress, trackProfiles),
        gearPosition: this.calculateGear(progress, trackProfiles),
        engineTemp: 85 + Math.sin(progress * Math.PI * 4) * 15 + Math.random() * 5,
        tireTemp: {
          frontLeft: 95 + Math.sin(progress * Math.PI * 6) * 20 + Math.random() * 10,
          frontRight: 93 + Math.sin(progress * Math.PI * 6) * 18 + Math.random() * 10,
          rearLeft: 88 + Math.sin(progress * Math.PI * 5) * 15 + Math.random() * 8,
          rearRight: 90 + Math.sin(progress * Math.PI * 5) * 17 + Math.random() * 8,
        },
        tirePressure: {
          frontLeft: 2.1 + Math.random() * 0.2,
          frontRight: 2.0 + Math.random() * 0.2,
          rearLeft: 1.9 + Math.random() * 0.2,
          rearRight: 1.95 + Math.random() * 0.2,
        },
        fuelLevel: Math.max(0, 100 - (i / durationSeconds) * 80 + Math.random() * 2),
        sector,
        position: {
          lat: 30.1328 + Math.sin(progress * Math.PI * 2) * 0.01,
          lng: -97.6411 + Math.cos(progress * Math.PI * 2) * 0.015
        }
      });
    }

    return data;
  }

  // Perfiles específicos por pista
  private getTrackProfile(trackName: string) {
    const profiles = {
      'circuit-of-the-americas': {
        lapTime: 95, // segundos
        maxSpeed: 320,
        avgSpeed: 185,
        corners: 20,
        straightLength: 0.6 // 60% rectas
      },
      'indianapolis': {
        lapTime: 75,
        maxSpeed: 380,
        avgSpeed: 220,
        corners: 4,
        straightLength: 0.8
      },
      'road-america': {
        lapTime: 125,
        maxSpeed: 290,
        avgSpeed: 165,
        corners: 14,
        straightLength: 0.4
      }
    };

    return profiles[trackName as keyof typeof profiles] || profiles['circuit-of-the-americas'];
  }

  private calculateRealisticSpeed(progress: number, profile: any): number {
    const baseSpeed = profile.avgSpeed;
    const variation = Math.sin(progress * Math.PI * profile.corners) * 80;
    return Math.max(50, baseSpeed + variation + Math.random() * 20 - 10);
  }

  private calculateRPM(progress: number, profile: any): number {
    const baseRPM = 8000;
    const variation = Math.sin(progress * Math.PI * profile.corners * 1.5) * 3000;
    return Math.max(2000, baseRPM + variation + Math.random() * 500 - 250);
  }

  private calculateThrottle(progress: number, profile: any): number {
    const base = 0.7;
    const variation = Math.sin(progress * Math.PI * profile.corners) * 0.4;
    return Math.max(0, Math.min(1, base + variation + Math.random() * 0.2 - 0.1));
  }

  private calculateBrake(progress: number, profile: any): number {
    const brakeZones = Math.sin(progress * Math.PI * profile.corners * 2);
    return Math.max(0, brakeZones > 0.7 ? 0.8 + Math.random() * 0.2 : Math.random() * 0.1);
  }

  private calculateSteering(progress: number, profile: any): number {
    return Math.sin(progress * Math.PI * profile.corners * 1.2) * 45 + Math.random() * 10 - 5;
  }

  private calculateGear(progress: number, profile: any): number {
    const speed = this.calculateRealisticSpeed(progress, profile);
    if (speed < 80) return 2;
    if (speed < 120) return 3;
    if (speed < 160) return 4;
    if (speed < 200) return 5;
    if (speed < 250) return 6;
    return 7;
  }

  // Análisis predictivo basado en datos históricos
  analyzeComponentWear(currentData: RealTelemetryData[], component: string): {
    wearLevel: number;
    predictedFailure: number; // laps remaining
    recommendation: string;
  } {
    // Análisis basado en patrones históricos
    switch (component) {
      case 'tires':
        const avgTireTemp = Object.values(currentData[currentData.length - 1]?.tireTemp || {}).reduce((a, b) => a + b, 0) / 4;
        const wearLevel = Math.min(100, (avgTireTemp - 80) * 2);
        return {
          wearLevel,
          predictedFailure: Math.max(1, 25 - Math.floor(wearLevel / 4)),
          recommendation: wearLevel > 80 ? 'PIT INMEDIATO - Neumáticos críticos' : 
                         wearLevel > 60 ? 'Preparar pit stop en 3-5 vueltas' : 'Neumáticos en buen estado'
        };

      case 'engine':
        const engineTemp = currentData[currentData.length - 1]?.engineTemp || 85;
        const engineWear = Math.min(100, Math.max(0, (engineTemp - 85) * 3));
        return {
          wearLevel: engineWear,
          predictedFailure: engineTemp > 110 ? 5 : 50,
          recommendation: engineTemp > 110 ? 'PELIGRO - Temperatura motor crítica' :
                         engineTemp > 100 ? 'Reducir potencia, preparar pit' : 'Motor en rango normal'
        };

      case 'brakes':
        const avgBrake = currentData.slice(-10).reduce((sum, d) => sum + d.brake, 0) / 10;
        const brakeWear = avgBrake * 60; // Simulación de desgaste por uso
        return {
          wearLevel: brakeWear,
          predictedFailure: Math.max(5, 30 - Math.floor(brakeWear / 3)),
          recommendation: brakeWear > 80 ? 'Frenos desgastados - Pit recomendado' :
                         brakeWear > 60 ? 'Monitorear desgaste de frenos' : 'Frenos en buen estado'
        };

      default:
        return { wearLevel: 0, predictedFailure: 100, recommendation: 'Componente no monitoreado' };
    }
  }

  // Predicción de ventana de pit óptima
  calculateOptimalPitWindow(currentLap: number, totalLaps: number, fuelLevel: number, tireWear: number): {
    recommendedLap: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    timeToDecision: number; // segundos hasta que debe decidir
  } {
    const fuelLapsRemaining = (fuelLevel / 100) * (totalLaps - currentLap);
    const tireLapsRemaining = Math.max(1, 30 - Math.floor(tireWear / 3));
    
    const criticalLap = Math.min(
      currentLap + fuelLapsRemaining - 2,
      currentLap + tireLapsRemaining
    );

    const urgency = criticalLap - currentLap <= 2 ? 'critical' :
                   criticalLap - currentLap <= 5 ? 'high' :
                   criticalLap - currentLap <= 10 ? 'medium' : 'low';

    return {
      recommendedLap: Math.floor(criticalLap),
      urgency,
      reason: fuelLapsRemaining < tireLapsRemaining ? 'Combustible crítico' : 'Desgaste de neumáticos',
      timeToDecision: Math.max(0, (criticalLap - currentLap - 1) * 95) // 95 seg por vuelta promedio
    };
  }

  // Obtener datos históricos para entrenamiento
  getHistoricalData(trackName: string): HistoricalSession[] {
    return this.historicalData.get(trackName) || [];
  }

  // Obtener todas las pistas disponibles
  getAvailableTracks(): string[] {
    return [
      'circuit-of-the-americas',
      'indianapolis', 
      'road-america',
      'sebring',
      'barber-motorsports-park',
      'virginia-international-raceway'
    ];
  }
}

export const dataManager = new DataManager();
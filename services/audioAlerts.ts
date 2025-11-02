// Audio Alerts System - Sistema de alertas por voz para el piloto
export interface AlertMessage {
  id: string;
  type: 'pit_warning' | 'pit_now' | 'critical_temp' | 'tire_degradation' | 'fuel_low' | 'strategy' | 'safety';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  spoken: boolean;
  repeatAfter?: number; // segundos para repetir
}

export interface VoiceSettings {
  enabled: boolean;
  language: 'es-ES' | 'en-US';
  rate: number; // 0.5 - 2.0
  pitch: number; // 0 - 2
  volume: number; // 0 - 1
  voice?: string;
}

class AudioAlertsSystem {
  private synthesis: SpeechSynthesis;
  private alertQueue: AlertMessage[] = [];
  private currentAlert: AlertMessage | null = null;
  private settings: VoiceSettings;
  private isEnabled: boolean = true;
  private lastSpokenTime: number = 0;
  private minTimeBetweenAlerts: number = 3000; // 3 segundos mínimo entre alertas

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.settings = {
      enabled: true,
      language: 'es-ES',
      rate: 1.1, // Ligeramente más rápido para urgencia
      pitch: 1.0,
      volume: 0.9,
    };

    // Configurar voces disponibles
    this.initializeVoices();
  }

  private initializeVoices() {
    const setVoices = () => {
      const voices = this.synthesis.getVoices();
      const spanishVoice = voices.find(voice => 
        voice.lang.startsWith('es') && voice.name.includes('Microsoft')
      );
      if (spanishVoice) {
        this.settings.voice = spanishVoice.name;
      }
    };

    if (this.synthesis.getVoices().length > 0) {
      setVoices();
    } else {
      this.synthesis.addEventListener('voiceschanged', setVoices);
    }
  }

  // Crear alerta de pit stop con timing preciso
  createPitAlert(
    distanceToPit: number, // metros
    currentSpeed: number, // km/h
    reason: string,
    urgency: 'prepare' | 'warning' | 'now' | 'critical'
  ): AlertMessage {
    const timeToReach = (distanceToPit / (currentSpeed / 3.6)); // segundos
    
    let message = '';
    let type: AlertMessage['type'] = 'pit_warning';
    let priority: AlertMessage['priority'] = 'medium';

    switch (urgency) {
      case 'prepare':
        message = `Preparar pit stop en ${Math.round(timeToReach)} segundos. Motivo: ${reason}`;
        type = 'pit_warning';
        priority = 'medium';
        break;
      
      case 'warning':
        message = `Atención: Pit stop en ${Math.round(timeToReach)} segundos. ${reason}. Preparar frenada`;
        type = 'pit_warning';
        priority = 'high';
        break;
      
      case 'now':
        message = `¡PIT AHORA! Entrada de pit en ${Math.round(timeToReach)} segundos. ¡FRENA YA!`;
        type = 'pit_now';
        priority = 'critical';
        break;
      
      case 'critical':
        message = `¡EMERGENCIA! Pit inmediato. ${reason}. ¡REDUCE VELOCIDAD!`;
        type = 'pit_now';
        priority = 'critical';
        break;
    }

    return {
      id: `pit_${Date.now()}`,
      type,
      priority,
      message,
      timestamp: Date.now(),
      spoken: false,
      repeatAfter: urgency === 'critical' ? 5 : undefined
    };
  }

  // Crear alertas de componentes críticos
  createComponentAlert(
    component: 'engine' | 'tires' | 'brakes' | 'fuel',
    severity: number, // 0-100
    predictedFailure: number, // vueltas restantes
    currentValue: number
  ): AlertMessage {
    let message = '';
    let type: AlertMessage['type'] = 'critical_temp';
    let priority: AlertMessage['priority'] = 'medium';

    switch (component) {
      case 'engine':
        if (severity > 90) {
          message = `¡PELIGRO! Temperatura motor ${Math.round(currentValue)}°C. Pit inmediato`;
          priority = 'critical';
        } else if (severity > 70) {
          message = `Advertencia: Motor caliente ${Math.round(currentValue)}°C. Reducir potencia`;
          priority = 'high';
        } else {
          message = `Motor: ${Math.round(currentValue)}°C. Monitorear temperatura`;
          priority = 'medium';
        }
        type = 'critical_temp';
        break;

      case 'tires':
        if (severity > 85) {
          message = `¡Neumáticos críticos! ${predictedFailure} vueltas restantes. Pit urgente`;
          priority = 'critical';
        } else if (severity > 65) {
          message = `Neumáticos desgastados. Preparar pit en ${predictedFailure} vueltas`;
          priority = 'high';
        } else {
          message = `Neumáticos: ${Math.round(severity)}% desgaste. ${predictedFailure} vueltas estimadas`;
          priority = 'medium';
        }
        type = 'tire_degradation';
        break;

      case 'fuel':
        if (severity > 90) {
          message = `¡Combustible crítico! ${Math.round(currentValue)}%. Pit inmediato`;
          priority = 'critical';
        } else if (severity > 70) {
          message = `Combustible bajo: ${Math.round(currentValue)}%. Planificar pit stop`;
          priority = 'high';
        } else {
          message = `Combustible: ${Math.round(currentValue)}%. ${predictedFailure} vueltas restantes`;
          priority = 'low';
        }
        type = 'fuel_low';
        break;

      case 'brakes':
        if (severity > 80) {
          message = `¡Frenos desgastados! Reducir agresividad. ${predictedFailure} vueltas máximo`;
          priority = 'high';
        } else {
          message = `Frenos: ${Math.round(severity)}% desgaste. ${predictedFailure} vueltas estimadas`;
          priority = 'medium';
        }
        type = 'critical_temp';
        break;
    }

    return {
      id: `${component}_${Date.now()}`,
      type,
      priority,
      message,
      timestamp: Date.now(),
      spoken: false,
      repeatAfter: priority === 'critical' ? 10 : undefined
    };
  }

  // Crear alertas estratégicas
  createStrategyAlert(message: string, priority: AlertMessage['priority'] = 'medium'): AlertMessage {
    return {
      id: `strategy_${Date.now()}`,
      type: 'strategy',
      priority,
      message,
      timestamp: Date.now(),
      spoken: false
    };
  }

  // Añadir alerta a la cola
  addAlert(alert: AlertMessage) {
    // Evitar duplicados recientes del mismo tipo
    const recentSimilar = this.alertQueue.find(a => 
      a.type === alert.type && 
      Date.now() - a.timestamp < 10000 && // 10 segundos
      !a.spoken
    );

    if (!recentSimilar) {
      this.alertQueue.push(alert);
      this.processQueue();
    }
  }

  // Procesar cola de alertas por prioridad
  private processQueue() {
    if (this.currentAlert || this.alertQueue.length === 0) return;

    // Ordenar por prioridad y timestamp
    this.alertQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });

    const nextAlert = this.alertQueue.shift();
    if (nextAlert && this.canSpeak()) {
      this.speakAlert(nextAlert);
    }
  }

  // Verificar si puede hablar (respetando intervalos mínimos)
  private canSpeak(): boolean {
    return this.isEnabled && 
           this.settings.enabled && 
           Date.now() - this.lastSpokenTime >= this.minTimeBetweenAlerts;
  }

  // Reproducir alerta por voz
  private speakAlert(alert: AlertMessage) {
    if (!this.synthesis || !this.canSpeak()) return;

    this.currentAlert = alert;
    const utterance = new SpeechSynthesisUtterance(alert.message);
    
    // Configurar voz según prioridad
    utterance.rate = alert.priority === 'critical' ? 1.3 : this.settings.rate;
    utterance.pitch = alert.priority === 'critical' ? 1.2 : this.settings.pitch;
    utterance.volume = alert.priority === 'critical' ? 1.0 : this.settings.volume;
    utterance.lang = this.settings.language;

    if (this.settings.voice) {
      const voices = this.synthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.name === this.settings.voice);
      if (selectedVoice) utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      this.currentAlert = null;
      this.lastSpokenTime = Date.now();
      alert.spoken = true;

      // Programar repetición si es necesario
      if (alert.repeatAfter && alert.priority === 'critical') {
        setTimeout(() => {
          if (!alert.spoken || Date.now() - alert.timestamp < alert.repeatAfter! * 1000) {
            const repeatAlert = { ...alert, id: `${alert.id}_repeat`, spoken: false };
            this.addAlert(repeatAlert);
          }
        }, alert.repeatAfter * 1000);
      }

      // Procesar siguiente alerta
      setTimeout(() => this.processQueue(), 500);
    };

    utterance.onerror = () => {
      this.currentAlert = null;
      setTimeout(() => this.processQueue(), 1000);
    };

    this.synthesis.speak(utterance);
  }

  // Detener todas las alertas
  stopAll() {
    this.synthesis.cancel();
    this.currentAlert = null;
    this.alertQueue = [];
  }

  // Configurar ajustes de voz
  updateSettings(newSettings: Partial<VoiceSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  // Habilitar/deshabilitar sistema
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  // Obtener alertas recientes para mostrar en UI
  getRecentAlerts(limit: number = 5): AlertMessage[] {
    return [...this.alertQueue, ...(this.currentAlert ? [this.currentAlert] : [])]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Test de voz
  testVoice() {
    const testAlert: AlertMessage = {
      id: 'test',
      type: 'strategy',
      priority: 'medium',
      message: 'Sistema de alertas de voz funcionando correctamente',
      timestamp: Date.now(),
      spoken: false
    };
    this.addAlert(testAlert);
  }

  // Alertas predefinidas comunes
  static createQuickAlerts() {
    return {
      pitIn3Laps: (reason: string) => ({
        id: 'pit_3laps',
        type: 'pit_warning' as const,
        priority: 'medium' as const,
        message: `Preparar pit stop en 3 vueltas. Motivo: ${reason}`,
        timestamp: Date.now(),
        spoken: false
      }),

      emergencyPit: (reason: string) => ({
        id: 'emergency_pit',
        type: 'pit_now' as const,
        priority: 'critical' as const,
        message: `¡EMERGENCIA! Pit inmediato. ${reason}`,
        timestamp: Date.now(),
        spoken: false,
        repeatAfter: 5
      }),

      goodLap: (lapTime: string) => ({
        id: 'good_lap',
        type: 'strategy' as const,
        priority: 'low' as const,
        message: `Excelente vuelta: ${lapTime}. Mantener ritmo`,
        timestamp: Date.now(),
        spoken: false
      }),

      trafficWarning: () => ({
        id: 'traffic',
        type: 'safety' as const,
        priority: 'high' as const,
        message: 'Tráfico adelante. Preparar adelantamiento o mantener distancia',
        timestamp: Date.now(),
        spoken: false
      })
    };
  }
}

export const audioAlerts = new AudioAlertsSystem();
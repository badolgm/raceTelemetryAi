// Sistema de Alertas Visuales Automáticas - Sin necesidad de hover
import React, { useState, useEffect } from 'react';
import { AlertMessage } from '../services/audioAlerts';
import { RiskAnalysis } from '../services/riskEngine';
import { useI18n } from '../services/i18n';

interface VisualAlertsProps {
  riskAnalysis: RiskAnalysis | null;
  className?: string;
}

interface FloatingAlert {
  id: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  priority: 'critical' | 'high' | 'medium' | 'low';
  component?: string;
  value?: number;
  timestamp: number;
  duration: number;
}

export const VisualAlerts: React.FC<VisualAlertsProps> = ({ riskAnalysis, className = '' }) => {
  const [activeAlerts, setActiveAlerts] = useState<FloatingAlert[]>([]);
  const [pulseAnimation, setPulseAnimation] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [statusCollapsed, setStatusCollapsed] = useState<boolean>(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!riskAnalysis) return;

    const newAlerts: FloatingAlert[] = [];

    if (riskAnalysis.componentStatus.engine.risk > 85) {
      newAlerts.push({
        id: 'engine-critical',
        message: t('visual.engineCritical', { temp: Math.round(riskAnalysis.componentStatus.engine.temp) }),
        type: 'critical',
        priority: 'critical',
        component: 'engine',
        value: riskAnalysis.componentStatus.engine.temp,
        timestamp: Date.now(),
        duration: 10000
      });
    }

    if (riskAnalysis.componentStatus.tires.wear > 80) {
      newAlerts.push({
        id: 'tires-warning',
        message: t('visual.tiresStatus', { wear: Math.round(riskAnalysis.componentStatus.tires.wear) }),
        type: riskAnalysis.componentStatus.tires.wear > 90 ? 'critical' : 'warning',
        priority: riskAnalysis.componentStatus.tires.wear > 90 ? 'critical' : 'high',
        component: 'tires',
        value: riskAnalysis.componentStatus.tires.wear,
        timestamp: Date.now(),
        duration: 8000
      });
    }

    if (riskAnalysis.componentStatus.fuel.level < 12) {
      newAlerts.push({
        id: 'fuel-warning',
        message: t('visual.fuelStatus', { level: Math.round(riskAnalysis.componentStatus.fuel.level) }),
        type: riskAnalysis.componentStatus.fuel.level < 8 ? 'critical' : 'warning',
        priority: riskAnalysis.componentStatus.fuel.level < 8 ? 'critical' : 'high',
        component: 'fuel',
        value: riskAnalysis.componentStatus.fuel.level,
        timestamp: Date.now(),
        duration: 8000
      });
    }

    if (riskAnalysis.componentStatus.brakes.wear > 80) {
      const critical = riskAnalysis.componentStatus.brakes.wear > 90;
      newAlerts.push({
        id: 'brakes-warning',
        message: t('visual.brakesStatus', { wear: Math.round(riskAnalysis.componentStatus.brakes.wear) }),
        type: critical ? 'critical' : 'warning',
        priority: critical ? 'critical' : 'high',
        component: 'brakes',
        value: riskAnalysis.componentStatus.brakes.wear,
        timestamp: Date.now(),
        duration: 8000
      });
    }

    if (riskAnalysis.pitWindow?.recommended &&
        (riskAnalysis.pitWindow.urgency === 'high' || riskAnalysis.pitWindow.urgency === 'critical')) {
      const urgencyType = riskAnalysis.pitWindow.urgency === 'critical' ? 'critical' : 'warning';

      newAlerts.push({
        id: 'pit-window',
        message: t('visual.pitWindow', { reason: riskAnalysis.pitWindow.reason, laps: riskAnalysis.pitWindow.lapsRemaining, lapsWord: t('units.laps') }),
        type: urgencyType,
        priority: riskAnalysis.pitWindow.urgency,
        component: 'pit',
        value: riskAnalysis.pitWindow.lapsRemaining,
        timestamp: Date.now(),
        duration: 12000
      });
    }

    if (riskAnalysis.overallRisk > 70) {
      newAlerts.push({
        id: 'overall-risk',
        message: t('visual.overallRisk', { risk: riskAnalysis.overallRisk }),
        type: riskAnalysis.overallRisk > 85 ? 'critical' : 'warning',
        priority: riskAnalysis.overallRisk > 85 ? 'critical' : 'high',
        component: 'overall',
        value: riskAnalysis.overallRisk,
        timestamp: Date.now(),
        duration: 6000
      });
    }

    setActiveAlerts(prev => {
      // Remover alertas duplicadas y agregar nuevas
      const filtered = prev.filter(alert => 
        !newAlerts.some(newAlert => newAlert.id === alert.id)
      );
      const combined = [...filtered, ...newAlerts];
      // Ordenar por prioridad y limitar a 2 visibles para evitar ruido
      const order = { critical: 3, high: 2, medium: 1, low: 0 } as Record<string, number>;
      combined.sort((a, b) => order[b.priority] - order[a.priority]);
      return combined.slice(0, 2);
    });

    // Configurar animación de pulso para alertas críticas
    const hasCritical = newAlerts.some(alert => alert.type === 'critical');
    setPulseAnimation(hasCritical ? 'animate-pulse' : '');

  }, [riskAnalysis]);

  // Remover alertas expiradas
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAlerts(prev => 
        prev.filter(alert => Date.now() - alert.timestamp < alert.duration)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getAlertStyles = (alert: FloatingAlert) => {
    const baseStyles = "fixed z-40 px-6 py-4 rounded-xl shadow-2xl border-2 transform transition-all duration-500 ease-in-out pointer-events-auto";
    
    switch (alert.type) {
      case 'critical':
        return `${baseStyles} bg-red-900/95 border-red-400 text-red-100 shadow-red-500/50 animate-pulse`;
      case 'warning':
        return `${baseStyles} bg-yellow-900/95 border-yellow-400 text-yellow-100 shadow-yellow-500/50`;
      case 'info':
        return `${baseStyles} bg-blue-900/95 border-blue-400 text-blue-100 shadow-blue-500/50`;
      case 'success':
        return `${baseStyles} bg-green-900/95 border-green-400 text-green-100 shadow-green-500/50`;
      default:
        return `${baseStyles} bg-gray-900/95 border-gray-400 text-gray-100 shadow-gray-500/50`;
    }
  };

  const getAlertPosition = (index: number, alert: FloatingAlert) => {
    const headerOffsetPx = 96; // evita superposición con el header sticky
    if (isMobile) {
      // En móviles, apilar en la parte inferior derecha
      return { bottom: `${16 + index * 80}px`, right: '12px' };
    }
    // Desktop: apilar en parte superior derecha bajo el header
    return { top: `${headerOffsetPx + index * 84}px`, right: '16px' };
  };

  // Escuchar cambios de tamaño para responsividad
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getComponentIcon = (component?: string) => {
    switch (component) {
      case 'engine':
        return '🔥';
      case 'tires':
        return '🏁';
      case 'fuel':
        return '⛽';
      case 'brakes':
        return '🛑';
      case 'pit':
        return '🏎️';
      case 'overall':
        return '⚠️';
      default:
        return '📊';
    }
  };

  return (
    <div className={`visual-alerts-container ${className}`}>
      {/* Alertas flotantes automáticas */}
      {activeAlerts.map((alert, index) => (
        <div
          key={alert.id}
          className={getAlertStyles(alert)}
          style={getAlertPosition(index, alert)}
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getComponentIcon(alert.component)}</span>
            <div className="flex-1">
              <div className="font-bold text-lg">{alert.message}</div>
              {alert.value !== undefined && (
                <div className="text-sm opacity-80">
                  {t('alerts.value')}: {Math.round(alert.value)}
                  {alert.component === 'engine' && '°C'}
                  {(alert.component === 'tires' || alert.component === 'fuel' || alert.component === 'overall') && '%'}
                  {alert.component === 'pit' && ` ${t('units.laps')}`}
                </div>
              )}
            </div>
            {/* Botón para descartar */}
            <button
              className="ml-3 text-white/80 hover:text-white"
              onClick={() => setActiveAlerts(prev => prev.filter(a => a.id !== alert.id))}
              aria-label="Cerrar alerta"
            >✕</button>
          </div>
          
          {/* Barra de progreso para duración */}
          <div className="mt-2 w-full bg-black/30 rounded-full h-1">
            <div 
              className="bg-white/60 h-1 rounded-full transition-all duration-1000"
              style={{
                width: `${Math.max(0, 100 - ((Date.now() - alert.timestamp) / alert.duration) * 100)}%`
              }}
            />
          </div>
        </div>
      ))}

      {/* Panel de estado de componentes siempre visible */}
      {riskAnalysis && (
        <div className="fixed bottom-4 right-4 bg-gray-900/95 border border-gray-600 rounded-xl p-4 shadow-2xl">
          <h3 className="text-white font-bold mb-3 flex items-center">
            <span className="mr-2">📊</span>
            {t('alerts.componentsStatus')}
            <button
              className="ml-3 text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600"
              onClick={() => setStatusCollapsed(s => !s)}
            >{statusCollapsed ? t('alerts.expand') : t('alerts.minimize')}</button>
          </h3>
          
          {!statusCollapsed && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {/* Motor */}
            <div className={`p-2 rounded-lg border ${
              riskAnalysis.componentStatus.engine.risk > 85 ? 'bg-red-900/50 border-red-500' :
              riskAnalysis.componentStatus.engine.risk > 60 ? 'bg-yellow-900/50 border-yellow-500' :
              'bg-green-900/50 border-green-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-white">🔥 {t('comp.engine')}</span>
                <span className={`font-bold ${
                  riskAnalysis.componentStatus.engine.risk > 85 ? 'text-red-300' :
                  riskAnalysis.componentStatus.engine.risk > 60 ? 'text-yellow-300' :
                  'text-green-300'
                }`}>
                  {Math.round(riskAnalysis.componentStatus.engine.temp)}°C
                </span>
              </div>
            </div>

            {/* Neumáticos */}
            <div className={`p-2 rounded-lg border ${
              riskAnalysis.componentStatus.tires.wear > 80 ? 'bg-red-900/50 border-red-500' :
              riskAnalysis.componentStatus.tires.wear > 60 ? 'bg-yellow-900/50 border-yellow-500' :
              'bg-green-900/50 border-green-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-white">🏁 {t('comp.tires')}</span>
                <span className={`font-bold ${
                  riskAnalysis.componentStatus.tires.wear > 80 ? 'text-red-300' :
                  riskAnalysis.componentStatus.tires.wear > 60 ? 'text-yellow-300' :
                  'text-green-300'
                }`}>
                  {Math.round(riskAnalysis.componentStatus.tires.wear)}%
                </span>
              </div>
            </div>

            {/* Combustible */}
            <div className={`p-2 rounded-lg border ${
              riskAnalysis.componentStatus.fuel.level < 20 ? 'bg-red-900/50 border-red-500' :
              riskAnalysis.componentStatus.fuel.level < 40 ? 'bg-yellow-900/50 border-yellow-500' :
              'bg-green-900/50 border-green-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-white">⛽ {t('comp.fuel')}</span>
                <span className={`font-bold ${
                  riskAnalysis.componentStatus.fuel.level < 20 ? 'text-red-300' :
                  riskAnalysis.componentStatus.fuel.level < 40 ? 'text-yellow-300' :
                  'text-green-300'
                }`}>
                  {Math.round(riskAnalysis.componentStatus.fuel.level)}%
                </span>
              </div>
            </div>

            {/* Frenos */}
            <div className={`p-2 rounded-lg border ${
              riskAnalysis.componentStatus.brakes.wear > 75 ? 'bg-red-900/50 border-red-500' :
              riskAnalysis.componentStatus.brakes.wear > 50 ? 'bg-yellow-900/50 border-yellow-500' :
              'bg-green-900/50 border-green-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-white">🛑 {t('comp.brakes')}</span>
                <span className={`font-bold ${
                  riskAnalysis.componentStatus.brakes.wear > 75 ? 'text-red-300' :
                  riskAnalysis.componentStatus.brakes.wear > 50 ? 'text-yellow-300' :
                  'text-green-300'
                }`}>
                  {Math.round(riskAnalysis.componentStatus.brakes.wear)}%
                </span>
              </div>
            </div>
          </div>
          )}

          {/* Indicador de riesgo general */}
          <div className="mt-3 pt-3 border-t border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{t('overall.risk')}:</span>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                riskAnalysis.overallRisk > 80 ? 'bg-red-600 text-white' :
                riskAnalysis.overallRisk > 60 ? 'bg-yellow-600 text-white' :
                riskAnalysis.overallRisk > 40 ? 'bg-blue-600 text-white' :
                'bg-green-600 text-white'
              }`}>
                {riskAnalysis.overallRisk}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de pit window solo crítico al centro; el resto va como alerta compacta */}
      {riskAnalysis?.pitWindow?.recommended && riskAnalysis.pitWindow.urgency === 'critical' && (
        <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          ${riskAnalysis.pitWindow.urgency === 'critical' ? 'bg-red-600' : 
            riskAnalysis.pitWindow.urgency === 'high' ? 'bg-orange-600' : 'bg-blue-600'}
          text-white px-8 py-6 rounded-2xl shadow-2xl border-4 border-white/30 z-50
          ${riskAnalysis.pitWindow.urgency === 'critical' ? 'animate-pulse' : ''}
        `}>
          <div className="text-center">
            <div className="text-4xl mb-2">🏎️</div>
            <div className="text-xl font-bold mb-2">{t('visual.pitRecommendedTitle')}</div>
            <div className="text-lg">{t('visual.pitWindow', { reason: riskAnalysis.pitWindow.reason, laps: riskAnalysis.pitWindow.lapsRemaining, lapsWord: t('units.laps') })}</div>
            <div className="text-sm mt-2 opacity-90">
              {riskAnalysis.pitWindow.lapsRemaining} {t('units.laps')}
            </div>
            {riskAnalysis.pitWindow.timeToDecision && (
              <div className="text-sm mt-1 opacity-90">
                {t('visual.decisionIn', { minutes: Math.round(riskAnalysis.pitWindow.timeToDecision / 60) })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualAlerts;
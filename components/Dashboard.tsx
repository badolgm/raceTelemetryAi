import React, { useEffect } from 'react';
import { LapData, Track, TelemetryDataPoint } from '../types';
import Card from './ui/Card';
import TelemetryGauges from './TelemetryGauges';
import LapDataChart from './LapDataChart';
import AIAssistant from './AIAssistant';
import LoadingSpinner from './ui/LoadingSpinner';
import RiskMap from './RiskMap';
import CircuitViewer from './CircuitViewer';
import { getTrackModelSync } from '../services/modelLoader';
import { computeSectorRisks, computeVisualRiskAnalysis } from '../services/riskEngine';
import { VisualAlerts } from './VisualAlerts';
import { audioAlerts } from '../services/audioAlerts';
import { loadCalibration } from '../services/calibration';
import ErrorBoundary from './ui/ErrorBoundary';
import { useI18n } from '../services/i18n';

interface DashboardProps {
    track: Track;
    lapData: LapData | null;
    currentTelemetry: TelemetryDataPoint | null;
    isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ track, lapData, currentTelemetry, isLoading }) => {
    const { t, voiceLocale } = useI18n();
    // Cargar calibración por pista en segundo plano al cambiar de circuito
    useEffect(() => {
        if (track?.id) {
            loadCalibration(track.id).catch(() => {});
        }
    }, [track?.id]);

    // Precomputar riesgos para que los hooks no cambien de orden entre renders
    const sectorRisks = lapData ? computeSectorRisks(lapData, track) : [];
    const riskAnalysis = lapData ? computeVisualRiskAnalysis({
        ...lapData,
        telemetry: currentTelemetry ? [...lapData.telemetry.slice(0, -1), currentTelemetry] : lapData.telemetry
    }, track) : null;

    // Emitir alertas de voz basadas en el análisis de riesgo (hook siempre presente)
    useEffect(() => {
        if (!riskAnalysis || !currentTelemetry) return;

        // Pit window
        if (riskAnalysis.pitWindow?.recommended) {
            const distanceToPit = Math.max(0, track.lapDistance - (currentTelemetry.Laptrigger_lapdist_dls || 0));
            const speed = currentTelemetry.Speed || 0;
            const urgency = riskAnalysis.pitWindow.urgency === 'critical' ? 'critical'
                : riskAnalysis.pitWindow.urgency === 'high' ? 'now'
                : 'warning';
            const pitAlert = audioAlerts.createPitAlert(distanceToPit, speed, riskAnalysis.pitWindow.reason, urgency);
            audioAlerts.addAlert(pitAlert);
        }

        // Componentes
        const engine = riskAnalysis.componentStatus.engine;
        if (engine.risk > 85) {
            audioAlerts.addAlert(
                audioAlerts.createComponentAlert('engine', engine.risk, riskAnalysis.pitWindow?.lapsRemaining ?? 0, engine.temp)
            );
        }

        const tires = riskAnalysis.componentStatus.tires;
        if (tires.wear > 80) {
            audioAlerts.addAlert(
                audioAlerts.createComponentAlert('tires', tires.wear, riskAnalysis.pitWindow?.lapsRemaining ?? 0, tires.wear)
            );
        }

        const fuel = riskAnalysis.componentStatus.fuel;
        if (fuel.level < 12) {
            audioAlerts.addAlert(
                audioAlerts.createComponentAlert('fuel', 100 - fuel.level, riskAnalysis.pitWindow?.lapsRemaining ?? 0, fuel.level)
            );
        }

        const brakes = riskAnalysis.componentStatus.brakes;
        if (brakes.wear > 80) {
            audioAlerts.addAlert(
                audioAlerts.createComponentAlert('brakes', brakes.wear, riskAnalysis.pitWindow?.lapsRemaining ?? 0, brakes.wear)
            );
        }
    }, [riskAnalysis, currentTelemetry, track.lapDistance]);

    // Sincronizar idioma de voz con el contexto i18n incluso tras recargas/HMR
    useEffect(() => {
        audioAlerts.updateSettings({ language: voiceLocale });
    }, [voiceLocale]);

    if (isLoading) {
        return (
            <div className="flex-grow flex items-center justify-center p-4">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-2 text-gray-300">{t('dashboard.loading', { track: track.name })}</p>
                </div>
            </div>
        )
    }
    
    if (!lapData) {
         return (
            <div className="flex-grow flex items-center justify-center p-4">
                <p className="text-red-400">{t('dashboard.noData', { track: track.name })}</p>
            </div>
        )
    }

    return (
        <main className="flex-grow p-4 md:p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h2 className="text-xl font-bold text-white mb-2">{track.name}</h2>
                        <CircuitViewer
                          track={track}
                          progress={(currentTelemetry?.Laptrigger_lapdist_dls ?? 0) / Math.max(1, (getTrackModelSync(track.id).lapDistance_m ?? track.lapDistance))}
                        />
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('dashboard.liveTelemetry')}</h3>
                        <TelemetryGauges 
                            speed={currentTelemetry?.Speed ?? 0}
                            rpm={currentTelemetry?.rpm ?? 0}
                            gear={currentTelemetry?.Gear ?? 0}
                        />
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <ErrorBoundary>
                      <RiskMap track={track} sectorRisks={sectorRisks} />
                    </ErrorBoundary>
                    <ErrorBoundary>
                      <LapDataChart lapData={lapData} />
                    </ErrorBoundary>
                    <AIAssistant lapData={lapData} track={track} />
                </div>
                {/* Alertas visuales flotantes */}
                <ErrorBoundary>
                  <VisualAlerts riskAnalysis={riskAnalysis} />
                </ErrorBoundary>
            </div>
        </main>
    );
};

export default Dashboard;
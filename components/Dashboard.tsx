import React, { useState, useEffect } from 'react';
import { LapData, Track, TelemetryDataPoint } from '../types';
import Card from './ui/Card';
import TelemetryGauges from './TelemetryGauges';
import LapDataChart from './LapDataChart';
import AIAssistant from './AIAssistant';
import LoadingSpinner from './ui/LoadingSpinner';
import RiskMap from './RiskMap';
import CircuitViewer from './CircuitViewer';
import { computeSectorRisks, computeVisualRiskAnalysis } from '../services/riskEngine';
import { VisualAlerts } from './VisualAlerts';

interface DashboardProps {
    track: Track;
    lapData: LapData | null;
    isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ track, lapData, isLoading }) => {
    const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryDataPoint | null>(null);

    useEffect(() => {
        let animationFrameId: number;
        if (lapData && lapData.telemetry.length > 0) {
            let index = 0;
            const animate = () => {
                setCurrentTelemetry(lapData.telemetry[index]);
                index = (index + 1) % lapData.telemetry.length;
                animationFrameId = requestAnimationFrame(animate);
            };
            animate();
        } else {
            setCurrentTelemetry(null);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [lapData]);

    if (isLoading) {
        return (
            <div className="flex-grow flex items-center justify-center p-4">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-2 text-gray-300">Loading Telemetry Data for {track.name}...</p>
                </div>
            </div>
        )
    }
    
    if (!lapData) {
         return (
            <div className="flex-grow flex items-center justify-center p-4">
                <p className="text-red-400">No telemetry data available for {track.name}.</p>
            </div>
        )
    }

    const sectorRisks = lapData ? computeSectorRisks(lapData, track) : [];
    const riskAnalysis = lapData ? computeVisualRiskAnalysis(lapData, track) : null;

    return (
        <main className="flex-grow p-4 md:p-6 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <h2 className="text-xl font-bold text-white mb-2">{track.name}</h2>
                        <CircuitViewer
                          track={track}
                          progress={(currentTelemetry?.Laptrigger_lapdist_dls ?? 0) / Math.max(1, track.lapDistance)}
                        />
                    </Card>
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Live Telemetry</h3>
                        <TelemetryGauges 
                            speed={currentTelemetry?.Speed ?? 0}
                            rpm={currentTelemetry?.rpm ?? 0}
                            gear={currentTelemetry?.Gear ?? 0}
                        />
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <RiskMap track={track} sectorRisks={sectorRisks} />
                    <LapDataChart lapData={lapData} />
                    <AIAssistant lapData={lapData} track={track} />
                </div>
                {/* Alertas visuales flotantes */}
                <VisualAlerts riskAnalysis={riskAnalysis} />
            </div>
        </main>
    );
};

export default Dashboard;
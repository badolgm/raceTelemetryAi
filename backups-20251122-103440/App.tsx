import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { Track, LapData, TelemetryDataPoint } from './types';
import { TRACKS } from './constants';
import { SimulatedAdapter, WebSocketAdapter, ConnectionStatus, CsvFileAdapter, TelemetryAdapter } from './services/telemetryAdapter';
import { loadTrackModel } from './services/modelLoader';
import { loadCalibration } from './services/calibration';

// Helper to generate mock telemetry data for the hackathon
const generateMockLapData = (track: Track): LapData => {
  const points = 500;
  const telemetry: TelemetryDataPoint[] = [];
  
  for (let i = 0; i < points; i++) {
    const distance = (i / points) * track.lapDistance;
    
    // Simulate corners and straights with sine waves
    const speedFactor = (Math.sin(distance / (track.lapDistance / 10)) + 1.5) / 2.5;
    const speed = 80 + speedFactor * 180;
    
    let gear = Math.min(6, Math.max(1, Math.round(speed / 40)));
    
    const rpm = speed > 50 ? 2500 + (speed % 40) * 150 : 1200;
    const throttle = (Math.sin(distance / (track.lapDistance / 15)) + 1) / 2 * 100;
    const brake = throttle < 20 && speed > 100 ? 50 * (1-speedFactor) : 0;
    const steering = Math.sin(distance / (track.lapDistance / 25)) * 45;

    telemetry.push({
      Laptrigger_lapdist_dls: distance,
      Speed: speed,
      rpm: rpm,
      Gear: gear,
      at: throttle,
      pbrake_f: brake,
      SteeringAngle: steering
    });
  }

  return {
    lapNumber: 3,
    lapTime: `1:${Math.floor(40 + Math.random() * 10)}.${Math.floor(100 + Math.random() * 899)}`,
    telemetry,
  };
};

const App: React.FC = () => {
  const [selectedTrack, setSelectedTrack] = useState<Track>(TRACKS[0]);
  const [lapData, setLapData] = useState<LapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryDataPoint | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [adapter, setAdapter] = useState<TelemetryAdapter | null>(null);
  const [dataSource, setDataSource] = useState<'demo' | 'ws' | 'csv'>('demo');
  const [progressOverride, setProgressOverride] = useState<number | undefined>(undefined);
  const csvIndexRef = useRef(0);
  const csvTotalRef = useRef(0);

  const loadTelemetryData = useCallback((track: Track) => {
    setIsLoading(true);
    // Simulate network delay
    setTimeout(() => {
        const mockData = generateMockLapData(track);
        setLapData(mockData);
        setIsLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    loadTelemetryData(selectedTrack);
    // Precargar modelo y calibración del circuito seleccionado
    loadTrackModel(selectedTrack.id).catch(() => {});
    loadCalibration(selectedTrack.id).catch(() => {});
  }, [selectedTrack, loadTelemetryData]);

  // Iniciar adapter según fuente seleccionada
  useEffect(() => {
    // Detener adapter previo
    adapter?.stop();

    if (dataSource === 'demo') {
      if (!lapData) return; // requiere mock ya generado
      const sim = new SimulatedAdapter(selectedTrack, lapData, 60);
      sim.onStatus(setConnectionStatus);
      sim.onFrame((frame) => {
        setCurrentTelemetry(frame);
        setProgressOverride(undefined);
      });
      sim.onLapData?.((lap) => setLapData(lap));
      sim.start();
      setAdapter(sim);
    } else if (dataSource === 'csv') {
      const csv = new CsvFileAdapter({
        csvUrl: '/DataFiles/barber/R1_barber_telemetry_data.csv',
        mappingUrl: '/DataFiles/barber/mapping.json',
        track: selectedTrack,
        intervalMs: 60,
      });
      csv.onStatus(setConnectionStatus);
      csv.onFrame((frame) => {
        setCurrentTelemetry(frame);
        const total = Math.max(1, csvTotalRef.current);
        csvIndexRef.current = (csvIndexRef.current + 1) % total;
        setProgressOverride(total > 0 ? csvIndexRef.current / total : undefined);
      });
      csv.onLapData((lap) => {
        setLapData(lap);
        csvTotalRef.current = lap.telemetry.length;
        csvIndexRef.current = 0;
        setProgressOverride(0);
      });
      csv.start();
      setAdapter(csv);
    } else {
      const ws = new WebSocketAdapter(undefined, lapData || undefined); // endpoint mock: undefined usa modo simulado
      ws.onStatus(setConnectionStatus);
      ws.onFrame((frame) => {
        setCurrentTelemetry(frame);
        setProgressOverride(undefined);
      });
      ws.onLapData?.((lap) => setLapData(lap));
      ws.start();
      setAdapter(ws);
    }

    return () => { adapter?.stop(); };
  }, [dataSource, selectedTrack, lapData]);

  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100 font-sans">
      <Header connectionStatus={connectionStatus} dataSource={dataSource} onChangeDataSource={setDataSource} />
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
        <Sidebar selectedTrack={selectedTrack} onSelectTrack={handleSelectTrack} />
        <Dashboard track={selectedTrack} lapData={lapData} currentTelemetry={currentTelemetry} isLoading={isLoading} progressOverride={progressOverride} />
      </div>
    </div>
  );
};

export default App;
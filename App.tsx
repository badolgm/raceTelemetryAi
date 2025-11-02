import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import { Track, LapData, TelemetryDataPoint } from './types';
import { TRACKS } from './constants';

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
  }, [selectedTrack, loadTelemetryData]);

  const handleSelectTrack = (track: Track) => {
    setSelectedTrack(track);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100 font-sans">
      <Header />
      <div className="flex flex-col md:flex-row flex-grow overflow-hidden">
        <Sidebar selectedTrack={selectedTrack} onSelectTrack={handleSelectTrack} />
        <Dashboard track={selectedTrack} lapData={lapData} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default App;
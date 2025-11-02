import React from 'react';
import { Track } from '../types';

interface CircuitViewerProps {
  track: Track;
  progress: number; // 0..1 based on lap distance
  className?: string;
}

// Paths aproximados para animar el coche usando motion-path CSS
const PATHS: Record<string, string> = {
  barber: 'M 10 50 C 35 10, 65 10, 90 50 C 65 90, 35 90, 10 50 Z',
  cota: 'M 8 50 C 25 15, 75 15, 92 50 C 75 85, 25 85, 8 50 Z',
  indy: 'M 12 20 L 88 20 L 88 80 L 12 80 Z',
  road_america: 'M 10 50 C 30 20, 70 20, 90 50 C 70 80, 30 80, 10 50 Z',
  sebring: 'M 15 30 C 30 10, 80 10, 85 40 C 80 80, 30 90, 15 70 Z',
  sonoma: 'M 15 50 C 40 15, 80 15, 85 50 C 80 85, 40 85, 15 50 Z',
  vir: 'M 12 50 C 35 12, 75 12, 90 50 C 75 88, 35 88, 12 50 Z'
};

const CircuitViewer: React.FC<CircuitViewerProps> = ({ track, progress, className = '' }) => {
  const path = PATHS[track.id] || PATHS['barber'];
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <div className={`relative w-full h-[300px] rounded-lg overflow-hidden border border-gray-700 ${className}`}>
      {/* Mapa PDF o imagen con fallback */}
      {track.mapUrl?.toLowerCase().endsWith('.pdf') ? (
        <object data={track.mapUrl} type="application/pdf" className="absolute inset-0 w-full h-full">
          <div className="flex items-center justify-center h-full bg-gray-900 text-gray-200 p-4">
            <div className="text-center">
              <p className="mb-2">No se pudo renderizar el mapa PDF en este navegador.</p>
              <a href={track.mapUrl} target="_blank" rel="noreferrer" className="inline-block px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-500">
                Abrir mapa en nueva pestaña
              </a>
            </div>
          </div>
        </object>
      ) : (
        <img src={track.mapUrl} alt={`${track.name} map`} className="absolute inset-0 w-full h-full object-contain bg-black" />
      )}

      {/* Overlay semitransparente para contraste */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Trayectoria y coche usando motion-path */}
      <div
        className="absolute left-0 top-0 w-full h-full"
        style={{
          // Dibujamos la trayectoria como referencia
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(0,255,180,0.15) 2px, transparent 3px)`,
        }}
      />

      {/* Coche */}
      <div
        title="Vehículo"
        className="absolute w-4 h-4 rounded-full bg-teal-300 shadow-[0_0_10px_4px_rgba(0,255,200,0.8)]"
        style={{
          offsetPath: `path('${path}')`,
          offsetDistance: `${clamped * 100}%`,
          transform: 'translate(-8px, -8px)',
        }}
      />

      {/* Barra de progreso/lap */}
      <div className="absolute bottom-2 left-2 right-2 bg-gray-800/80 border border-gray-700 rounded-md h-3">
        <div className="h-full bg-teal-500" style={{ width: `${clamped * 100}%` }} />
      </div>
    </div>
  );
};

export default CircuitViewer;
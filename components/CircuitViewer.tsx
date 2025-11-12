import React, { useEffect, useRef, useState } from 'react';
import { Track } from '../types';
import { getCalibrationSync } from '../services/calibration';

interface CircuitViewerProps {
  track: Track;
  progress: number; // 0..1 based on lap distance
  className?: string;
}

// Paths aproximados (coordenadas 0..100) para el centro de la pista
const PATHS: Record<string, string> = {
  barber: 'M 12 54 C 28 18, 72 18, 88 54 C 70 90, 30 90, 12 54 Z',
  cota: 'M 10 52 C 28 18, 72 18, 90 52 C 72 86, 28 86, 10 52 Z',
  indy: 'M 20 25 L 80 25 L 80 75 L 20 75 Z',
  road_america: 'M 12 52 C 32 22, 68 22, 88 52 C 68 82, 32 82, 12 52 Z',
  sebring: 'M 18 34 C 34 16, 78 14, 86 42 C 78 84, 36 90, 18 70 Z',
  sonoma: 'M 16 52 C 42 18, 78 18, 86 52 C 78 86, 42 86, 16 52 Z',
  vir: 'M 14 52 C 36 16, 74 16, 90 52 C 74 88, 36 88, 14 52 Z'
};

const CircuitViewer: React.FC<CircuitViewerProps> = ({ track, progress, className = '' }) => {
  const [pathD, setPathD] = useState<string>(PATHS[track.id] || PATHS['barber']);
  const clamped = Math.max(0, Math.min(1, progress));

  const cal = getCalibrationSync(track.id);
  const t = cal.mapTransform || { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0, rotate: 0 };

  // Referencia al path SVG para calcular posición precisa
  const pathRef = useRef<SVGPathElement | null>(null);
  const [marker, setMarker] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Intentar cargar un path exacto desde configuración si existe
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/DataFiles/config/trackPaths.json');
        if (!res.ok) return;
        const json = await res.json();
        const custom = json[track.id];
        if (custom && typeof custom === 'string' && !cancelled) setPathD(custom);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [track.id]);

  useEffect(() => {
    const p = pathRef.current;
    if (!p) return;
    const len = p.getTotalLength();
    const pt = p.getPointAtLength(len * clamped);
    setMarker({ x: pt.x, y: pt.y });
  }, [clamped, track.id]);

  return (
    <div className={`relative w-full h-[300px] rounded-lg overflow-hidden border border-gray-700 bg-black ${className}`}>
      {/* Solo línea SVG y cursor sobre fondo oscuro */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <g
          transform={`translate(${t.offsetX} ${t.offsetY}) rotate(${t.rotate} 50 50) scale(${t.scaleX} ${t.scaleY})`}
        >
          <path ref={pathRef} d={pathD} fill="none" stroke="rgba(0,255,200,0.35)" strokeWidth={1.2} />
          <circle
            cx={marker.x}
            cy={marker.y}
            r={2.4}
            fill="#5eead4"
            className="drop-shadow-[0_0_6px_rgba(0,255,200,0.9)]"
          />
        </g>
      </svg>

      {/* Barra de progreso/lap */}
      <div className="absolute bottom-2 left-2 right-2 bg-gray-800/80 border border-gray-700 rounded-md h-3">
        <div className="h-full bg-teal-500" style={{ width: `${clamped * 100}%` }} />
      </div>
    </div>
  );
};

export default CircuitViewer;
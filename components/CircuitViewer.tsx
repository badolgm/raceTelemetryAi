import React, { useEffect, useRef, useState } from 'react';
import { Track } from '../types';
import { getCalibrationSync } from '../services/calibration';
import { loadTrackModel, getTrackModelSync } from '../services/modelLoader';

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

// Barra de sectores y marcadores de pit basada en configuración
const SectorBar: React.FC<{ track: Track; progress: number }> = ({ track, progress }) => {
  const model = getTrackModelSync(track.id);
  const lapLen = model.lapDistance_m ?? track.lapDistance;
  const segments = Array.isArray(model.sectors) && model.sectors.length > 0
    ? model.sectors.map(s => Math.max(0, s.length_m))
    : Array.from({ length: model.sectorCount ?? 12 }, () => lapLen / (model.sectorCount ?? 12));
  const total = segments.reduce((a, b) => a + b, 0) || lapLen;
  let accum = 0;
  const splits = segments.map(len => {
    const startPct = accum / total;
    accum += len;
    const endPct = accum / total;
    return { startPct, endPct };
  });
  const pitEntryPct = model.pit?.entry_m != null && typeof model.pit.entry_m === 'number'
    ? Math.max(0, Math.min(1, (model.pit.entry_m as number) / total))
    : null;
  const pitExitPct = model.pit?.exit_m != null && typeof model.pit.exit_m === 'number'
    ? Math.max(0, Math.min(1, (model.pit.exit_m as number) / total))
    : null;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className="mt-1 w-full">
      <div className="relative w-full h-2 bg-gray-800/80 border border-gray-700 rounded">
        {splits.map((sp, i) => (
          <div key={i} className="absolute top-0 h-full" style={{ left: `${sp.startPct * 100}%`, width: `${(sp.endPct - sp.startPct) * 100}%`, background: i % 2 === 0 ? '#374151' : '#4b5563' }} />
        ))}
        <div className="absolute top-[-3px] w-[2px] h-[12px] bg-yellow-400" style={{ left: `${clamped * 100}%` }} />
        {pitEntryPct != null && (
          <div title="Pit Entry" className="absolute top-[-4px] w-[2px] h-[14px] bg-red-500" style={{ left: `${pitEntryPct * 100}%` }} />
        )}
        {pitExitPct != null && (
          <div title="Pit Exit" className="absolute top-[-4px] w-[2px] h-[14px] bg-green-500" style={{ left: `${pitExitPct * 100}%` }} />
        )}
      </div>
      <div className="text-[10px] text-gray-300 mt-1">Sectores y pit markers</div>
    </div>
  );
};

const CircuitViewer: React.FC<CircuitViewerProps> = ({ track, progress, className = '' }) => {
  const [pathD, setPathD] = useState<string>(PATHS[track.id] || PATHS['barber']);
  const [viewBox, setViewBox] = useState<[number, number, number, number]>([0, 0, 100, 100]);
  const [markerRadius, setMarkerRadius] = useState<number>(2.4);
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
        await loadTrackModel(track.id);
        const res = await fetch('/DataFiles/config/trackPaths.json');
        if (!res.ok) return;
        const json = await res.json();
        const custom = json[track.id];
        if (!cancelled && custom) {
          if (typeof custom === 'string') {
            setPathD(custom);
          } else if (typeof custom === 'object') {
            if (custom.d) setPathD(custom.d);
            if (custom.viewBox && Array.isArray(custom.viewBox) && custom.viewBox.length === 4) {
              const parts = custom.viewBox.map(Number);
              if (parts.every(n => !Number.isNaN(n))) {
                setViewBox([parts[0], parts[1], parts[2], parts[3]]);
                const size = Math.min(parts[2], parts[3]);
                setMarkerRadius(Math.max(2.4, size / 150));
              }
            }
          }
        }
      } catch {}

      // Fallback: si es Barber, cargar SVG real desde /out
      try {
        if (track.id === 'barber') {
          const svgRes = await fetch('/out/Barber_Circuit_Map_Final.svg');
          if (svgRes.ok) {
            const text = await svgRes.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'image/svg+xml');
            const svgEl = doc.querySelector('svg');
            const pathEl = doc.querySelector('path');
            if (svgEl && pathEl) {
              const vb = svgEl.getAttribute('viewBox');
              if (vb) {
                const parts = vb.split(/\s+/).map(Number);
                if (parts.length === 4 && parts.every(n => !Number.isNaN(n))) {
                  setViewBox([parts[0], parts[1], parts[2], parts[3]]);
                  const size = Math.min(parts[2], parts[3]);
                  setMarkerRadius(Math.max(2.4, size / 150));
                }
              } else {
                const w = Number(svgEl.getAttribute('width')) || 100;
                const h = Number(svgEl.getAttribute('height')) || 100;
                setViewBox([0, 0, w, h]);
                const size = Math.min(w, h);
                setMarkerRadius(Math.max(2.4, size / 150));
              }
              const d = pathEl.getAttribute('d');
              if (d && !cancelled) setPathD(d);
            }
          }
        }
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
      <svg viewBox={`${viewBox[0]} ${viewBox[1]} ${viewBox[2]} ${viewBox[3]}`} className="absolute inset-0 w-full h-full">
        <g
          transform={`translate(${t.offsetX} ${t.offsetY}) rotate(${t.rotate} 50 50) scale(${t.scaleX} ${t.scaleY})`}
        >
          <path ref={pathRef} d={pathD} fill="none" stroke="rgba(0,255,200,0.35)" strokeWidth={1.2} />
          <circle
            cx={marker.x}
            cy={marker.y}
            r={markerRadius}
            fill="#5eead4"
            className="drop-shadow-[0_0_6px_rgba(0,255,200,0.9)]"
          />
        </g>
      </svg>

      {/* Barra de progreso/lap */}
      <div className="absolute bottom-2 left-2 right-2 bg-gray-800/80 border border-gray-700 rounded-md h-3">
        <div className="h-full bg-teal-500" style={{ width: `${clamped * 100}%` }} />
      </div>
      {/* Barra de sectores y pit */}
      <div className="absolute bottom-8 left-2 right-2">
        <SectorBar track={track} progress={clamped} />
      </div>
    </div>
  );
};

export default CircuitViewer;
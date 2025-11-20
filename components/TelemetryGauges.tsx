
import React from 'react';
import { useI18n } from '../services/i18n';

interface TelemetryGaugesProps {
  speed: number;
  rpm: number;
  gear: number;
}

const Gauge: React.FC<{ value: number; maxValue: number; label: string; unit: string; color: string }> = ({ value, maxValue, label, unit, color }) => {
  const percentage = Math.min(Math.max(value / maxValue, 0), 1);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <div className="relative flex flex-col items-center justify-center w-32 h-32 md:w-40 md:h-40">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke="#374151" strokeWidth="10" fill="transparent" />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={color}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.2s ease-out' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl md:text-3xl font-bold text-white">{Math.round(value)}</span>
        <span className="text-xs text-gray-400">{unit}</span>
        <span className="text-sm font-semibold text-gray-300 mt-1">{label}</span>
      </div>
    </div>
  );
};


const TelemetryGauges: React.FC<TelemetryGaugesProps> = ({ speed, rpm, gear }) => {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 py-4">
      <Gauge value={speed} maxValue={300} label={t('gauges.speed')} unit={t('units.kmh')} color="#22d3ee" />
      <Gauge value={rpm} maxValue={9000} label={t('gauges.rpm')} unit={t('units.rpm')} color="#f43f5e" />
      <div className="flex flex-col items-center justify-center w-32 h-32 md:w-40 md:h-40 bg-gray-800/50 border border-gray-700 rounded-full">
        <span className="text-6xl font-black text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {gear > 0 ? gear : 'N'}
        </span>
        <span className="text-sm font-semibold text-gray-300 mt-1">{t('gauges.gear')}</span>
      </div>
    </div>
  );
};

export default TelemetryGauges;
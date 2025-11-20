import React from 'react';
import Card from './ui/Card';
import { Track } from '../types';
import { SectorRisk } from '../services/riskEngine';
import { useI18n } from '../services/i18n';

interface RiskMapProps {
  track: Track;
  sectorRisks: SectorRisk[];
}

const riskColor = (v: number) => {
  // 0 -> green, 1 -> red
  const r = Math.round(255 * v);
  const g = Math.round(255 * (1 - v));
  return `rgb(${r},${g},80)`;
};

const RiskMap: React.FC<RiskMapProps> = ({ track, sectorRisks }) => {
  const { t } = useI18n();
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{t('riskMap.title', { track: track.name })}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {track.mapUrl.toLowerCase().endsWith('.pdf') ? (
          <object data={track.mapUrl} type="application/pdf" className="w-full h-[260px] rounded-md border border-gray-700">
            <div className="flex items-center justify-center h-full bg-gray-900 text-gray-200 p-4 rounded-md">
              <div className="text-center">
                <p className="mb-2">{t('riskMap.pdfError')}</p>
                <a href={track.mapUrl} target="_blank" rel="noreferrer" className="inline-block px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-500">{t('riskMap.openPdf')}</a>
              </div>
            </div>
          </object>
        ) : (
          <img src={track.mapUrl} alt={`${track.name} map`} className="w-full h-auto rounded-md border border-gray-700" />
        )}
        <div>
          <p className="text-sm text-gray-400 mb-2">{t('riskMap.sectorRiskInfo')}</p>
          <div className="flex w-full h-10 rounded-md overflow-hidden border border-gray-700">
            {sectorRisks.map((s) => (
              <div
                key={s.sector}
                title={t('riskMap.tooltip', {
                  sector: s.sector,
                  tires: t('comp.tires'),
                  tire: (s.tireRisk*100).toFixed(0),
                  engine: (s.engineRisk*100).toFixed(0),
                  brakes: t('comp.brakes'),
                  brake: (s.brakeRisk*100).toFixed(0)
                })}
                style={{ backgroundColor: riskColor(s.overall), width: `${100 / Math.max(1, sectorRisks.length)}%` }}
                className="transition-opacity hover:opacity-80"
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{t('riskMap.start')}</span>
            <span>{t('riskMap.finish')}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RiskMap;
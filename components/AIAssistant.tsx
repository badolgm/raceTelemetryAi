import React, { useState, useCallback } from 'react';
import { LapData, Track, AIAnalysis } from '../types';
import { computeRiskAnalysis } from '../services/riskEngine';
import Card from './ui/Card';
import LoadingSpinner from './ui/LoadingSpinner';
import { ICONS } from '../constants';
import { useI18n } from '../services/i18n';
import { analyzeLapData, hasGeminiKey } from '../services/geminiService';
import { getRiskModelSync, getTrackModelSync } from '../services/modelLoader';

interface AIAssistantProps {
  lapData: LapData | null;
  track: Track;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ lapData, track }) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [source, setSource] = useState<'gemini' | 'heuristic' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const rm = getRiskModelSync(track.id);
  const tm = getTrackModelSync(track.id);

  const handleAnalysis = useCallback(async () => {
    if (!lapData) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const hasKey = hasGeminiKey();
      const result = hasKey
        ? await analyzeLapData(lapData, track)
        : (computeRiskAnalysis(lapData, track) as AIAnalysis);
      setSource(hasKey ? 'gemini' : 'heuristic');
      setAnalysis(result as AIAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('assistant.errorUnknown'));
    } finally {
      setIsLoading(false);
    }
  }, [lapData, track]);

  return (
    <Card>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
            <span className="mr-2 text-cyan-400">{ICONS.brain}</span>
            {t('assistant.title')}
        </h3>
        <button
            onClick={handleAnalysis}
            disabled={isLoading || !lapData}
            className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-600 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
        >
            {isLoading ? t('assistant.analyzing') : t('assistant.analyze')}
        </button>
      </div>
      {source && (
        <div className="mb-3 text-xs">
          <span className={`inline-block px-2 py-1 rounded ${source === 'gemini' ? 'bg-purple-600 text-white' : 'bg-teal-600 text-white'}`}
          >{source === 'gemini' ? t('assistant.sourceGemini') : t('assistant.sourceHeuristic')}</span>
        </div>
      )}

      <div className="mb-3 text-xs text-gray-300">
        <div className="opacity-90">{t('assistant.modelInfo')} {track.name}</div>
        <div className="opacity-90">{t('assistant.weights')}: {(rm.weights?.tire ?? 0.45).toFixed(2)} / {(rm.weights?.engine ?? 0.30).toFixed(2)} / {(rm.weights?.brake ?? 0.25).toFixed(2)}</div>
        <div className="opacity-90">{t('assistant.thresholds')}: EH {(rm.thresholds?.engineHigh ?? 105)}, EC {(rm.thresholds?.engineCritical ?? 110)}, TW {(rm.thresholds?.tireWearHigh ?? 0.9)}, F {(rm.thresholds?.fuelHighPct ?? 0.12)}</div>
      </div>

      <div className="mt-4 min-h-[200px]">
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-red-400 text-center">{error}</p>}
        {analysis ? (
          <div className="space-y-4 text-gray-300">
            <div>
              <h4 className="font-semibold text-cyan-400">{t('assistant.overallSummary')}</h4>
              <p className="text-sm">{analysis.overallSummary}</p>
            </div>
            {'pitWindow' in (analysis as any) && (
              <div>
                <h4 className="font-semibold text-cyan-400">{t('assistant.pitWindow')}</h4>
                <p className="text-sm">{(analysis as any).pitWindow}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-cyan-400">{t('assistant.areasForImprovement')}</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {analysis.areasForImprovement.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-cyan-400">{t('assistant.detailedRecommendations')}</h4>
              <ul className="space-y-2 text-sm">
                {analysis.detailedRecommendations.map((item, index) => (
                  <li key={index} className="p-2 bg-gray-700/50 rounded-md">
                    <strong className="text-gray-100">{item.location}:</strong> {item.advice}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
            !isLoading && <p className="text-gray-400 text-center pt-10">{t('assistant.emptyPrompt')}</p>
        )}
      </div>
    </Card>
  );
};

export default AIAssistant;
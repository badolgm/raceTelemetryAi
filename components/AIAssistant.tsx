import React, { useState, useCallback } from 'react';
import { LapData, Track, AIAnalysis } from '../types';
import { computeRiskAnalysis } from '../services/riskEngine';
import Card from './ui/Card';
import LoadingSpinner from './ui/LoadingSpinner';
import { ICONS } from '../constants';

interface AIAssistantProps {
  lapData: LapData | null;
  track: Track;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ lapData, track }) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = useCallback(() => {
    if (!lapData) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = computeRiskAnalysis(lapData, track);
      setAnalysis(result as AIAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error desconocido.');
    } finally {
      setIsLoading(false);
    }
  }, [lapData, track]);

  return (
    <Card>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center">
            <span className="mr-2 text-cyan-400">{ICONS.brain}</span>
            Predictive Risk Coach
        </h3>
        <button
            onClick={handleAnalysis}
            disabled={isLoading || !lapData}
            className="bg-cyan-500 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-600 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
        >
            {isLoading ? 'Analyzing...' : 'Analyze Lap'}
        </button>
      </div>

      <div className="mt-4 min-h-[200px]">
        {isLoading && <LoadingSpinner />}
        {error && <p className="text-red-400 text-center">{error}</p>}
        {analysis ? (
          <div className="space-y-4 text-gray-300">
            <div>
              <h4 className="font-semibold text-cyan-400">Overall Summary</h4>
              <p className="text-sm">{analysis.overallSummary}</p>
            </div>
            {'pitWindow' in (analysis as any) && (
              <div>
                <h4 className="font-semibold text-cyan-400">Pit Window</h4>
                <p className="text-sm">{(analysis as any).pitWindow}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-cyan-400">Areas for Improvement</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {analysis.areasForImprovement.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-cyan-400">Detailed Recommendations</h4>
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
            !isLoading && <p className="text-gray-400 text-center pt-10">Click "Analyze Lap" to get AI-powered feedback.</p>
        )}
      </div>
    </Card>
  );
};

export default AIAssistant;
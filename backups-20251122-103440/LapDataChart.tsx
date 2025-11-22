import React from 'react';
import { LapData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from './ui/Card';
import { useI18n } from '../services/i18n';

interface LapDataChartProps {
  lapData: LapData;
}

const LapDataChart: React.FC<LapDataChartProps> = ({ lapData }) => {
  const { t } = useI18n();
  return (
    <Card className="h-96">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">{t('chart.lapTelemetry')}</h3>
        <ResponsiveContainer width="100%" height="100%">
        <LineChart
            data={lapData.telemetry}
            margin={{ top: 10, right: 20, left: 10, bottom: 48 }}
        >
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis 
                dataKey="Laptrigger_lapdist_dls" 
                label={{ value: t('units.distance_m'), position: 'bottom', offset: 0, fill: '#a0aec0' }}
                stroke="#a0aec0"
                tick={{ fill: '#a0aec0', fontSize: 12 }}
                tickMargin={8}
            />
            <YAxis 
                yAxisId="left" 
                label={{ value: t('units.speed_kmh'), angle: -90, position: 'insideLeft', fill: '#22d3ee' }}
                stroke="#22d3ee"
                tick={{ fill: '#22d3ee', fontSize: 12 }}
                domain={["dataMin - 10", "dataMax + 10"]}
            />
            <YAxis 
                yAxisId="right" 
                orientation="right"
                label={{ value: t('units.rpm'), angle: -90, position: 'insideRight', fill: '#f43f5e' }}
                stroke="#f43f5e"
                tick={{ fill: '#f43f5e', fontSize: 12 }}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', color: '#e2e8f0' }}
                labelStyle={{ color: '#cbd5e0' }}
            />
            <Legend wrapperStyle={{ color: '#e2e8f0' }} verticalAlign="top" align="right" />
            <Line yAxisId="left" type="monotone" dataKey="Speed" name={t('gauges.speed')} stroke="#22d3ee" dot={false} strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="rpm" name={t('gauges.rpm')} stroke="#f43f5e" dot={false} strokeWidth={2} />
        </LineChart>
        </ResponsiveContainer>
    </Card>
  );
};

export default LapDataChart;
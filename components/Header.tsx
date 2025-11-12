
import React, { useState } from 'react';
import { audioAlerts } from '../services/audioAlerts';

interface HeaderProps {
  connectionStatus?: 'disconnected' | 'connecting' | 'connected';
  dataSource?: 'demo' | 'ws' | 'csv';
  onChangeDataSource?: (src: 'demo' | 'ws' | 'csv') => void;
}

const Header: React.FC<HeaderProps> = ({ connectionStatus = 'connected', dataSource = 'demo', onChangeDataSource }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [displayMode, setDisplayMode] = useState<'normal' | 'high' | 'ultra'>('normal');

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    audioAlerts.setEnabled(next);
  };

  const applyDisplayMode = (mode: 'normal' | 'high' | 'ultra') => {
    setDisplayMode(mode);
    const body = document.body;
    body.classList.remove('high-contrast');
    body.classList.remove('ultra-contrast');
    if (mode === 'high') body.classList.add('high-contrast');
    if (mode === 'ultra') body.classList.add('ultra-contrast');
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3">
        <h1
          className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-400 to-green-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.65)] motion-safe:animate-pulse"
          style={{ textShadow: '0 0 10px rgba(16,185,129,0.55), 0 0 22px rgba(16,185,129,0.35)' }}
        >
          Race Telemetry AI Coach
        </h1>
        <div className="mt-2 flex items-center gap-4">
          <span className="flex items-center text-sm">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
            <span className="text-gray-300">Conexión: {dataSource === 'demo' ? 'Demo' : dataSource === 'csv' ? 'CSV' : 'WebSocket'}</span>
          </span>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-300">Fuente:</label>
            <select
              value={dataSource}
              onChange={(e) => onChangeDataSource?.(e.target.value as 'demo' | 'ws' | 'csv')}
              className="bg-gray-800 border border-gray-600 text-gray-200 px-2 py-1 rounded"
            >
              <option value="demo">Demo</option>
              <option value="csv">CSV</option>
              <option value="ws">WebSocket</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-300">Modo visual:</label>
            <select
              value={displayMode}
              onChange={(e) => applyDisplayMode(e.target.value as 'normal' | 'high' | 'ultra')}
              className="bg-gray-800 border border-gray-600 text-gray-200 px-2 py-1 rounded"
              title="Ajusta contraste para uso exterior"
            >
              <option value="normal">Normal</option>
              <option value="high">Contraste alto (sol)</option>
              <option value="ultra">Contraste ultra (sol fuerte)</option>
            </select>
          </div>
          <button
            onClick={toggleVoice}
            className={`text-sm px-3 py-1 rounded border ${voiceEnabled ? 'border-green-500 text-green-300' : 'border-gray-500 text-gray-300'} hover:bg-gray-800`}
            aria-pressed={voiceEnabled}
            title="Activar/Desactivar voz"
          >
            {voiceEnabled ? 'Voz: ON' : 'Voz: OFF'}
          </button>
          <button
            onClick={() => audioAlerts.testVoice()}
            className="text-sm px-3 py-1 rounded border border-blue-500 text-blue-300 hover:bg-gray-800"
            title="Probar voz"
          >
            Probar voz
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
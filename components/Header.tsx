
import React, { useState } from 'react';
import { audioAlerts } from '../services/audioAlerts';

interface HeaderProps {
  connectionStatus?: 'disconnected' | 'connecting' | 'connected';
  dataSource?: 'demo' | 'ws';
  onChangeDataSource?: (src: 'demo' | 'ws') => void;
}

const Header: React.FC<HeaderProps> = ({ connectionStatus = 'connected', dataSource = 'demo', onChangeDataSource }) => {
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    audioAlerts.setEnabled(next);
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3">
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Hackathon 2025: Race Telemetry AI Coach
        </h1>
        <div className="mt-2 flex items-center gap-4">
          <span className="text-sm text-gray-400">Powered by Gemini API</span>
          <span className="flex items-center text-sm">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
            <span className="text-gray-300">Conexión: Demo</span>
          </span>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-300">Fuente:</label>
            <select
              value={dataSource}
              onChange={(e) => onChangeDataSource?.(e.target.value as 'demo' | 'ws')}
              className="bg-gray-800 border border-gray-600 text-gray-200 px-2 py-1 rounded"
            >
              <option value="demo">Demo</option>
              <option value="ws">WebSocket</option>
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
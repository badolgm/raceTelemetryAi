
import React, { useState, useEffect } from 'react';
import { audioAlerts } from '../services/audioAlerts';
import { useI18n } from '../services/i18n';
import { hasGeminiKey } from '../services/geminiService';

interface HeaderProps {
  connectionStatus?: 'disconnected' | 'connecting' | 'connected';
  dataSource?: 'demo' | 'ws' | 'csv';
  onChangeDataSource?: (src: 'demo' | 'ws' | 'csv') => void;
}

const Header: React.FC<HeaderProps> = ({ connectionStatus = 'connected', dataSource = 'demo', onChangeDataSource }) => {
  const { t, lang, setLang, voiceLocale } = useI18n();
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [displayMode, setDisplayMode] = useState<'normal' | 'high' | 'ultra'>('normal');
  const [aiKeyVisible, setAiKeyVisible] = useState(false);
  const [aiReady, setAiReady] = useState(false);
  const [aiKey, setAiKey] = useState('');

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

  useEffect(() => {
    setAiReady(hasGeminiKey());
    try {
      const k = typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_api_key') || '' : '';
      if (k) setAiKey(k);
    } catch {}
  }, []);

  useEffect(() => {
    audioAlerts.updateSettings({ language: voiceLocale });
  }, [voiceLocale]);

  const saveAiKey = () => {
    try {
      if (typeof localStorage !== 'undefined') {
        if (aiKey && aiKey.length > 0) localStorage.setItem('gemini_api_key', aiKey);
        else localStorage.removeItem('gemini_api_key');
      }
    } catch {}
    setAiReady(hasGeminiKey());
  };

  const changeLanguage = (next: 'es' | 'en') => {
    setLang(next);
    audioAlerts.stopAll();
    audioAlerts.updateSettings({ language: next === 'en' ? 'en-US' : 'es-ES' });
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3">
        <h1
          className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-lime-300 via-emerald-400 to-green-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.65)] motion-safe:animate-pulse"
          style={{ textShadow: '0 0 10px rgba(16,185,129,0.55), 0 0 22px rgba(16,185,129,0.35)' }}
        >
          {t('app.title')}
        </h1>
        <div className="mt-2 flex items-center gap-4">
          <span className="flex items-center text-sm">
            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-gray-500'}`} />
            <span className="text-gray-300">{t('header.connection')}: {dataSource === 'demo' ? t('source.demo') : dataSource === 'csv' ? t('source.csv') : t('source.ws')}</span>
          </span>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-300">{t('header.source')}:</label>
            <select
              value={dataSource}
              onChange={(e) => onChangeDataSource?.(e.target.value as 'demo' | 'ws' | 'csv')}
              className="bg-gray-800 border border-gray-600 text-gray-200 px-2 py-1 rounded"
            >
              <option value="demo">{t('source.demo')}</option>
              <option value="csv">{t('source.csv')}</option>
              <option value="ws">{t('source.ws')}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-300">{t('header.visualMode')}:</label>
            <select
              value={displayMode}
              onChange={(e) => applyDisplayMode(e.target.value as 'normal' | 'high' | 'ultra')}
              className="bg-gray-800 border border-gray-600 text-gray-200 px-2 py-1 rounded"
              title={t('header.visualModeHint')}
            >
              <option value="normal">{t('display.normal')}</option>
              <option value="high">{t('display.high')}</option>
              <option value="ultra">{t('display.ultra')}</option>
            </select>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-300">{t('header.language')}:</label>
            <select
              value={lang}
              onChange={(e) => changeLanguage(e.target.value as 'es' | 'en')}
              className="bg-gray-800 border border-gray-600 text-gray-200 px-2 py-1 rounded"
            >
              <option value="es">{t('language.es')}</option>
              <option value="en">{t('language.en')}</option>
            </select>
          </div>
          <button
            onClick={toggleVoice}
            className={`text-sm px-3 py-1 rounded border ${voiceEnabled ? 'border-green-500 text-green-300' : 'border-gray-500 text-gray-300'} hover:bg-gray-800`}
            aria-pressed={voiceEnabled}
            title={voiceEnabled ? t('header.voiceOn') : t('header.voiceOff')}
          >
            {voiceEnabled ? t('header.voiceOn') : t('header.voiceOff')}
          </button>
          <button
            onClick={() => audioAlerts.testVoice()}
            className="text-sm px-3 py-1 rounded border border-blue-500 text-blue-300 hover:bg-gray-800"
            title={t('header.testVoice')}
          >
            {t('header.testVoice')}
          </button>
        </div>
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-1 rounded ${aiReady ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-200'}`}>{aiReady ? t('header.aiReady') : t('header.aiNotReady')}</span>
            <button
              onClick={() => setAiKeyVisible(v => !v)}
              className="text-sm px-3 py-1 rounded border border-purple-500 text-purple-300 hover:bg-gray-800"
            >{t('header.aiSettings')}</button>
          </div>
          {aiKeyVisible && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <label className="text-gray-300">{t('header.aiKeyLabel')}:</label>
              <input
                type="password"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                className="bg-gray-800 border border-gray-600 text-gray-200 px-2 py-1 rounded w-64"
              />
              <button
                onClick={saveAiKey}
                className="text-sm px-3 py-1 rounded border border-green-500 text-green-300 hover:bg-gray-800"
              >{t('header.aiSave')}</button>
            </div>
          )}
      </div>
    </header>
  );
};

export default Header;
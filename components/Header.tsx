
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-20">
      <div className="container mx-auto px-4 py-3">
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Hackathon 2025: Race Telemetry AI Coach
        </h1>
        <p className="text-sm text-gray-400">Powered by Gemini API</p>
      </div>
    </header>
  );
};

export default Header;
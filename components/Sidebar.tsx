import React from 'react';
import { Track } from '../types';
import { TRACKS, ICONS } from '../constants';

interface SidebarProps {
  selectedTrack: Track;
  onSelectTrack: (track: Track) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedTrack, onSelectTrack }) => {
  return (
    <aside className="w-full md:w-64 bg-gray-900/60 backdrop-blur-sm border-r border-gray-800 p-4 flex-shrink-0">
      <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center">
        <span className="mr-2 text-cyan-400">{ICONS.track}</span>
        Select Racetrack
      </h2>
      <ul className="space-y-2">
        {TRACKS.map((track) => (
          <li key={track.id}>
            <button
              onClick={() => onSelectTrack(track)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center
                ${selectedTrack.id === track.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-l-4 border-cyan-400'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                }`}
            >
              <span className="mr-3">{ICONS.flag}</span>
              {track.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
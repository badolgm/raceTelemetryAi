import { Track } from './types';
import React from 'react';

// Usamos los mapas locales en formato PDF ubicados en TrackMap/
// Vite sirve archivos estáticos desde la raíz durante el desarrollo, por lo que
// las rutas absolutas /TrackMap/*.pdf funcionan en dev y preview.
export const TRACKS: Track[] = [
  { id: 'barber', name: 'Barber Motorsports', mapUrl: '/TrackMap/Barber_Circuit_Map.pdf', lapDistance: 3830 },
  { id: 'cota', name: 'Circuit of the Americas', mapUrl: '/TrackMap/COTA_Circuit_Map.pdf', lapDistance: 5513 },
  { id: 'indy', name: 'Indianapolis', mapUrl: '/TrackMap/Indy_Circuit_Map.pdf', lapDistance: 4192 },
  { id: 'road_america', name: 'Road America', mapUrl: '/TrackMap/Road_America_Map.pdf', lapDistance: 6515 },
  { id: 'sebring', name: 'Sebring', mapUrl: '/TrackMap/Sebring_Track_Sector_Map.pdf', lapDistance: 6020 },
  { id: 'sonoma', name: 'Sonoma', mapUrl: '/TrackMap/Sonoma_Map.pdf', lapDistance: 4060 },
  { id: 'vir', name: 'Virginia Intl Raceway', mapUrl: '/TrackMap/VIR_map.pdf', lapDistance: 5260 },
];

export const ICONS = {
    car: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h2m4 0h2m-4-10v10m0 0a2 2 0 002 2h2a2 2 0 002-2V9a2 2 0 00-2-2h-2a2 2 0 00-2 2z" /></svg>,
    track: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    brain: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 00-.547 1.806l.477 2.387a6 6 0 00.517 3.86l.158.318a6 6 0 00.517 3.86l2.387.477a2 2 0 001.806-.547a2 2 0 00.547-1.806l-.477-2.387a6 6 0 00-.517-3.86l-.158-.318a6 6 0 00-.517-3.86l-2.387-.477zM12 12a2 2 0 100-4 2 2 0 000 4z" /></svg>,
    flag: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12z" /></svg>,
};
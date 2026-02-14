import React from 'react';
import { MAX_FREQ, MIN_FREQ } from '../constants';

interface UIOverlayProps {
  isStarted: boolean;
  onStart: () => void;
  leftHandActive: boolean;
  rightHandActive: boolean;
  volume: number;
  frequency: number;
  isLoading: boolean;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
  isStarted, 
  onStart, 
  leftHandActive, 
  rightHandActive,
  volume,
  frequency,
  isLoading
}) => {
  
  if (!isStarted) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto z-50">
        <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-500 tracking-tighter">
          Sound Waves From Mikeyo
        </h1>
        <p className="text-gray-400 mb-8 max-w-md text-center">
          Handsfree sound control over the air
          <br /><br />
          <span className="text-blue-400">Left Hand</span> = Volume
          <br />
          <span className="text-pink-400">Right Hand</span> = Pitch
        </p>
        
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-500">Loading Vision Models...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <button
              onClick={onStart}
              className="text-center mb-4 px-10 py-4 bg-gradient-to-r from-blue-500 to-pink-500 text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg tracking-widest block"
            >
              Start
            </button>
            <a
              href="/mikeyo.pdf"
              download
              className="px-10 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)] tracking-widest inline-block text-center"
            >
              Who is Mikeyo
            </a>
          </div>
        )}
      </div>
    );
  }

  // Format Frequency Hz for display
  const hz = Math.round(MIN_FREQ + (frequency * (MAX_FREQ - MIN_FREQ)));
  // Format Volume % for display
  const volPct = Math.round(volume * 100);

  return (
    <div className="w-full h-full flex justify-between px-10 py-8 z-50">
      {/* Left Zone Indicator */}
      <div className={`flex flex-col justify-center items-start transition-opacity duration-300 ${leftHandActive ? 'opacity-100' : 'opacity-30'}`}>
        <div className="border-l-4 border-blue-500 pl-4">
          <h2 className="text-3xl font-bold text-blue-400">VOLUME</h2>
          <p className="text-5xl font-mono mt-2">{volPct}%</p>
          <div className="mt-4 h-48 w-2 bg-gray-800 rounded-full relative overflow-hidden">
            <div 
              className="absolute bottom-0 w-full bg-blue-500 transition-all duration-100 ease-linear"
              style={{ height: `${volPct}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Vertical Axis</p>
        </div>
      </div>

      {/* Center Status */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center opacity-50">
      </div>

      {/* Right Zone Indicator */}
      <div className={`flex flex-col justify-center items-end transition-opacity duration-300 ${rightHandActive ? 'opacity-100' : 'opacity-30'}`}>
        <div className="border-r-4 border-pink-500 pr-4 text-right">
          <h2 className="text-3xl font-bold text-pink-400">PITCH</h2>
          <p className="text-5xl font-mono mt-2">{hz} Hz</p>
           <div className="mt-4 w-48 h-2 bg-gray-800 rounded-full relative overflow-hidden">
            <div 
              className="absolute left-0 h-full bg-pink-500 transition-all duration-100 ease-linear"
              style={{ width: `${frequency * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">Horizontal Axis</p>
        </div>
      </div>
      
      {/* Bottom hint */}
      <div className="absolute bottom-8 left-0 w-full text-center text-gray-600 text-xs pointer-events-auto z-50">
        Ensure good lighting • Show hands clearly to camera • <a href="/Resume%20Yaxuan(Michael)%20Wang.pdf" className="text-blue-400 hover:underline"> Michael Wang </a>
      </div>
    </div>
  );
};
import React, { useState, useCallback } from 'react';
import { ThereminScene } from './components/ThereminScene';
import { HandTracker } from './components/HandTracker';
import { AudioEngine } from './components/AudioEngine';
import { UIOverlay } from './components/UIOverlay';
import * as Tone from 'tone';

// Main App Container
export default function App() {
  const [isAudioStarted, setIsAudioStarted] = useState(false);
  const [volume, setVolume] = useState(0); // 0 to 1
  const [frequency, setFrequency] = useState(0.5); // 0 to 1 (normalized)
  const [leftHandActive, setLeftHandActive] = useState(false);
  const [rightHandActive, setRightHandActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleStart = useCallback(async () => {
    await Tone.start();
    setIsAudioStarted(true);
  }, []);

  const handleTrackingUpdate = useCallback((
    vol: number | null, 
    freq: number | null, 
    isLeft: boolean, 
    isRight: boolean
  ) => {
    // Only update state if values are provided (hand detected)
    if (vol !== null) setVolume(vol);
    if (freq !== null) setFrequency(freq);
    
    setLeftHandActive(isLeft);
    setRightHandActive(isRight);
  }, []);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      {/* 3D Visual Layer - Background */}
      <div className="absolute inset-0 z-0">
        <ThereminScene 
          frequency={frequency} 
          volume={volume} 
          active={isAudioStarted && (leftHandActive || rightHandActive)}
        />
      </div>

      {/* Logic Layer - Audio Synthesis */}
      <AudioEngine 
        active={isAudioStarted} 
        volume={volume} 
        frequency={frequency} 
        mute={!leftHandActive && !rightHandActive}
      />

      {/* Input Layer - Computer Vision */}
      {/* We keep this mounted to load models, but tracking starts/stops based on props if needed */}
      <HandTracker 
        onUpdate={handleTrackingUpdate} 
        onLoad={() => setIsLoading(false)}
      />

      {/* UI Layer - Interaction & Feedback */}
      <div className={`absolute inset-0 z-20 ${isAudioStarted ? 'pointer-events-none' : 'pointer-events-auto'}`}>
        <UIOverlay 
          isStarted={isAudioStarted}
          onStart={handleStart}
          leftHandActive={leftHandActive}
          rightHandActive={rightHandActive}
          volume={volume}
          frequency={frequency}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
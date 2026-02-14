import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { MIN_FREQ, MAX_FREQ, MIN_DB, MAX_DB } from '../constants';

interface AudioEngineProps {
  active: boolean;
  volume: number; // 0-1
  frequency: number; // 0-1
  mute: boolean;
}

export const AudioEngine: React.FC<AudioEngineProps> = ({ active, volume, frequency, mute }) => {
  const oscRef = useRef<Tone.Oscillator | null>(null);
  const gainRef = useRef<Tone.Gain | null>(null);
  const pannerRef = useRef<Tone.Panner | null>(null);

  // Initialize Audio Nodes
  useEffect(() => {
    // Create chain: Oscillator -> Gain -> Panner -> Master
    const gain = new Tone.Gain(0).toDestination();
    const panner = new Tone.Panner(0).connect(gain);
    const osc = new Tone.Oscillator({
      type: "sine",
      frequency: 440,
    }).connect(panner);

    oscRef.current = osc;
    gainRef.current = gain;
    pannerRef.current = panner;

    return () => {
      osc.dispose();
      gain.dispose();
      panner.dispose();
    };
  }, []);

  // Handle Start/Stop
  useEffect(() => {
    if (active) {
      if (oscRef.current && oscRef.current.state === 'stopped') {
        oscRef.current.start();
      }
    } else {
      if (oscRef.current && oscRef.current.state === 'started') {
        oscRef.current.stop();
      }
    }
  }, [active]);

  // Handle Updates
  useEffect(() => {
    if (!oscRef.current || !gainRef.current || !pannerRef.current) return;

    // Calculate actual frequency from normalized 0-1
    const targetFreq = MIN_FREQ + (frequency * (MAX_FREQ - MIN_FREQ));
    
    // Calculate dB from normalized 0-1. If muted, drop to -Infinity
    const targetVol = mute ? -100 : (MIN_DB + (volume * (MAX_DB - MIN_DB)));

    // Smooth transitions
    const rampTime = 0.1;

    oscRef.current.frequency.rampTo(targetFreq, rampTime);
    gainRef.current.gain.rampTo(Tone.dbToGain(targetVol), rampTime);
    
    // Optional: Pan slightly based on pitch (frequency) for stereo width
    // Left (low pitch) to Right (high pitch)
    const panVal = (frequency * 2) - 1; // -1 to 1
    pannerRef.current.pan.rampTo(panVal * 0.3, rampTime); // Subtle pan

  }, [volume, frequency, mute]);

  return null; // Invisible component
};
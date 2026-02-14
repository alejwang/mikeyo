import React, { useEffect, useRef, useState } from 'react';
import MediaPipeHands from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';

interface HandTrackerProps {
  onUpdate: (
    volume: number | null, 
    freq: number | null, 
    isLeft: boolean, 
    isRight: boolean
  ) => void;
  onLoad: () => void;
}

export const HandTracker: React.FC<HandTrackerProps> = ({ onUpdate, onLoad }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const requestRef = useRef<number>(0);
  const handsRef = useRef<any>(null); // Using any for the hands instance to avoid complex type casting with the import fix
  
  // Smoothing refs
  const prevVol = useRef(0);
  const prevFreq = useRef(0.5);

  useEffect(() => {
    // MediaPipe Hands ESM interop fix:
    // The library might be exported as a default object containing the Hands class
    // or as the class itself depending on the bundler/CDN.
    const MP = MediaPipeHands as any;
    const HandsClass = MP.Hands || MP;

    const hands = new HandsClass({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });
    handsRef.current = hands;

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: Results) => {
      let vol: number | null = null;
      let freq: number | null = null;
      let isLeft = false;
      let isRight = false;

      // Logic: 
      // Divide screen into two halves.
      // Left side of screen (x < 0.5) controls Volume (Left Hand).
      // Right side of screen (x > 0.5) controls Pitch (Right Hand).
      
      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          // Use Index Finger Tip (Index 8) for position
          const indexFinger = landmarks[8];
          const x = 1 - indexFinger.x; // Mirror: invert X. Now 0 is left, 1 is right.
          const y = indexFinger.y;

          if (x < 0.5) {
            // Left Zone -> Volume
            // Y: 0 (top) -> 1 (bottom).
            // Requirement: Higher hand = louder.
            // So Top (0) = Loud (1). Bottom (1) = Quiet (0).
            const rawVol = Math.max(0, Math.min(1, 1 - y));
            vol = rawVol;
            isLeft = true;
          } else {
            // Right Zone -> Pitch
            // X: 0.5 (center) -> 1 (right edge).
            // Normalize to 0-1 within the right half.
            // (x - 0.5) * 2
            const rawFreq = Math.max(0, Math.min(1, (x - 0.5) * 2));
            freq = rawFreq;
            isRight = true;
          }
        }
      }

      // Smooth values
      const alpha = 0.2; // Smoothing factor
      if (vol !== null) {
        vol = prevVol.current + (vol - prevVol.current) * alpha;
        prevVol.current = vol;
      }
      if (freq !== null) {
        freq = prevFreq.current + (freq - prevFreq.current) * alpha;
        prevFreq.current = freq;
      }

      onUpdate(vol, freq, isLeft, isRight);
      onLoad();
    });

    // Manual Camera Loop
    const sendToMediaPipe = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2 && handsRef.current) {
        await handsRef.current.send({ image: videoRef.current });
      }
      requestRef.current = requestAnimationFrame(sendToMediaPipe);
    };

    const startCamera = async () => {
        if (!videoRef.current) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            });
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
                videoRef.current?.play();
                requestRef.current = requestAnimationFrame(sendToMediaPipe);
            };
        } catch (err) {
            console.error("Camera error:", err);
            setCameraError("Could not access camera. Please allow permissions.");
        }
    };

    startCamera();

    return () => {
      if (handsRef.current) handsRef.current.close();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
         const stream = videoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div className="fixed bottom-4 right-4 w-32 h-24 z-50 opacity-50 hover:opacity-100 transition-opacity rounded-lg overflow-hidden border border-gray-700 bg-black">
      {/* Hidden processing video */}
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover transform -scale-x-100" // Mirror for preview
        playsInline 
        muted
      />
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-red-500 bg-black p-1 text-center">
          {cameraError}
        </div>
      )}
    </div>
  );
};
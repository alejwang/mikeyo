import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { Torus, Stars, Grid, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { COLOR_LOW_PITCH, COLOR_HIGH_PITCH } from '../constants';

// Fix for missing JSX types in some environments
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      meshStandardMaterial: any;
      color: any;
      ambientLight: any;
      pointLight: any;
    }
  }
}

interface ThereminSceneProps {
  frequency: number; // 0-1
  volume: number; // 0-1
  active: boolean;
}

const HexPrism: React.FC<{ color: THREE.Color; active: boolean; volume: number }> = ({ color, active, volume }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;
    // Slow, futuristic rotation
    meshRef.current.rotation.x = time * 0.25;
    meshRef.current.rotation.y = time * 0.18;
    meshRef.current.rotation.z = time * 0.06;

    // Pulse based on active state and volume
    const targetScale = active ? 0.5 + volume * 0.45 : 0.5;
    const breathe = Math.sin(time * 1.7) * 0.06;
    const scale = targetScale + breathe;
    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.06);

    // Halo subtle breathing (slightly faster)
    if (haloRef.current) {
      const haloScale = 1.06 + (active ? volume * 0.25 : 0) + Math.sin(time * 2.2) * 0.01;
      haloRef.current.scale.lerp(new THREE.Vector3(haloScale, haloScale, haloScale), 0.08);
    }

    // Material update
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    mat.color = color;
    mat.emissive = color;
    mat.emissiveIntensity = active ? 0.9 + volume : 0.25;
  });

  // Futuristic neon outline and halo colors
  const outlineColor = new THREE.Color('#00fff0');
  const haloColor = new THREE.Color('#ff3adf');

  return (
    <group>
      {/* Main hexagonal prism (cylinder with 6 sides) */}
      <mesh ref={meshRef}>
        <cylinderGeometry args={[1.0, 1.0, 2.2, 6]} />
        <meshStandardMaterial flatShading metalness={0.85} roughness={0.05} toneMapped={false} />
        {/* Bright fluorescent edge lines */}
        <Edges threshold={15} color={outlineColor.getStyle()} />
      </mesh>

      {/* Thin halo shell for soft glow */}
    
    </group>
  );
};

interface WaveRingProps { 
  radius: number; 
  speed: [number, number, number]; // Vector3 for 3-axis rotation
  color: THREE.Color; 
  active: boolean; 
  volume: number;
  tilt: [number, number, number]; 
}

const WaveRing: React.FC<WaveRingProps> = ({ radius, speed, color, active, volume, tilt }) => {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.elapsedTime;
    
    // Full 3D rotation: The ring tumbles through space
    // We apply the base tilt + the time-based rotation for each axis to create a gyroscopic effect
    ref.current.rotation.x = tilt[0] + time * speed[0];
    ref.current.rotation.y = tilt[1] + time * speed[1];
    ref.current.rotation.z = tilt[2] + time * speed[2];

    // Scale with volume - rings expand slightly when loud
    const targetRadiusScale = active ? 1 + volume * 0.2 : 1;
    // Add a subtle wave ripple effect to scale
    const ripple = active ? Math.sin(time * 3 + radius) * 0.02 : 0;
    
    const finalScale = targetRadiusScale + ripple;
    ref.current.scale.lerp(new THREE.Vector3(finalScale, finalScale, finalScale), 0.05);

    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.color = color;
    mat.emissive = color;
    // Rings are fainter than the crystal, but pulse with volume
    mat.emissiveIntensity = active ? volume * 0.6 + 0.2 : 0.1;
  });

  return (
    <Torus ref={ref} args={[radius, 0.015, 32, 100]}> {/* Thinner tube for "line" look */}
      <meshStandardMaterial transparent opacity={0.6} toneMapped={false} side={THREE.DoubleSide} />
    </Torus>
  );
};

const ReactiveCore: React.FC<{ frequency: number; volume: number; active: boolean }> = ({ frequency, volume, active }) => {
  const colorRef = useRef(new THREE.Color());
  
  useFrame(() => {
    // Interpolate color based on pitch
    const lowColor = new THREE.Color(COLOR_LOW_PITCH);
    const highColor = new THREE.Color(COLOR_HIGH_PITCH);
    const targetColor = lowColor.lerp(highColor, frequency);
    
    // Smoothly update shared color reference
    colorRef.current.lerp(targetColor, 0.05);
  });

  // Define rings with 3D rotation vectors (X, Y, Z speeds)
  // This creates a "tumbling" atom/gyroscope effect rather than just spinning plates
  const rings = useMemo(() => [
    // { radius: 3.0, speed: [0.15, 0.1, 0], tilt: [0.1, 0, 0.1] },
    { radius: 3.6, speed: [-0.1, 0.05, 0.15], tilt: [0.1, 0, 0] },
    { radius: 3.2, speed: [0.05, -0.15, 0.05], tilt: [0, 0.1, 0] },
    { radius: 3.8, speed: [0.1, 0.05, -0.1], tilt: [0, 0, 0.1] },
  ], []);

  // Modify speed based on frequency
  // Higher pitch = faster movement
  const freqSpeedMod = 1 + frequency * 0.2; 

  return (
    <group>
      <HexPrism color={colorRef.current} active={active} volume={volume} />
      {rings.map((r, i) => (
        <WaveRing 
          key={i}
          radius={r.radius}
          speed={[
            r.speed[0] * freqSpeedMod,
            r.speed[1] * freqSpeedMod,
            r.speed[2] * freqSpeedMod
          ] as [number, number, number]}
          color={colorRef.current}
          active={active}
          volume={volume}
          tilt={r.tilt as [number, number, number]}
        />
      ))}
    </group>
  );
};

const BackgroundGrid = () => {
  return (
    <group position={[0, -5, 0]}>
      <Grid 
        infiniteGrid 
        cellSize={1} 
        sectionSize={5} 
        fadeDistance={20} 
        sectionColor="#444" 
        cellColor="#222" 
      />
    </group>
  );
}

export const ThereminScene: React.FC<ThereminSceneProps> = (props) => {
  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
      <color attach="background" args={['#050505']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Objects */}
      <ReactiveCore {...props} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <BackgroundGrid />

      {/* Post Processing */}
      <EffectComposer enableNormalPass={false}>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.4} />
        <ChromaticAberration offset={new THREE.Vector2(0.002, 0.002)} />
      </EffectComposer>
    </Canvas>
  );
};
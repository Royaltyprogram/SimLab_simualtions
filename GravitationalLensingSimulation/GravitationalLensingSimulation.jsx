import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Physical constants
const G = 6.67430e-11; // Gravitational constant
const c = 299792458; // Speed of light

class LightRayCalculator {
  calculatePath(startPosition, mass, initialDirection, dt = 0.1, steps = 100) {
    try {
      const points = [];
      let position = new THREE.Vector3(...startPosition);
      let velocity = new THREE.Vector3(...initialDirection).normalize().multiplyScalar(c);
      points.push(position.clone());

      const schwarzschildRadius = (2 * G * mass) / (c * c);

      for (let i = 0; i < steps && points.length < 1000; i++) {
        const r = position.length();
        
        // Prevent division by zero and handle near-singularity
        if (r <= schwarzschildRadius || r < 1e-10) break;

        const acceleration = position.clone()
          .normalize()
          .multiplyScalar(-1.5 * G * mass / Math.max(r * r * r, 1e-10));

        velocity.add(acceleration.multiplyScalar(dt));
        
        // Prevent numerical instability
        if (velocity.length() > c) {
          velocity.normalize().multiplyScalar(c);
        }

        position.add(velocity.clone().multiplyScalar(dt));
        points.push(position.clone());
      }

      return points;
    } catch (error) {
      console.error("Error calculating light path:", error);
      return [new THREE.Vector3()];
    }
  }
}

const LightRay = React.memo(({ startPosition, mass, initialDirection }) => {
  const points = useRef([]);
  const lineRef = useRef();
  const calculator = useMemo(() => new LightRayCalculator(), []);

  useFrame(() => {
    if (!lineRef.current) return;
    try {
      points.current = calculator.calculatePath(startPosition, mass, initialDirection);
      const geometry = lineRef.current.geometry;
      geometry.setFromPoints(points.current);
      geometry.computeBoundingSphere();
    } catch (error) {
      console.error("Error updating light ray:", error);
    }
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial color="yellow" transparent opacity={0.6} />
    </line>
  );
});

const MassiveObject = React.memo(({ mass, position }) => {
  const radius = Math.max(mass / 1e11, 0.1);
  
  return (
    <Sphere position={position} args={[radius, 32, 32]}>
      <meshStandardMaterial
        color="blue"
        metalness={0.6}
        roughness={0.4}
        emissive="#004"
      />
    </Sphere>
  );
});

const GravitationalLensingSimulation = () => {
  const [mass, setMass] = useState(2e30);
  const [rayCount, setRayCount] = useState(20);
  const [speed, setSpeed] = useState(1);
  const canvasContainerRef = useRef(null);

  const generateLightRays = useCallback(() => {
    const rays = [];
    const safeRayCount = Math.min(Math.max(rayCount, 5), 50);
    
    for (let i = 0; i < safeRayCount; i++) {
      const angle = (i / safeRayCount) * Math.PI * 2;
      rays.push({
        startPosition: [-50, Math.sin(angle) * 20, Math.cos(angle) * 20],
        initialDirection: [1, 0, 0],
        key: `ray-${i}`
      });
    }
    return rays;
  }, [rayCount]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasContainerRef.current) {
        const { clientWidth, clientHeight } = canvasContainerRef.current;
        const canvas = canvasContainerRef.current.querySelector('canvas');
        if (canvas) {
          canvas.style.width = `${clientWidth}px`;
          canvas.style.height = `${clientHeight}px`;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="w-full h-screen flex flex-col">
      <div className="p-4 bg-gray-100 shadow">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex flex-col">
            <span className="text-sm font-medium">Mass (×10²⁰ kg)</span>
            <input
              type="range"
              min={1}
              max={100}
              value={mass / 1e20}
              onChange={(e) => setMass(Math.max(parseFloat(e.target.value) * 1e20, 1e20))}
              className="w-48 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Light Rays</span>
            <input
              type="range"
              min={5}
              max={50}
              value={rayCount}
              onChange={(e) => setRayCount(parseInt(e.target.value, 10))}
              className="w-48 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
          </label>
          <label className="flex flex-col">
            <span className="text-sm font-medium">Animation Speed</span>
            <input
              type="range"
              min={0.1}
              max={5}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-48 h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
            />
          </label>
        </div>
      </div>
      <div ref={canvasContainerRef} className="flex-1">
        <Canvas
          camera={{ position: [0, 30, 100], fov: 60 }}
          className="w-full h-full"
        >
          <OrbitControls enableDamping dampingFactor={0.05} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <MassiveObject mass={mass} position={[0, 0, 0]} />
          {generateLightRays().map((ray) => (
            <LightRay
              key={ray.key}
              startPosition={ray.startPosition}
              initialDirection={ray.initialDirection}
              mass={mass}
            />
          ))}
          <gridHelper args={[100, 100]} />
          <fog attach="fog" args={['#f0f0f0', 100, 200]} />
        </Canvas>
      </div>
    </div>
  );
};

export default GravitationalLensingSimulation;
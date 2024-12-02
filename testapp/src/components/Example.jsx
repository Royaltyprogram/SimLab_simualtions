import React, { useState, useEffect, useRef, useCallback } from 'react';

const AngularMomentumSimulation = () => {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const rotatingBodyRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [radius, setRadius] = useState(100);
  const [angularVelocity, setAngularVelocity] = useState(0.05);
  const [angularMomentum, setAngularMomentum] = useState(0);
  const [isAdjustingRadius, setIsAdjustingRadius] = useState(false);
  const [error, setError] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const MASS = 5; // kg

  const calculateMomentum = useCallback((r, w) => {
    const I = MASS * r * r;
    return I * w;
  }, []);

  const calculateNewAngularVelocity = useCallback((r, L) => {
    const I = MASS * r * r;
    return L / I;
  }, []);

  const calculateNewRadius = useCallback((w, L) => {
    return Math.sqrt(L / (MASS * w));
  }, []);

  const handleRadiusChange = useCallback((event) => {
    const newRadius = Number(event.target.value);
    if (newRadius < 50 || newRadius > 200) {
      setError('Radius must be between 50 and 200');
      return;
    }

    setIsAdjustingRadius(true);
    setRadius(newRadius);
    
    const newAngularVelocity = calculateNewAngularVelocity(newRadius, angularMomentum);
    setAngularVelocity(newAngularVelocity);
    
    setError(null);
    setIsAdjustingRadius(false);
  }, [angularMomentum, calculateNewAngularVelocity]);

  const handleVelocityChange = useCallback((event) => {
    const newVelocity = Number(event.target.value);
    if (newVelocity < 0.01 || newVelocity > 0.1) {
      setError('Angular velocity must be between 0.01 and 0.1');
      return;
    }

    if (!isAdjustingRadius) {
      setAngularVelocity(newVelocity);
      const newRadius = calculateNewRadius(newVelocity, angularMomentum);
      if (newRadius >= 50 && newRadius <= 200) {
        setRadius(newRadius);
      }
    }
    
    setError(null);
  }, [angularMomentum, calculateNewRadius, isAdjustingRadius]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js';
    script.async = true;
    script.onload = () => {
      setIsLoaded(true);
      setAngularMomentum(calculateMomentum(radius, angularVelocity));
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !window.Matter) return;

    const { Engine, Render, World, Bodies, Constraint, Body, Runner } = window.Matter;

    if (canvasRef.current.children.length > 0) {
      canvasRef.current.innerHTML = '';
    }

    engineRef.current = Engine.create({
      gravity: { x: 0, y: 0 }
    });

    renderRef.current = Render.create({
      element: canvasRef.current,
      engine: engineRef.current,
      options: {
        width: 800,
        height: 600,
        wireframes: false,
        background: '#fafafa'
      }
    });

    // 중심점 위치를 위로 조정
    const centerX = 400;
    const centerY = 200; // 300에서 200으로 변경
    const center = Bodies.circle(centerX, centerY, 20, {
      isStatic: true,
      render: { fillStyle: '#1e293b' },
      collisionFilter: { group: -1 }
    });

    rotatingBodyRef.current = Bodies.circle(centerX + radius, centerY, 30, {
      mass: MASS,
      inertia: Infinity,
      friction: 0,
      frictionAir: 0,
      frictionStatic: 0,
      restitution: 1,
      collisionFilter: { group: -1 },
      render: { fillStyle: '#22c55e' }
    });

    const constraint = Constraint.create({
      bodyA: center,
      bodyB: rotatingBodyRef.current,
      length: radius,
      stiffness: 1,
      damping: 0,
      render: { 
        visible: true,
        strokeStyle: '#64748b',
        lineWidth: 2
      }
    });

    World.add(engineRef.current.world, [center, rotatingBodyRef.current, constraint]);

    const speed = radius * angularVelocity;
    Body.setVelocity(rotatingBodyRef.current, {
      x: 0,
      y: -speed
    });

    runnerRef.current = Runner.create({
      isFixed: true
    });

    Engine.run(engineRef.current);
    Render.run(renderRef.current);

    return () => {
      if (renderRef.current && engineRef.current) {
        Render.stop(renderRef.current);
        World.clear(engineRef.current.world);
        Engine.clear(engineRef.current);
        renderRef.current.canvas.remove();
        renderRef.current.canvas = null;
        renderRef.current.context = null;
        renderRef.current = null;
        engineRef.current = null;
        rotatingBodyRef.current = null;
      }
    };
  }, [radius, angularVelocity, isLoaded]);

  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Simulation Card */}
      <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Angular Momentum Simulation</h2>
          <p className="mt-2 text-gray-600">
            Experiment with radius and angular velocity while conserving angular momentum
          </p>
        </div>
        <div ref={canvasRef} className="w-full h-96 bg-gray-50" />
      </div>
      
      {/* Controls Card with Toggle */}
      <div className="w-full bg-white rounded-xl shadow-lg overflow-hidden">
        <button 
          onClick={toggleControls}
          className="w-full p-4 bg-gray-50 border-b border-gray-200 text-left font-medium text-gray-700 hover:bg-gray-100 transition-colors flex justify-between items-center"
        >
          <span>Controls</span>
          <svg 
            className={`w-5 h-5 transform transition-transform ${showControls ? 'rotate-180' : ''}`} 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
        
        {showControls && (
          <div className="p-6 space-y-6">
            {/* Radius Control */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Radius</label>
                <span className="px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-600">
                  {radius.toFixed(2)} px
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="200"
                step="0.1"
                value={radius}
                onChange={handleRadiusChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Angular Velocity Control */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">Angular Velocity</label>
                <span className="px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-600">
                  {angularVelocity.toFixed(3)} rad/s
                </span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.1"
                step="0.001"
                value={angularVelocity}
                onChange={handleVelocityChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Angular Momentum Display */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Angular Momentum</span>
                <span className="font-mono text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  {angularMomentum.toFixed(2)} kg⋅m²/s
                </span>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AngularMomentumSimulation;
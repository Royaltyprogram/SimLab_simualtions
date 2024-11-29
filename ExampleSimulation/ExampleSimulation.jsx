import React, { useState, useEffect, useCallback, useRef } from 'react';

const ProjectileMotion = () => {
  const canvasRef = useRef(null);
  const [velocity, setVelocity] = useState(50);
  const [angle, setAngle] = useState(45);
  const [isSimulating, setIsSimulating] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const animationFrameRef = useRef();

  const calculatePosition = useCallback((time) => {
    const g = 9.81; // 중력가속도
    const v0x = velocity * Math.cos((angle * Math.PI) / 180);
    const v0y = velocity * Math.sin((angle * Math.PI) / 180);
    
    const x = v0x * time;
    const y = v0y * time - (0.5 * g * time * time);
    
    return { x, y };
  }, [velocity, angle]);

  const drawProjectile = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // 캔버스 크기 설정
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // 캔버스 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 좌표계 변환 (원점을 왼쪽 하단으로)
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);
    
    // 포물선 그리기
    ctx.beginPath();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    
    let time = 0;
    while (time <= 10) {
      const pos = calculatePosition(time);
      const screenX = pos.x;
      const screenY = pos.y;
      
      if (time === 0) {
        ctx.moveTo(screenX, screenY);
      } else {
        ctx.lineTo(screenX, screenY);
      }
      
      time += 0.1;
    }
    
    ctx.stroke();
    
    // 현재 위치에 점 그리기
    if (isSimulating) {
      ctx.beginPath();
      ctx.fillStyle = 'red';
      ctx.arc(position.x, position.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }, [calculatePosition, position, isSimulating]);

  useEffect(() => {
    let startTime = null;
    let lastTime = 0;
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsedTime = (timestamp - startTime) / 1000; // 초 단위로 변환
      
      if (elapsedTime > lastTime) {
        const newPosition = calculatePosition(elapsedTime);
        
        // 지면에 닿았는지 확인
        if (newPosition.y < 0) {
          setIsSimulating(false);
          return;
        }
        
        setPosition(newPosition);
        lastTime = elapsedTime;
      }
      
      drawProjectile();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    if (isSimulating) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSimulating, calculatePosition, drawProjectile]);

  // 초기 포물선 그리기
  useEffect(() => {
    drawProjectile();
  }, [drawProjectile]);

  const handleStart = () => {
    setPosition({ x: 0, y: 0 });
    setIsSimulating(true);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="w-full max-w-3xl aspect-video border border-gray-300 rounded">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
        />
      </div>
      
      <div className="flex flex-col gap-4 w-full max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Initial Velocity (m/s): {velocity}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={velocity}
            onChange={(e) => setVelocity(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Angle (degrees): {angle}
          </label>
          <input
            type="range"
            min="0"
            max="90"
            value={angle}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={handleStart}
            disabled={isSimulating}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start
          </button>
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectileMotion;
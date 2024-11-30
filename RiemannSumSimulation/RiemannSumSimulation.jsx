import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Sketch from 'react-p5';

const RiemannSumSimulation = () => {
  const [rectangles, setRectangles] = useState(10);
  const [functionType, setFunctionType] = useState('quadratic');
  const [customFunction, setCustomFunction] = useState('2 * x * x');
  const [sumType, setSumType] = useState('left');
  const [error, setError] = useState(null);

  const [dimensions, setDimensions] = useState({
    width: Math.min(800, window.innerWidth - 40),
    height: 400
  });

  const margin = 40;
  const graphWidth = dimensions.width - 2 * margin;
  const graphHeight = dimensions.height - 2 * margin;

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: Math.min(800, window.innerWidth - 40),
        height: 400
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 안전한 수식 평가를 위한 함수
  const safeEval = useCallback((expr, x) => {
    try {
      // 허용된 수학 함수들
      const math = {
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        abs: Math.abs,
        sqrt: Math.sqrt,
        pow: Math.pow,
        exp: Math.exp,
        log: Math.log,
        pi: Math.PI,
        e: Math.E
      };

      // 위험한 키워드 체크
      const dangerousKeywords = ['eval', 'Function', 'constructor', 'prototype', 'window', 'document'];
      if (dangerousKeywords.some(keyword => expr.includes(keyword))) {
        throw new Error('잘못된 수식입니다');
      }

      // 수식을 함수로 변환
      const func = new Function('x', 'math', `'use strict'; return ${expr}`);
      return func(x, math);
    } catch (err) {
      throw new Error('수식 평가 오류');
    }
  });

  const evaluateFunction = useCallback((x, type) => {
    try {
      if (type === 'custom') {
        return safeEval(customFunction, x);
      }

      switch (type) {
        case 'quadratic':
          return 2 * x * x;
        case 'linear':
          return 2 * x;
        case 'sine':
          return Math.sin(x * Math.PI) + 1;
        default:
          return x * x;
      }
    } catch (err) {
      setError(err.message);
      return 0;
    }
  }, [customFunction, safeEval]);

  const calculateRiemannSum = useCallback((n, type, funcType) => {
    try {
      if (n <= 0) throw new Error('사각형 개수가 잘못되었습니다');
      
      const dx = 1 / n;
      let sum = 0;
      
      for (let i = 0; i < n; i++) {
        const x = type === 'left' ? i * dx : (i + 1) * dx;
        sum += evaluateFunction(x, funcType) * dx;
      }
      
      return Number(sum).toFixed(4);
    } catch (err) {
      setError('계산 오류');
      return '0.0000';
    }
  }, [evaluateFunction]);

  const calculatedArea = useMemo(() => {
    return calculateRiemannSum(rectangles, sumType, functionType);
  }, [rectangles, sumType, functionType, calculateRiemannSum]);

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(dimensions.width, dimensions.height).parent(canvasParentRef);
  };

  const draw = (p5) => {
    try {
      p5.background(255);
      
      // 축 그리기
      p5.stroke(0);
      p5.strokeWeight(1);
      p5.line(margin, dimensions.height - margin, dimensions.width - margin, dimensions.height - margin);
      p5.line(margin, margin, margin, dimensions.height - margin);

      // 함수 곡선 그리기
      p5.stroke(0, 0, 255);
      p5.noFill();
      p5.beginShape();
      for (let x = 0; x <= graphWidth; x++) {
        const xValue = x / graphWidth;
        const yValue = evaluateFunction(xValue, functionType);
        const screenX = x + margin;
        const screenY = dimensions.height - margin - (yValue * graphHeight / 4);
        p5.vertex(screenX, screenY);
      }
      p5.endShape();

      // 리만 사각형 그리기
      const dx = graphWidth / rectangles;
      p5.stroke(255, 0, 0, 100);
      p5.fill(255, 0, 0, 50);

      for (let i = 0; i < rectangles; i++) {
        const x = i * dx;
        const xValue = x / graphWidth;
        const rectX = sumType === 'left' ? xValue : xValue + dx / graphWidth;
        const height = evaluateFunction(rectX, functionType);
        const screenX = x + margin;
        const screenY = dimensions.height - margin;
        const rectHeight = height * graphHeight / 4;
        p5.rect(screenX, screenY, dx, -rectHeight);
      }
    } catch (err) {
      setError('렌더링 오류');
    }
  };

  return (
    <div className="flex flex-col items-center w-full p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-4">
        <h2 className="text-2xl font-bold mb-4 text-center">리만 합 시각화</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <Sketch setup={setup} draw={draw} />
        </div>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex flex-col">
            <label className="mb-2">사각형 개수:</label>
            <input
              type="range"
              min="1"
              max="50"
              value={rectangles}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                  setRectangles(value);
                  setError(null);
                }
              }}
              className="w-48"
            />
            <span className="text-sm text-gray-600">값: {rectangles}</span>
          </div>
          
          <div className="flex flex-col">
            <label className="mb-2">함수 종류:</label>
            <select
              value={functionType}
              onChange={(e) => {
                setFunctionType(e.target.value);
                setError(null);
              }}
              className="p-2 border rounded"
            >
              <option value="quadratic">이차 함수 (2x²)</option>
              <option value="linear">일차 함수 (2x)</option>
              <option value="sine">삼각 함수 (sin(πx) + 1)</option>
              <option value="custom">사용자 정의 함수</option>
            </select>
          </div>

          {functionType === 'custom' && (
            <div className="flex flex-col">
              <label className="mb-2">사용자 정의 함수:</label>
              <input
                type="text"
                value={customFunction}
                onChange={(e) => {
                  setCustomFunction(e.target.value);
                  setError(null);
                }}
                placeholder="예: 2 * x * x"
                className="p-2 border rounded w-64"
              />
              <span className="text-sm text-gray-600 mt-1">
                변수 x와 수학 함수(sin, cos, sqrt 등)를 사용할 수 있습니다
              </span>
            </div>
          )}
          
          <div className="flex flex-col">
            <label className="mb-2">합의 종류:</label>
            <select
              value={sumType}
              onChange={(e) => {
                setSumType(e.target.value);
                setError(null);
              }}
              className="p-2 border rounded"
            >
              <option value="left">왼쪽 리만 합</option>
              <option value="right">오른쪽 리만 합</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="font-semibold">
            근사 면적: {calculatedArea}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RiemannSumSimulation;
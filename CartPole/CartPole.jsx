import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// Constants
const ACTIONS = ['LEFT', 'RIGHT'];

const initialState = {
  cartPosition: 0,
  cartVelocity: 0,
  poleAngle: 0,
  poleVelocity: 0
};

const STATE_BOUNDS = {
  cartPosition: [-2.4, 2.4],
  cartVelocity: [-3, 3],
  poleAngle: [-0.2095, 0.2095],
  poleVelocity: [-3, 3]
};

// Initialize Q-table
const initializeQTable = () => ({});

// Discretize state
const discretize = (state, numBins) => {
  const discretized = [];

  for (const key in state) {
    const [min, max] = STATE_BOUNDS[key];
    const range = max - min;
    const bin_size = range / numBins;
    let value = state[key];
    value = Math.max(min, Math.min(max, value));
    const bin = Math.floor((value - min) / bin_size);
    discretized.push(Math.min(bin, numBins - 1));
  }

  return discretized.join(',');
};

// Physics engine (cart-pole balancing)
const step = (state, action) => {
  const force = action === 'LEFT' ? -10 : 10;
  const gravity = 9.8;
  const masscart = 1.0;
  const masspole = 0.1;
  const total_mass = masscart + masspole;
  const length = 0.5;
  const polemass_length = masspole * length;
  const tau = 0.02;

  const x = state.cartPosition;
  const x_dot = state.cartVelocity;
  const theta = state.poleAngle;
  const theta_dot = state.poleVelocity;

  const costheta = Math.cos(theta);
  const sintheta = Math.sin(theta);

  const temp = (force + polemass_length * theta_dot * theta_dot * sintheta) / total_mass;
  const theta_acc = (gravity * sintheta - costheta * temp) /
    (length * (4.0 / 3.0 - masspole * costheta * costheta / total_mass));
  const x_acc = temp - polemass_length * theta_acc * costheta / total_mass;

  const new_x = x + tau * x_dot;
  const new_x_dot = x_dot + tau * x_acc;
  const new_theta = theta + tau * theta_dot;
  const new_theta_dot = theta_dot + tau * theta_acc;

  const done =
    new_x < STATE_BOUNDS.cartPosition[0] ||
    new_x > STATE_BOUNDS.cartPosition[1] ||
    new_theta < STATE_BOUNDS.poleAngle[0] ||
    new_theta > STATE_BOUNDS.poleAngle[1];

  const reward = done ? 0 : 1;

  return {
    cartPosition: new_x,
    cartVelocity: new_x_dot,
    poleAngle: new_theta,
    poleVelocity: new_theta_dot,
    done,
    reward,
  };
};

const CartPole = () => {
  const [alpha, setAlpha] = useState(0.1);
  const [gamma, setGamma] = useState(0.9);
  const [numBins, setNumBins] = useState(6);
  const [epsilon, setEpsilon] = useState(1.0);
  const [epsilonDecay, setEpsilonDecay] = useState(0.995);
  const [minEpsilon, setMinEpsilon] = useState(0.01);
  const [currentState, setCurrentState] = useState(initialState);
  const [qTable, setQTable] = useState(initializeQTable());
  const [episode, setEpisode] = useState(0);
  const [totalRewards, setTotalRewards] = useState(0);
  const [rewardsHistory, setRewardsHistory] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStatus, setDemoStatus] = useState('');
  const [demoSteps, setDemoSteps] = useState(0);
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const rewardsRef = useRef([]);
  const isTrainingRef = useRef(false);

  const runLearningEpisode = () => {
    let state = { ...initialState };
    let totalReward = 0;
    let done = false;
    const newQTable = { ...qTable };

    const runStep = () => {
      if (!isTrainingRef.current) {
        return;
      }

      if (done) {
        setQTable(newQTable);
        setTotalRewards((prev) => prev + totalReward);

        setEpisode((prevEpisode) => {
          const nextEpisode = prevEpisode + 1;
          setRewardsHistory((prev) => {
            const updatedRewards = [...prev, { episode: nextEpisode, reward: totalReward }];
            rewardsRef.current = updatedRewards;
            return updatedRewards;
          });
          setEpsilon((prev) => Math.max(prev * epsilonDecay, minEpsilon));
          if (isTrainingRef.current) {
            animationRef.current = setTimeout(runLearningEpisode, 0);
          }
          return nextEpisode;
        });

        return;
      }

      const stateKey = discretize(state, numBins);
      let action;
      if (Math.random() < epsilon) {
        action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      } else {
        if (!newQTable[stateKey]) {
          newQTable[stateKey] = { LEFT: 0, RIGHT: 0 };
        }
        const leftQ = newQTable[stateKey]['LEFT'];
        const rightQ = newQTable[stateKey]['RIGHT'];
        action = leftQ > rightQ ? 'LEFT' : 'RIGHT';
      }

      const result = step(state, action);
      const nextState = {
        cartPosition: result.cartPosition,
        cartVelocity: result.cartVelocity,
        poleAngle: result.poleAngle,
        poleVelocity: result.poleVelocity,
      };
      const nextStateKey = discretize(nextState, numBins);

      if (!newQTable[stateKey]) {
        newQTable[stateKey] = { LEFT: 0, RIGHT: 0 };
      }
      if (!newQTable[nextStateKey]) {
        newQTable[nextStateKey] = { LEFT: 0, RIGHT: 0 };
      }

      const oldQ = newQTable[stateKey][action];
      const maxNextQ = Math.max(newQTable[nextStateKey]['LEFT'], newQTable[nextStateKey]['RIGHT']);
      const updatedQ = oldQ + alpha * (result.reward + gamma * maxNextQ - oldQ);
      newQTable[stateKey][action] = updatedQ;

      state = nextState;
      setCurrentState(state);
      totalReward += result.reward;
      done = result.done;

      animationRef.current = setTimeout(runStep, 10);
    };

    runStep();
  };

  const runDemoEpisode = () => {
    let state = { ...initialState };
    let done = false;
    let steps = 0;

    setIsDemoRunning(true);
    setDemoStatus('running');
    setDemoSteps(0);

    const runStep = () => {
      if (done) {
        setIsDemoRunning(false);
        setDemoStatus('fail');
        return;
      }

      steps += 1;
      setDemoSteps(steps);

      const stateKey = discretize(state, numBins);
      let action;
      if (qTable[stateKey]) {
        const leftQ = qTable[stateKey]['LEFT'];
        const rightQ = qTable[stateKey]['RIGHT'];
        action = leftQ > rightQ ? 'LEFT' : 'RIGHT';
      } else {
        action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      }

      const result = step(state, action);
      const nextState = {
        cartPosition: result.cartPosition,
        cartVelocity: result.cartVelocity,
        poleAngle: result.poleAngle,
        poleVelocity: result.poleVelocity,
      };

      state = nextState;
      setCurrentState(state);
      done = result.done;

      animationRef.current = setTimeout(runStep, 10);
    };

    runStep();
  };

  const resetSimulation = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setQTable(initializeQTable());
    setEpisode(0);
    setTotalRewards(0);
    setEpsilon(1.0);
    setCurrentState(initialState);
    setRewardsHistory([]);
    rewardsRef.current = [];
    setIsTraining(false);
    isTrainingRef.current = false;
    setIsDemoRunning(false);
    setDemoStatus('');
    setDemoSteps(0);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startTraining = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setIsTraining(true);
    isTrainingRef.current = true;
    runLearningEpisode();
  };

  const stopTraining = () => {
    setIsTraining(false);
    isTrainingRef.current = false;
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scale = 100;
    const cartY = canvas.height / 2;
    const cartX = canvas.width / 2 + currentState.cartPosition * scale;

    ctx.fillStyle = 'blue';
    ctx.fillRect(cartX - 50, cartY, 100, 20);

    const poleLength = 100;
    const angle = currentState.poleAngle;
    const poleEndX = cartX + poleLength * Math.sin(angle);
    const poleEndY = cartY - poleLength * Math.cos(angle);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cartX, cartY);
    ctx.lineTo(poleEndX, poleEndY);
    ctx.stroke();

    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.moveTo(0, cartY + 20);
    ctx.lineTo(canvas.width, cartY + 20);
    ctx.stroke();
  }, [currentState]);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Q-Learning Cart-Pole Balance Simulation
        </h1>

        <div className="bg-white rounded-lg shadow-md p-4 mb-8">
          <canvas 
            ref={canvasRef} 
            width={600} 
            height={400} 
            className="w-full border-2 border-gray-200 rounded-lg"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Number of Bins
            </label>
            <input
              type="number"
              value={numBins}
              onChange={(e) => setNumBins(Math.max(2, parseInt(e.target.value) || 2))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Learning Rate (Alpha)
            </label>
            <input
              type="number"
              step="0.01"
              value={alpha}
              onChange={(e) => setAlpha(Math.min(Math.max(0, parseFloat(e.target.value) || 0.1), 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Discount Factor (Gamma)
            </label>
            <input
              type="number"
              step="0.01"
              value={gamma}
              onChange={(e) => setGamma(Math.min(Math.max(0, parseFloat(e.target.value) || 0.9), 1))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mb-8">
          {!isTraining && !isDemoRunning && (
            <button
              onClick={startTraining}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Start Training
            </button>
          )}
          
          {isTraining && !isDemoRunning && (
            <button
              onClick={stopTraining}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors"
            >
              Stop Training
            </button>
          )}
          
          {!isTraining && !isDemoRunning && episode > 0 && (
            <button
              onClick={runDemoEpisode}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Run Demo
            </button>
          )}
          
          <button
            onClick={resetSimulation}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-4 shadow">
            <p className="text-lg font-semibold">Episodes: {episode}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 shadow">
            <p className="text-lg font-semibold">Total Rewards: {totalRewards}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 shadow">
            <p className="text-lg font-semibold">Current ε: {epsilon.toFixed(4)}</p>
          </div>
        </div>

        {!isTraining && episode > 0 && (
          <div className="mb-8 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 font-semibold">
              Training completed! You can now run the demo.
            </p>
          </div>
        )}

        {isDemoRunning && demoStatus === 'running' && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-700 font-semibold">
              Demo running... Maintaining balance! (Steps: {demoSteps})
            </p>
          </div>
        )}

        {!isDemoRunning && demoStatus === 'fail' && (
          <div className="mb-8 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-700 font-semibold">
              Failed! Maintained balance for {demoSteps} steps.
            </p>
          </div>
        )}

        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Learning Progress</h2>
          <div className="w-full">
            <LineChart
              width={600}
              height={300}
              data={rewardsHistory}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="episode" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="reward" 
                stroke="#6366f1" 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Q-Table (Sample)</h2>
          <div className="overflow-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    LEFT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RIGHT
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(qTable).slice(0, 20).map(([state, actions], index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {actions.LEFT.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {actions.RIGHT.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.keys(qTable).length > 20 && (
              <p className="mt-4 text-sm text-gray-500 text-center">
                ... more states available
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPole;
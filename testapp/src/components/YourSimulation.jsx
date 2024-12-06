import React, { useState, useMemo, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Example sentences
const EXAMPLE_SENTENCES = [
  {
    id: 1,
    text: "I love you",
    description: "Simple affectionate statement showing direct relationships"
  },
  {
    id: 2,
    text: "The cat sleeps",
    description: "Basic subject-verb relationship with an article"
  },
  {
    id: 3,
    text: "Time flies fast",
    description: "Abstract concept with metaphorical meaning"
  }
];

// 4D Word embeddings
const WORD_EMBEDDINGS = {
  'i': [0.2, 0.5, -0.3, 0.1],
  'love': [0.6, 0.2, 0.3, -0.2],
  'you': [0.3, 0.4, -0.2, 0.2],
  'the': [0.1, 0.1, 0.1, 0.1],
  'cat': [0.4, -0.3, 0.2, 0.1],
  'sleeps': [0.2, 0.4, 0.3, -0.1],
  'time': [0.1, 0.2, 0.3, 0.4],
  'flies': [0.4, 0.3, 0.5, -0.2],
  'fast': [0.5, 0.4, 0.2, -0.3]
};

const VectorVisualization = ({ vectors, labels, title, description }) => (
  <div className="bg-white rounded-xl shadow-md p-6">
    <h3 className="text-xl font-bold mb-2 text-gray-800">{title}</h3>
    <p className="text-sm text-gray-600 mb-4">{description}</p>
    <div className="h-48">
      <Line
        data={{
          labels: ['Dim 1', 'Dim 2', 'Dim 3', 'Dim 4'],
          datasets: vectors.map((vector, idx) => ({
            label: labels[idx],
            data: vector,
            borderColor: `hsl(${(idx * 360) / vectors.length}, 70%, 50%)`,
            backgroundColor: `hsla(${(idx * 360) / vectors.length}, 70%, 50%, 0.1)`,
            tension: 0.1,
          })),
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true },
          },
        }}
      />
    </div>
  </div>
);

const AttentionSimulator = () => {
  const [selectedSentence, setSelectedSentence] = useState(EXAMPLE_SENTENCES[0]);
  const [currentStep, setCurrentStep] = useState(1);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Get tokens and embeddings
  const tokens = useMemo(() => 
    selectedSentence.text.toLowerCase().split(' '),
    [selectedSentence]
  );

  const embeddings = useMemo(() => 
    tokens.map(token => WORD_EMBEDDINGS[token]),
    [tokens]
  );

  // Initialize weights with Xavier initialization
  const initializeWeights = useCallback((inputDim, outputDim) => {
    const limit = Math.sqrt(6 / (inputDim + outputDim));
    return Array(outputDim).fill().map(() => 
      Array(inputDim).fill().map(() => (Math.random() * 2 * limit) - limit)
    );
  }, []);

  const { W_Q, W_K, W_V } = useMemo(() => ({
    W_Q: initializeWeights(4, 4),
    W_K: initializeWeights(4, 4),
    W_V: initializeWeights(4, 4),
  }), [initializeWeights]);

  // Calculate Q, K, V vectors
  const { Q, K, V } = useMemo(() => {
    const matrixMultiply = (matrix, vector) => 
      matrix.map(row => row.reduce((sum, val, i) => sum + val * vector[i], 0));

    return {
      Q: embeddings.map(emb => matrixMultiply(W_Q, emb)),
      K: embeddings.map(emb => matrixMultiply(W_K, emb)),
      V: embeddings.map(emb => matrixMultiply(W_V, emb)),
    };
  }, [embeddings, W_Q, W_K, W_V]);

  // Calculate attention scores and weights
  const { attentionScores, attentionWeights } = useMemo(() => {
    const scores = Q.map(q => K.map(k => {
      const dotProduct = q.reduce((sum, qi, i) => sum + qi * k[i], 0);
      return dotProduct / Math.sqrt(4);
    }));

    const weights = scores.map(row => {
      const maxVal = Math.max(...row);
      const expScores = row.map(score => Math.exp(score - maxVal));
      const sumExp = expScores.reduce((a, b) => a + b, 0);
      return expScores.map(score => score / sumExp);
    });

    return { attentionScores: scores, attentionWeights: weights };
  }, [Q, K]);

  // Calculate final outputs
  const outputs = useMemo(() => 
    attentionWeights.map((weights, i) =>
      weights.reduce((acc, weight, j) => 
        acc.map((val, k) => val + weight * V[j][k])
      , Array(4).fill(0))
    ),
    [attentionWeights, V]
  );

  return (
    <div className="flex flex-col p-4 max-w-6xl mx-auto">
      <div className="space-y-6">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Self-Attention Visualization</h2>
          <div className="flex flex-wrap gap-3 mb-6">
            {EXAMPLE_SENTENCES.map(sentence => (
              <button
                key={sentence.id}
                onClick={() => setSelectedSentence(sentence)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedSentence.id === sentence.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {sentence.text}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              disabled={currentStep === 1}
            >
              Previous
            </button>
            <span className="font-medium">Step {currentStep} of 4</span>
            <button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              disabled={currentStep === 4}
            >
              Next
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Animation Speed:</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={animationSpeed}
                onChange={e => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-24"
              />
              <span className="text-sm text-gray-600">{animationSpeed}x</span>
            </div>
          </div>
        </div>

        {/* Step 1: Query, Key, Value Generation */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <VectorVisualization
              vectors={Q}
              labels={tokens.map(t => `${t} (Query)`)}
              title="Query Vectors (Q)"
              description="Each token's embedding is transformed into a Query vector"
            />
            <VectorVisualization
              vectors={K}
              labels={tokens.map(t => `${t} (Key)`)}
              title="Key Vectors (K)"
              description="Each token's embedding is transformed into a Key vector"
            />
            <VectorVisualization
              vectors={V}
              labels={tokens.map(t => `${t} (Value)`)}
              title="Value Vectors (V)"
              description="Each token's embedding is transformed into a Value vector"
            />
          </div>
        )}

        {/* Step 2: Attention Scores */}
        {currentStep === 2 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Attention Scores (Q·K^T)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                    {tokens.map((token, i) => (
                      <th key={i} className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {token}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attentionScores.map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {tokens[i]}
                      </td>
                      {row.map((score, j) => (
                        <td
                          key={j}
                          className="px-6 py-4 whitespace-nowrap text-sm transition-all duration-500"
                          style={{
                            backgroundColor: `rgba(59, 130, 246, ${Math.abs(score) / Math.max(...row.map(Math.abs))})`,
                            color: Math.abs(score) / Math.max(...row.map(Math.abs)) > 0.5 ? 'white' : 'black',
                          }}
                        >
                          {score.toFixed(3)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Step 3: Attention Weights */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Attention Weights (after Softmax)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                      {tokens.map((token, i) => (
                        <th key={i} className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {token}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attentionWeights.map((row, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {tokens[i]}
                        </td>
                        {row.map((weight, j) => (
                          <td
                            key={j}
                            className="px-6 py-4 whitespace-nowrap text-sm transition-all duration-500"
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${weight})`,
                              color: weight > 0.5 ? 'white' : 'black',
                            }}
                          >
                            {weight.toFixed(3)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800">Attention Distribution</h3>
              <div className="space-y-4">
                {tokens.map((sourceToken, i) => (
                  <div key={i} className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-1">{sourceToken}</div>
                    <div className="flex items-center gap-2">
                      {attentionWeights[i].map((weight, j) => (
                        <div key={j} className="flex flex-col items-center flex-1">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${weight * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 mt-1">{tokens[j]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Final Outputs */}
        {currentStep === 4 && (
          <VectorVisualization
            vectors={outputs}
            labels={tokens}
            title="Final Context-Aware Representations"
            description="The final output vectors after applying attention weights"
          />
        )}
      </div>
    </div>
  );
};

export default AttentionSimulator;
import React, { useState, useMemo, useCallback } from 'react';
import { Line, Bar } from 'react-chartjs-2';
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

const MatrixVisualization = ({ matrix, rowLabels, colLabels, title }) => (
  <div className="p-4 border rounded">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th></th>
            {colLabels.map((label, i) => (
              <th key={i} className="px-4 py-2 text-center">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="px-4 py-2 font-medium">{rowLabels[i]}</td>
              {row.map((value, j) => (
                <td
                  key={j}
                  className="px-4 py-2 text-center"
                  style={{
                    backgroundColor: `rgba(66, 153, 225, ${Math.abs(value)})`,
                    color: Math.abs(value) > 0.5 ? 'white' : 'black',
                  }}
                >
                  {value.toFixed(3)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const VectorVisualization = ({ vectors, labels, title, description }) => (
  <div className="p-4 border rounded">
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
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
  const [selectedToken, setSelectedToken] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showDetails, setShowDetails] = useState(true);

  // Tokenize and get embeddings
  const tokens = useMemo(() => 
    selectedSentence.text.toLowerCase().split(' '),
    [selectedSentence]
  );

  const embeddings = useMemo(() => 
    tokens.map(token => WORD_EMBEDDINGS[token]),
    [tokens]
  );

  // Initialize attention weights with Xavier initialization
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
      return dotProduct / Math.sqrt(4); // Scaling factor
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
    <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-full mx-auto">
      {/* Main visualization area */}
      <div className="flex-1 space-y-4">
        {/* Sentence selection and controls */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-xl font-bold mb-4">Self-Attention Visualization</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {EXAMPLE_SENTENCES.map(sentence => (
              <button
                key={sentence.id}
                onClick={() => {
                  setSelectedSentence(sentence);
                  setSelectedToken(null);
                }}
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
          
          {/* Playback controls */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Previous
            </button>
            <span className="font-medium">Step {currentStep}</span>
            <button
              onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              Next
            </button>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={animationSpeed}
              onChange={e => setAnimationSpeed(parseFloat(e.target.value))}
              className="w-32"
            />
            <span className="text-sm text-gray-600">Speed: {animationSpeed}x</span>
          </div>
        </div>

        {/* Step 1: Q, K, V Generation */}
        {currentStep === 1 && (
          <div className="space-y-4">
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
          <div className="space-y-4">
            <MatrixVisualization
              matrix={attentionScores}
              rowLabels={tokens}
              colLabels={tokens}
              title="Attention Scores (Q·K^T)"
            />
          </div>
        )}

        {/* Step 3: Softmax Weights */}
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
              <div className="h-64">
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
              <p className="text-sm text-gray-500 mt-4">
                Each bar shows how much attention each token pays to other tokens
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Final Outputs */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <VectorVisualization
              vectors={outputs}
              labels={tokens}
              title="Final Context-Aware Representations"
              description="The final output vectors after applying attention weights"
            />
          </div>
        )}
      </div>

      {/* Explanation panel */}
      {showDetails && (
        <div className="lg:w-80 bg-white rounded-lg shadow-sm p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Step Details</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="prose prose-sm">
            {currentStep === 1 && (
              <>
                <h4>Query, Key, and Value Generation</h4>
                <p>
                  Each token's embedding is transformed into three different vectors:
                  Query (Q), Key (K), and Value (V) vectors through learned weight matrices.
                </p>
                <ul>
                  <li>Q = embedding × W_Q</li>
                  <li>K = embedding × W_K</li>
                  <li>V = embedding × W_V</li>
                </ul>
              </>
            )}
            {currentStep === 2 && (
              <>
                <h4>Attention Score Calculation</h4>
                <p>
                  Attention scores are computed by taking the dot product of Query
                  and Key vectors, showing how much each token should attend to others.
                </p>
                <p className="text-sm font-mono">
                  Score = Q × K^T / √d_k
                </p>
              </>
            )}
            {currentStep === 3 && (
              <>
                <h4>Softmax Transformation</h4>
                <p>
                  Attention scores are converted to probabilities using the softmax
                  function, ensuring they sum to 1 for each token.
                </p>
                <p className="text-sm font-mono">
                  weights = softmax(scores)
                </p>
              </>
            )}
            {currentStep === 4 && (
              <>
                <h4>Final Output Generation</h4>
                <p>
                  The final representation for each token is computed as a weighted
                  sum of value vectors, using the attention weights.
                </p>
                <p className="text-sm font-mono">
                  output = weighted_sum(weights × V)
                </p>
              </>
            )}
          </div>

          {selectedToken && (
            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="font-bold mb-2">Selected Token: {selectedToken}</h4>
              <div className="space-y-2">
                <p className="text-sm">Attention Distribution:</p>
                {tokens.map((token, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-sm">{token}:</span>
                    <div 
                      className="flex-1 h-4 bg-blue-100 rounded overflow-hidden"
                      title={`${(attentionWeights[tokens.indexOf(selectedToken)][idx] * 100).toFixed(1)}%`}
                    >
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${attentionWeights[tokens.indexOf(selectedToken)][idx] * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AttentionSimulator;

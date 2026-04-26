import React, { useState } from 'react';
import axios from 'axios';
import { savePhqResult } from '../services/firestoreService';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

const phqQuestions = [
  'Little interest or pleasure in doing things',
  'Feeling down, depressed, or hopeless',
  'Trouble falling or staying asleep, or sleeping too much',
  'Feeling tired or having little energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
  'Trouble concentrating on things, such as reading the newspaper or watching television',
  'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
  'Thoughts that you would be better off dead, or of hurting yourself in some way'
];

const options = [
  '0 - Not at all',
  '1 - Several days',
  '2 - More than half the days',
  '3 - Nearly every day'
];

const Phq9Quiz = ({ user }) => {
  const [answers, setAnswers] = useState(Array(9).fill(0));
  const [text, setText] = useState('');
  const [score, setScore] = useState(null);
  const [risk, setRisk] = useState('');
  const [sentiment, setSentiment] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnswerChange = (index, value) => {
    const updated = [...answers];
    updated[index] = Number(value);
    setAnswers(updated);
  };

  const submitQuiz = async () => {
    try {
      setLoading(true);
      setError('');

      // 1) PHQ‑9 score from backend
      const phqRes = await axios.post(`${API_BASE}/api/phq9-score`, {
        answers
      });

      const phqScore = phqRes.data.score;
      const phqRisk = phqRes.data.risk;

      setScore(phqScore);
      setRisk(phqRisk);

      // Save PHQ‑9 result in Firestore if user logged in
      if (user && user.uid) {
        await savePhqResult(user.uid, phqScore, phqRisk);
      }

      // 2) Optional sentiment analysis (only if user wrote something)
      if (text.trim()) {
        const sentimentRes = await axios.post(
          `${API_BASE}/api/analyze-sentiment`,
          { text }
        );

        setSentiment(sentimentRes.data.label);
        setConfidence(sentimentRes.data.score);
      } else {
        setSentiment('');
        setConfidence(null);
      }
    } catch (err) {
      console.error('Error in submitQuiz:', err?.response || err);
      setError('Something went wrong. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phq9-container" style={{ maxWidth: '700px', margin: '30px auto' }}>
      <h2>PHQ‑9 Depression Screening</h2>

      {phqQuestions.map((q, i) => (
        <div key={i} className="question-block" style={{ marginBottom: '12px' }}>
          <p>
            {i + 1}. {q}
          </p>
          <select
            value={answers[i]}
            onChange={(e) => handleAnswerChange(i, e.target.value)}
          >
            {options.map((opt, idx) => (
              <option key={idx} value={idx}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className="journal-block" style={{ marginTop: '20px' }}>
        <h3>Optional mood description (for AI analysis)</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write how you are feeling today..."
          rows={4}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <button
        onClick={submitQuiz}
        disabled={loading}
        style={{
          marginTop: '15px',
          background: '#667eea',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '20px',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        {loading ? 'Analyzing...' : 'Submit'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

      {score !== null && (
        <div className="results" style={{ marginTop: '20px' }}>
          <h3>PHQ‑9 Result</h3>
          <p>Score: {score}</p>
          <p>Risk level: {risk}</p>

          {sentiment && (
            <>
              <h3>AI Mood Analysis</h3>
              <p>Sentiment: {sentiment}</p>
              {confidence !== null && (
                <p>Confidence: {(confidence * 100).toFixed(1)}%</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Phq9Quiz;

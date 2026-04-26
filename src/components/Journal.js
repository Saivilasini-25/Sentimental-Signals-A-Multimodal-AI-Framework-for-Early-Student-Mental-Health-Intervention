// src/components/Journal.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MoodChart from './MoodChart';
import { saveJournalEntry, getLatestPhqResult } from '../services/firestoreService';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import CameraMood from './CameraMood';

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

function Journal({ onSentimentChange, user }) {
  const [text, setText] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('moodHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [latestPhq, setLatestPhq] = useState(null);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Load latest PHQ-9 for suggestions
  useEffect(() => {
    const fetchPhq = async () => {
      if (!user) {
        setLatestPhq(null);
        return;
      }
      try {
        const res = await getLatestPhqResult(user.uid);
        setLatestPhq(res);
      } catch (e) {
        console.error('Error loading latest PHQ-9 for Journal:', e);
      }
    };
    fetchPhq();
  }, [user]);

  const analyzeMood = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setSentiment(null);
    try {
      const res = await axios.post(`${API_BASE}/api/analyze-sentiment`, { text });

      setSentiment(res.data);
      if (onSentimentChange) onSentimentChange(res.data);

      const entry = {
        text,
        label: res.data.label,
        score: res.data.score,
        time: new Date().toLocaleString()
      };
      const newHistory = [entry, ...history].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem('moodHistory', JSON.stringify(newHistory));

      if (user && user.uid) {
        await saveJournalEntry(user.uid, text, res.data.label, res.data.score);
      }
    } catch (err) {
      console.error('Mood journal sentiment error:', err?.response || err);
      setSentiment({ label: 'Service unavailable', score: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleStartVoice = () => {
    if (!browserSupportsSpeechRecognition) {
      alert("Your browser doesn't support speech recognition. Try Chrome desktop.");
      return;
    }
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: true,
      language: 'en-US'
    });
  };

  const handleStopVoice = () => {
    SpeechRecognition.stopListening();
    if (transcript) {
      setText((prev) => (prev ? prev + ' ' + transcript : transcript));
      resetTranscript();
    }
  };

  const prettyLabel =
    sentiment?.label === 'POSITIVE'
      ? 'Positive 😊'
      : sentiment?.label === 'NEGATIVE'
      ? 'Negative 😞'
      : sentiment?.label;

  const aiSuggestion = () => {
    if (!sentiment && !latestPhq) return '';

    const phqScore = latestPhq?.score;
    let severity = latestPhq?.risk || '';

    // Fallback severity if risk string is not set but score exists
    if (!severity && typeof phqScore === 'number') {
      if (phqScore <= 4) severity = 'none/minimal';
      else if (phqScore <= 9) severity = 'mild';
      else if (phqScore <= 14) severity = 'moderate';
      else if (phqScore <= 19) severity = 'moderately severe';
      else severity = 'severe';
    }

    const label = sentiment?.label;
    if (!label) {
      return `Your latest PHQ‑9 score is ${phqScore ?? 'not available'} (${severity || 'no recent test'}). Consider using the Dashboard to track how things change over time.`;
    }

    if (label === 'NEGATIVE') {
      if (phqScore >= 15) {
        return 'You described a low mood, and your recent PHQ‑9 score is in a higher range. It could be a good time to reach out to a trusted person or a mental health professional, and review your Safety Plan if you made one.';
      }
      if (phqScore >= 10) {
        return 'Your writing sounds low today and your PHQ‑9 suggests at least moderate symptoms. Small steps like regular sleep, short walks, or breathing exercises can help, but support from a counselor or doctor may also be useful.';
      }
      return 'You sound down today. It might help to use a coping strategy from your Safety Plan, talk with someone you trust, or schedule another PHQ‑9 on a different day to see how things shift.';
    }

    if (label === 'POSITIVE') {
      return 'Your mood sounds more positive in this entry. Notice what helped today, and consider adding it to your list of coping strategies so you can return to it on harder days.';
    }

    // NEUTRAL or other
    return 'Your mood sounds more mixed or neutral. It can help to keep tracking for a few days and see if any patterns appear in your PHQ‑9 scores and journal entries.';
  };

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '700px',
        margin: '40px auto',
        fontFamily: 'Arial'
      }}
    >
      <h1 style={{ color: '#667eea' }}>📝 Mood Journal</h1>
      <p style={{ color: '#555' }}>
        Write or speak how you feel today. The AI will analyze your mood.
      </p>

      <textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Example: I feel stressed about exams but also excited..."
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          border: '1px solid #ccc'
        }}
      />
      <br />

      <div style={{ marginTop: '8px' }}>
        <button
          type="button"
          onClick={listening ? handleStopVoice : handleStartVoice}
          style={{
            marginRight: '10px',
            background: listening ? '#e53e3e' : '#3182ce',
            color: 'white',
            padding: '8px 18px',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {listening ? 'Stop Voice' : 'Speak Mood'}
        </button>
        {listening && <span style={{ color: '#555' }}>Listening...</span>}
      </div>

      <div style={{ marginTop: '10px' }}>
        <button
          onClick={analyzeMood}
          style={{
            background: '#764ba2',
            color: 'white',
            padding: '10px 25px',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Mood'}
        </button>

        <button
          type="button"
          onClick={() => setShowCamera((v) => !v)}
          style={{
            marginLeft: '10px',
            background: '#3182ce',
            color: 'white',
            padding: '8px 18px',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          {showCamera ? 'Hide Camera' : 'Camera Mood Check-in'}
        </button>
      </div>

      {showCamera && (
        <CameraMood
          user={user}
          onClose={() => setShowCamera(false)}
          lastSentimentLabel={sentiment?.label}
        />
      )}

      {sentiment && (
        <div
          style={{
            marginTop: '20px',
            padding: '15px',
            borderRadius: '10px',
            background: '#e8f4fd',
            borderLeft: '5px solid #667eea'
          }}
        >
          <h2>AI Result</h2>
          <p style={{ fontSize: '20px', fontWeight: 'bold' }}>{prettyLabel}</p>
          {sentiment.score !== undefined && (
            <p>Confidence: {(sentiment.score * 100).toFixed(1)}%</p>
          )}
        </div>
      )}

      {/* AI Suggestion box */}
      {aiSuggestion() && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            borderRadius: '10px',
            background: '#f0fff4',
            borderLeft: '5px solid #48bb78'
          }}
        >
          <h3>AI Suggestion (not medical advice)</h3>
          <p style={{ color: '#22543d' }}>{aiSuggestion()}</p>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h3>Recent Mood History</h3>
          <ul>
            {history.map((h, i) => (
              <li key={i}>
                [{h.time}] {h.label} ({(h.score * 100).toFixed(1)}%) –{' '}
                {h.text.slice(0, 40)}...
              </li>
            ))}
          </ul>
        </div>
      )}

      <MoodChart history={history} />
    </div>
  );
}

export default Journal;

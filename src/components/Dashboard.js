// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import {
  getLatestPhqResults,
  getMoodHistory,
  getCameraMoodHistory
} from '../services/firestoreService';
import MoodChart from './MoodChart';
import { Link } from 'react-router-dom'; // NEW

function Dashboard({ user }) {
  const [latestPhq, setLatestPhq] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const [cameraHistory, setCameraHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLatestPhq(null);
      setMoodHistory([]);
      setCameraHistory([]);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [phqResults, moods, camera] = await Promise.all([
          getLatestPhqResults(user.uid, 3),
          getMoodHistory(user.uid, 10),
          getCameraMoodHistory(user.uid, 10)
        ]);
        setLatestPhq(phqResults[0] || null);
        setMoodHistory(moods || []);
        setCameraHistory(camera || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const summarizeMood = () => {
    if (!moodHistory.length) return 'No mood entries yet.';
    const avgScore =
      moodHistory.reduce((sum, m) => sum + (m.score || 0), 0) / moodHistory.length;
    if (avgScore > 0.6) return 'Recent moods are mostly positive.';
    if (avgScore < 0.4) return 'Recent moods are mostly negative or low.';
    return 'Recent moods are mixed / neutral.';
  };

  const cameraSummary = () => {
    if (!cameraHistory.length) return 'No camera check-ins yet.';
    const last = cameraHistory[0];
    const lastTime = last.createdAt
      ? new Date(last.createdAt).toLocaleString()
      : 'Unknown time';
    const count = cameraHistory.length;
    return `Last ${count} check-ins. Most recent at ${lastTime}.`;
  };

  const weekSummaryText = () => {
    if (!latestPhq && !moodHistory.length && !cameraHistory.length) {
      return 'Start by taking a PHQ‑9 test, writing a journal entry, or doing a camera mood check‑in.';
    }

    const moodSentence = summarizeMood();
    const phqSentence = latestPhq
      ? `Your latest PHQ‑9 score is ${latestPhq.score} (${latestPhq.risk}).`
      : 'No PHQ‑9 tests yet.';
    const cameraCount = cameraHistory.length;
    const cameraSentence =
      cameraCount > 0
        ? `You used camera mood check‑ins ${cameraCount} time(s) recently.`
        : 'You have not used camera mood check‑ins yet.';

    return `${phqSentence} ${moodSentence} ${cameraSentence}`;
  };

  return (
    <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 16px' }}>
      <h1 style={{ color: '#667eea', marginBottom: '10px' }}>Welcome to your Dashboard</h1>
      {!user && (
        <p style={{ color: '#555' }}>
          Please log in to see your PHQ‑9 history and mood analytics.
        </p>
      )}

      {loading && <p>Loading your data...</p>}

      {!loading && user && (
        <>
          {/* Week summary card */}
          <div
            style={{
              marginTop: '16px',
              marginBottom: '10px',
              padding: '16px',
              borderRadius: '12px',
              background: '#f0fff4',
              borderLeft: '5px solid #48bb78',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
          >
            <h2>Recent Wellbeing Summary</h2>
            <p style={{ color: '#2f855a' }}>{weekSummaryText()}</p>
            <p style={{ fontSize: '13px', color: '#555' }}>
              This summary combines your PHQ‑9 results, journal mood, and camera check‑ins to
              give a gentle overview. It is for self‑reflection and does not replace professional help.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              marginTop: '8px'
            }}
          >
            {/* PHQ‑9 summary card */}
            <div
              style={{
                flex: '1 1 260px',
                background: '#edf2ff',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
              }}
            >
              <h2>Latest PHQ‑9</h2>
              {latestPhq ? (
                <>
                  <p>
                    Score: <strong>{latestPhq.score}</strong>
                  </p>
                  <p>Risk: {latestPhq.risk}</p>
                  <p>
                    Date:{' '}
                    {latestPhq.createdAt
                      ? new Date(latestPhq.createdAt).toLocaleString()
                      : 'Unknown'}
                  </p>
                </>
              ) : (
                <p>No PHQ‑9 test found. Try taking the test from the PHQ‑9 page.</p>
              )}
            </div>

            {/* Mood summary card */}
            <div
              style={{
                flex: '1 1 260px',
                background: '#e6fffa',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
              }}
            >
              <h2>Recent Mood Summary</h2>
              <p>{summarizeMood()}</p>
              <p>Total journal entries: {moodHistory.length}</p>
              {moodHistory[0] && (
                <p>
                  Last entry:{' '}
                  {moodHistory[0].label} (
                  {moodHistory[0].score
                    ? (moodHistory[0].score * 100).toFixed(1)
                    : 0}
                  %)
                </p>
              )}
            </div>

            {/* Camera check-ins card */}
            <div
              style={{
                flex: '1 1 260px',
                background: '#fffaf0',
                borderRadius: '12px',
                padding: '16px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
              }}
            >
              <h2>Camera Mood Check-ins</h2>
              <p>{cameraSummary()}</p>
              <p style={{ fontSize: '13px', color: '#777' }}>
                Camera mood check-ins are a quick pause to notice how you feel. 
                They support your PHQ‑9 scores and journal entries, but do not diagnose your mood.
              </p>
            </div>
          </div>

          {/* NEW: Self-assessment tools links */}
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              borderRadius: '12px',
              background: '#f7fafc',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
            }}
          >
            <h2>Self-Assessment Tools</h2>
            <p style={{ color: '#555', fontSize: '14px' }}>
              These brief questionnaires are for self-awareness and early warning only. 
              They do not provide a diagnosis or replace professional evaluation.
            </p>
            <ul>
              <li><Link to="/phq9">PHQ-9 – Depression screening</Link></li>
              <li><Link to="/screening?type=GAD7">GAD-7 – Anxiety screening</Link></li>
              <li><Link to="/screening?type=PCL5">PCL-5 – PTSD symptoms (short)</Link></li>
              <li><Link to="/screening?type=MDQ">MDQ – Mood disorder (bipolar) screening</Link></li>
              <li><Link to="/screening?type=AUDIT">AUDIT – Alcohol use screening</Link></li>
            </ul>
          </div>

          {/* Mood chart */}
          <div style={{ marginTop: '24px' }}>
            <h2>Mood over time</h2>
            <p style={{ color: '#555' }}>
              This chart uses your last few journal entries to visualize mood trends.
            </p>
            <MoodChart history={moodHistory} />
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;

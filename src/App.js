// src/App.js
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';

import Dashboard from './components/Dashboard';
import Journal from './components/Journal';
import Phq9Quiz from './components/PHQ9Quiz';
import AuthForm from './components/AuthForm';
import SafetyPlan from './components/SafetyPlan';

// NEW: import the screening page
import ScreeningQuestionnaire from './pages/ScreeningQuestionnaire';

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSentimentChangeFromJournal = (data) => {
    console.log('Latest sentiment from Journal:', data);
  };

  if (!authChecked) {
    return <p style={{ padding: '20px' }}>Loading...</p>;
  }

  return (
    <Router>
      <div>
        <nav
          style={{
            padding: '10px 20px',
            background: '#667eea',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <Link to="/dashboard" style={{ color: 'white', marginRight: '15px' }}>
              Dashboard
            </Link>
            <Link to="/phq9" style={{ color: 'white', marginRight: '15px' }}>
              PHQ‑9 Test
            </Link>
            <Link to="/journal" style={{ color: 'white', marginRight: '15px' }}>
              Mood Journal
            </Link>
            <Link to="/safety" style={{ color: 'white', marginRight: '15px' }}>
              Safety Plan
            </Link>
            {/* NEW: Screening menu (GAD-7, PCL-5, MDQ, AUDIT) */}
            <Link to="/screening?type=GAD7" style={{ color: 'white', marginRight: '15px' }}>
              Screening
            </Link>
          </div>
          <div>
            {user ? (
              <>
                <span style={{ marginRight: '10px' }}>{user.email}</span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: '#4c51bf',
                    color: 'white',
                    border: 'none',
                    padding: '5px 12px',
                    borderRadius: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link to="/auth" style={{ color: 'white' }}>
                Login / Sign up
              </Link>
            )}
          </div>
        </nav>

        <Routes>
          {/* Auth route */}
          <Route
            path="/auth"
            element={user ? <Navigate to="/dashboard" /> : <AuthForm />}
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={user ? <Dashboard user={user} /> : <Navigate to="/auth" />}
          />

          <Route
            path="/phq9"
            element={user ? <Phq9Quiz user={user} /> : <Navigate to="/auth" />}
          />

          <Route
            path="/journal"
            element={
              user ? (
                <Journal
                  user={user}
                  onSentimentChange={handleSentimentChangeFromJournal}
                />
              ) : (
                <Navigate to="/auth" />
              )
            }
          />

          <Route
            path="/safety"
            element={user ? <SafetyPlan user={user} /> : <Navigate to="/auth" />}
          />

          {/* NEW: Screening route (GAD-7, PCL-5, MDQ, AUDIT via ?type=) */}
          <Route
            path="/screening"
            element={user ? <ScreeningQuestionnaire /> : <Navigate to="/auth" />}
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

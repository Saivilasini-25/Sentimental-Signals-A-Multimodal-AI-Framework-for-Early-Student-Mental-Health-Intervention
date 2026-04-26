// src/components/CameraMood.js
import React, { useEffect, useRef, useState } from 'react';
import { saveCameraMoodSnapshot } from '../services/firestoreService';

function CameraMood({ user, onClose, lastSentimentLabel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [cameraMoodText, setCameraMoodText] = useState('');
  const [cameraMoodEmoji, setCameraMoodEmoji] = useState('');

  useEffect(() => {
    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera not supported in this browser/device.');
        return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error('Camera error:', e);
        setError('Unable to access camera. Please check permissions.');
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const deriveCameraMood = () => {
    if (lastSentimentLabel === 'POSITIVE') {
      return {
        text: 'Camera mood: this moment feels a bit more positive.',
        emoji: '🙂'
      };
    }
    if (lastSentimentLabel === 'NEGATIVE') {
      return {
        text: 'Camera mood: this check-in feels heavier or low-energy.',
        emoji: '😞'
      };
    }
    if (lastSentimentLabel === 'NEUTRAL') {
      return {
        text: 'Camera mood: this moment looks more neutral or mixed.',
        emoji: '😐'
      };
    }
    return {
      text: 'Camera mood: check-in recorded. Keep noticing how you feel.',
      emoji: '🕊️'
    };
  };

  const handleCapture = async () => {
    if (!user) {
      setStatus('You must be logged in to save a camera check-in.');
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      const mood = deriveCameraMood();
      setCameraMoodText(mood.text);
      setCameraMoodEmoji(mood.emoji);

      await saveCameraMoodSnapshot(user.uid, {
        note: 'Camera mood check-in',
        label: lastSentimentLabel || 'UNKNOWN',
        moodText: mood.text
      });

      setStatus('Camera mood check-in saved.');
    } catch (e) {
      console.error('Error saving camera mood:', e);
      setStatus('Error saving camera mood. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: '12px',
        padding: '16px',
        marginTop: '16px',
        maxWidth: '480px'
      }}
    >
      <h3>Camera Mood Check-in</h3>
      <p style={{ color: '#555' }}>
        Use your camera to do a quick check-in. This AI uses your latest journal mood as a helper signal, not facial analysis.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            maxWidth: '400px',
            borderRadius: '8px',
            background: '#000'
          }}
        />
        <button
          type="button"
          onClick={handleCapture}
          disabled={saving || !!error}
          style={{
            marginTop: '10px',
            padding: '8px 18px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            cursor: 'pointer'
          }}
        >
          {saving ? 'Saving...' : 'Capture Mood'}
        </button>
        {status && <p style={{ marginTop: '8px', color: '#555' }}>{status}</p>}

        {cameraMoodText && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px 10px',
              borderRadius: '10px',
              background: '#f0fff4',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '22px' }}>{cameraMoodEmoji}</div>
            <p style={{ margin: 0 }}>{cameraMoodText}</p>
            <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
              Based on your latest journal mood; this is an AI estimate for reflection only.
            </p>
          </div>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              marginTop: '6px',
              padding: '4px 10px',
              background: '#e2e8f0',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}

export default CameraMood;

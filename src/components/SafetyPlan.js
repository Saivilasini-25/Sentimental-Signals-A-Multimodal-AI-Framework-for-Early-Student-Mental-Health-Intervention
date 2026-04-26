// src/components/SafetyPlan.js
import React, { useEffect, useState } from 'react';
import { saveSafetyPlan, getSafetyPlan } from '../services/firestoreService';

function SafetyPlan({ user }) {
  const [warningSigns, setWarningSigns] = useState('');
  const [copingStrategies, setCopingStrategies] = useState('');
  const [peopleToCall, setPeopleToCall] = useState('');
  const [professionalHelp, setProfessionalHelp] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const plan = await getSafetyPlan(user.uid);
        if (plan) {
          setWarningSigns(plan.warningSigns || '');
          setCopingStrategies(plan.copingStrategies || '');
          setPeopleToCall(plan.peopleToCall || '');
          setProfessionalHelp(plan.professionalHelp || '');
        }
      } catch (e) {
        console.error('Error loading safety plan:', e);
      }
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setStatus('');
    try {
      await saveSafetyPlan(user.uid, {
        warningSigns,
        copingStrategies,
        peopleToCall,
        professionalHelp
      });
      setStatus('Safety plan saved.');
    } catch (e) {
      console.error('Error saving safety plan:', e);
      setStatus('Error saving plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '30px auto', padding: '0 16px' }}>
      <h1 style={{ color: '#e53e3e', marginBottom: '10px' }}>Safety Plan</h1>
      <p style={{ color: '#555' }}>
        This page helps you prepare a personal plan to stay safe during a crisis. 
        It does not replace emergency services or professional care.
      </p>

      <div
        style={{
          marginTop: '16px',
          padding: '12px',
          borderRadius: '8px',
          background: '#fff5f5',
          border: '1px solid #fed7d7'
        }}
      >
        <strong>If you are in immediate danger, call your local emergency number right away.</strong>
        <p style={{ marginTop: '6px' }}>
          India (Suicide prevention helpline examples): KIRAN (toll‑free mental health helpline),
          local crisis lines, or nearby hospital emergency department. 
          You can also search for updated helplines via trusted sources like government or WHO sites. [web:273][web:275]
        </p>
      </div>

      <section style={{ marginTop: '20px' }}>
        <h2>1. My warning signs</h2>
        <p style={{ color: '#555' }}>
          Thoughts, feelings, body sensations, or situations that tell me I am starting to struggle.
        </p>
        <textarea
          rows={3}
          value={warningSigns}
          onChange={(e) => setWarningSigns(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>2. My coping strategies</h2>
        <p style={{ color: '#555' }}>
          Things I can do on my own to calm or distract myself.
        </p>
        <textarea
          rows={3}
          value={copingStrategies}
          onChange={(e) => setCopingStrategies(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>3. People I can contact</h2>
        <p style={{ color: '#555' }}>
          Friends, family, or others I can talk to when I feel unsafe.
        </p>
        <textarea
          rows={3}
          value={peopleToCall}
          onChange={(e) => setPeopleToCall(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>4. Professional and crisis support</h2>
        <p style={{ color: '#555' }}>
          Mental health professionals, helplines, or services I can reach out to.
        </p>
        <textarea
          rows={3}
          value={professionalHelp}
          onChange={(e) => setProfessionalHelp(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '20px',
          cursor: 'pointer'
        }}
      >
        {saving ? 'Saving...' : 'Save Safety Plan'}
      </button>

      {status && <p style={{ marginTop: '10px', color: '#555' }}>{status}</p>}
    </div>
  );
}

export default SafetyPlan;

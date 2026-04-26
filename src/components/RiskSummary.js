import React from 'react';

function RiskSummary({ phqRisk, latestSentiment }) {
  let overall = 'Low';
  let message = 'You currently appear at low mental health risk. Keep maintaining healthy routines.';

  if (phqRisk === 'Moderate' || phqRisk === 'Severe') {
    overall = 'High';
    message = 'Your answers suggest higher risk. Consider talking to a professional or someone you trust.';
  }

  if (latestSentiment && latestSentiment.label === 'NEGATIVE' && latestSentiment.score > 0.7) {
    if (overall === 'Low') {
      overall = 'Medium';
      message = 'Recent mood seems negative. Keep an eye on how you feel and seek support if it continues.';
    }
  }

  return (
    <div
      style={{
        margin: '20px 0',
        padding: '15px',
        borderRadius: '12px',
        background: '#fef3c7',
        borderLeft: '6px solid #f59e0b'
      }}
    >
      <h2>Overall Risk Summary: {overall}</h2>
      <p>{message}</p>
      <small>This is not a diagnosis. For urgent help, contact a mental health professional or helpline.</small>
    </div>
  );
}

export default RiskSummary;

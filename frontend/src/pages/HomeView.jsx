import React from 'react';

export default function HomeView({ onLaunch, setView }) {
  return (
    <div className="home-container">
      <div className="hero-section full-width-hero">
        <div className="hero-text-block">
          <div className="clinical-tag">Next-Gen Dermoscopy Framework</div>
          <h1>Advanced Deep Learning Analysis for <span>Lesion Classification</span></h1>
          <p>Streamlining clinical analysis workflows. Securely upload dermatological high-fidelity imagery to execute objective computational checks against validated neural metrics.</p>
          <div className="hero-button-group">
            <button className="primary-action-btn" onClick={onLaunch}>Initialize Analysis Engine</button>
            <button className="secondary-action-btn" onClick={() => setView('education')}>Review Evaluation Criteria</button>
          </div>
        </div>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <span className="feature-icon">🛡️</span>
          <h3>Objective Pre-Screening</h3>
          <p>Provides data-driven triage indicators to optimize surgical or biopsy prioritization workflows.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">📈</span>
          <h3>Automated Case Records</h3>
          <p>Securely aggregates and traces structural evaluations over time, keeping patient logs centralized for clinical reviews.</p>
        </div>
        <div className="feature-card">
          <span className="feature-icon">⚡</span>
          <h3>Sub-Second Inference</h3>
          <p>Utilizes dedicated sidecar application clusters to resolve spatial matrix probabilities almost instantly.</p>
        </div>
      </div>
    </div>
  );
}
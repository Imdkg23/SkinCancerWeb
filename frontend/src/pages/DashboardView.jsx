import React, { useState, useEffect } from 'react';

export default function DashboardView({ user, API_URL }) {
  const [patientName, setPatientName] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchLogs = () => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/history`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setHistory(data));
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleAnalyze = async () => {
    if (!file || !patientName.trim()) return;
    setAnalyzing(true);
    const formData = new FormData(); 
    formData.append('file', file); 
    formData.append('patient_name', patientName.trim());

    try {
      const res = await fetch(`${API_URL}/predict`, { 
        method: 'POST', 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }, 
        body: formData 
      });
      const data = await res.json();
      if (res.ok) { 
        setResult(data); 
        fetchLogs(); 
      } else { 
        alert('Analysis Error: ' + data.error); 
      }
    } catch (err) { 
      alert('Diagnostic connection loss.'); 
    } finally { 
      setAnalyzing(false); 
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to purge this specific diagnostic record?")) return;
    setHistory(history.filter(item => item.id !== itemId));
    try {
      await fetch(`${API_URL}/history/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.error("Purge failure:", err);
      fetchLogs();
    }
  };

  const handleClearAllHistory = async () => {
    if (!window.confirm("CRITICAL WARNING: You are permanently deleting ALL record history logs. Proceed?")) return;
    setHistory([]);
    try {
      await fetch(`${API_URL}/history`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (err) {
      console.error("Ledger wipe failure:", err);
      fetchLogs();
    }
  };

  const radius = 45; 
  const circumference = radius * 2 * Math.PI;
  const pct = result ? result.confidence * 100 : 0;
  const offset = circumference - (pct / 100) * circumference;
  const isMalignant = result?.prediction === 'Malignant';
  const color = isMalignant ? '#dc2626' : '#16a34a';

  return (
    <div className="dashboard-layout-container">
      <div className="workspace-main-panel">
        <div className="clinical-card">
          <div className="card-header-title">📋 Run Diagnostic Evaluation</div>
          
          <div className="form-input-block">
            <label>Patient Full Name / Identifier Token</label>
            <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} required placeholder="e.g. Anonymous Patient Case #84B" />
          </div>
          
          <div className="upload-drop-zone" onClick={() => document.getElementById('file-el').click()}>
            {!previewUrl ? (
              <div className="upload-prompt">
                <span className="upload-icon">📷</span>
                <p>Click to browse dermatoscopic lesion scan file</p>
                <span className="file-restriction-text">Supports secure medical JPG, PNG, and TIFF formats</span>
              </div>
            ) : (
              <div className="preview-container">
                {/* 🔎 RESTORED: The uploaded patient skin image renders dynamically here */}
                <img id="preview" src={previewUrl} alt="Patient skin lesion preview target" />
                <div className="file-metadata-tag">{file?.name}</div>
              </div>
            )}
            <input type="file" id="file-el" style={{ display: 'none' }} accept="image/*" onChange={(e) => { if(e.target.files.length) { setFile(e.target.files[0]); setPreviewUrl(URL.createObjectURL(e.target.files[0])); } }} />
          </div>
          
          <button className="primary-action-btn run-analysis-btn" disabled={analyzing || !file || !patientName.trim()} onClick={handleAnalyze}>
            {analyzing ? 'Processing Spatial Matrices...' : 'Run Diagnostics Analysis'}
          </button>

          {result && (
            <div className="clinical-results-box">
              <div className="results-metadata">
                <div className="case-subject-title">Subject Case: {result.patient}</div>
                <span className="evaluation-metric-label">Assessment Result</span>
                <div className="evaluation-output-class" style={{ color }}>
                  {result.prediction} {isMalignant ? '⚠️' : '✅'}
                </div>
              </div>
              <div className="gauge-circular-wrapper">
                <svg width="110" height="110" className="progress-ring-circle">
                  <circle stroke="var(--border-subtle)" strokeWidth="8" fill="transparent" r={radius} cx="55" cy="55"/>
                  <circle className="animated-ring-path" stroke={color} strokeWidth="8" fill="transparent" r={radius} cx="55" cy="55" style={{ strokeDasharray: `${circumference} ${circumference}`, strokeDashoffset: offset }} />
                </svg>
                <div className="gauge-percentage-text">{pct.toFixed(1)}%</div>
                <div className="gauge-confidence-subtext">Confidence</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="workspace-sidebar-panel">
        <div className="clinical-card ledger-card">
          <div className="ledger-header-row">
            <div className="card-header-title">📑 Case History Ledger</div>
            {history.length > 0 && (
              <button className="purge-all-btn" onClick={handleClearAllHistory}>Clear All Logs</button>
            )}
          </div>
          <ul className="history-list-element">
            {history.length === 0 ? (
              <li className="empty-ledger-notice">No case records registered to this account.</li>
            ) : (
              history.map(item => (
                <li className="history-case-row-item" key={item.id}>
                  <div className="history-case-meta">
                    <strong>{item.patient}</strong>
                    <div className="history-case-timestamp">
                      {new Date(item.timestamp).toLocaleDateString()} at {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="history-case-confidence">Accuracy Matrix: {(item.confidence*100).toFixed(1)}%</div>
                  </div>
                  <div className="history-case-actions">
                    <span className={`clinical-badge ${item.prediction === 'Malignant' ? 'badge-malig' : 'badge-ben'}`}>{item.prediction}</span>
                    <button className="individual-delete-btn" title="Purge Record" onClick={() => handleDeleteItem(item.id)}>🗑️</button>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
import React from 'react';

export default function Navbar({ view, setView, user, handleLogout, setTheme, theme }) {
  return (
    <header className="site-header">
      <div className="navbar">
        <button className="logo-brand" onClick={() => setView('home')}>
          <span className="brand-icon">🔬</span> DermSight <span className="brand-accent">Clinical</span>
        </button>
        <ul className="nav-links">
          <li><button className={`nav-link-btn ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>Overview</button></li>
          <li><button className={`nav-link-btn ${view === 'education' ? 'active' : ''}`} onClick={() => setView('education')}>Clinical Resources</button></li>
          <li><button className={`nav-link-btn ${view === 'dashboard' ? 'active' : ''}`} onClick={() => user ? setView('dashboard') : setView('login')}>Analysis Workspace</button></li>
          <li><button className="utility-theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '🌙 Night Mode' : '☀️ Day Mode'}</button></li>
          {user ? (
            <>
              <li className="medical-profile-badge">
                {/* 👤 Profile picture restored dynamically from the Google user object */}
                <img 
                  className="clinical-avatar" 
                  src={user.profilePic || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100'} 
                  alt="Practitioner Avatar" 
                />
                <span className="practitioner-name">{user.name}</span>
              </li>
              <li><button className="auth-action-btn exit-btn" onClick={handleLogout}>Exit Portal</button></li>
            </>
          ) : (
            <li><button className="auth-action-btn enter-btn" onClick={() => setView('login')}>Provider Login</button></li>
          )}
        </ul>
      </div>
    </header>
  );
}
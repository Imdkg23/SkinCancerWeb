import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './pages/HomeView';
import EducationView from './pages/EducationView';
import LoginView from './pages/LoginView';
import DashboardView from './pages/DashboardView';

const API_URL = 'https://skincancerweb.onrender.com';
const GOOGLE_CLIENT_ID = '834381178930-sjeutp47at4qkfim5rnba1qsim5udoss.apps.googleusercontent.com';

export default function App() {
  const [view, setView] = useState('home');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setAuthLoading(false); return; }
    
    fetch(`${API_URL}/auth/me`, { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => { if (data.authenticated) setUser(data.user); })
      .catch(() => { localStorage.removeItem('token'); setUser(null); })
      .finally(() => setAuthLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('home');
  };

  if (authLoading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="app-container">
      {/* Navbar stays fully visible across all application layout frames */}
      <Navbar 
        view={view} 
        setView={setView} 
        user={user} 
        handleLogout={handleLogout} 
        setTheme={setTheme} 
        theme={theme} 
      />

      <main className="main-content-wrapper">
        {view === 'home' && <HomeView onLaunch={() => user ? setView('dashboard') : setView('login')} setView={setView} />}
        {view === 'education' && <EducationView />}
        {view === 'login' && <LoginView onAuthSuccess={(u) => { setUser(u); setView('dashboard'); }} API_URL={API_URL} GOOGLE_CLIENT_ID={GOOGLE_CLIENT_ID} />}
        {view === 'dashboard' && <DashboardView user={user} API_URL={API_URL} />}
      </main>

      <footer className="site-footer">
        <div className="footer-content">
          <div>&copy; 2026 DermSight Medical Systems. Certified Clinical Assessment Framework.</div>
          <div className="footer-disclaimer">Protected Healthcare Information Pipeline. Confidential Medical Use Only.</div>
        </div>
      </footer>
    </div>
  );
}
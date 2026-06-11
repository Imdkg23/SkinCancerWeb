import React, { useState, useEffect, useRef } from 'react';

export default function LoginView({ onAuthSuccess, API_URL, GOOGLE_CLIENT_ID }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const googleBtnRef = useRef(null);

  useEffect(() => {
    const initGoogleAuth = () => {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCallback
          });
          window.google.accounts.id.renderButton(googleBtnRef.current, { 
            type: 'standard', 
            size: 'large', 
            width: '340' 
          });
        }
      } catch (e) {
        console.error("Identity component mount failure:", e);
      }
    };

    if (!document.getElementById('google-sdk-script')) {
      const script = document.createElement('script'); 
      script.id = 'google-sdk-script';
      script.src = 'https://accounts.google.com/gsi/client'; 
      script.async = true; 
      script.defer = true;
      script.onload = () => initGoogleAuth(); 
      document.head.appendChild(script);
    } else {
      const timer = setTimeout(() => initGoogleAuth(), 100);
      return () => clearTimeout(timer);
    }
  }, [isRegister]);

  const handleGoogleCallback = async (response) => {
    try {
      const res = await fetch(`${API_URL}/auth/google`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ token: response.credential }) 
      });

      if (!res.ok) {
        const errorText = await res.text();
        setError(`Verification Failure: ${errorText.substring(0, 50)}`);
        return;
      }

      const data = await res.json();
      if (data.token) { 
        localStorage.setItem('token', data.token); 
        onAuthSuccess(data.user); 
      }
    } catch (err) { 
      setError(`Network Handshake Exception: ${err.message}`); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    const endpoint = isRegister ? '/auth/register' : '/auth/login';
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, name, password }) 
      });
      const data = await res.json();
      if (res.ok && data.token) { 
        localStorage.setItem('token', data.token); 
        onAuthSuccess(data.user); 
      } else { 
        setError(data.error || 'Identity access error.'); 
      }
    } catch (err) { 
      setError('The authentication service is currently unreachable.'); 
    }
  };

  return (
    <div className="login-wrapper-panel">
      <div className="medical-form-card">
        <h2>{isRegister ? 'Register Practitioner Account' : 'Clinical Access Portal'}</h2>
        <p className="form-subtitle">Authorized Medical and Investigative Personnel Only</p>
        
        {error && <div className="clinical-error-alert">{error}</div>}
        <div className="google-auth-node" ref={googleBtnRef}></div>
        <div className="form-divider"><span>OR CONTINUE WITH CREDENTIALS</span></div>
        
        <form onSubmit={handleSubmit}>
          {isRegister && <div className="form-input-block"><label>Full Legal Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Dr. John Doe" /></div>}
          <div className="form-input-block"><label>Institutional Email Address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@institution.org" /></div>
          <div className="form-input-block"><label>Secure Access Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" /></div>
          <button type="submit" className="form-submit-btn">{isRegister ? 'Complete Registration' : 'Authenticate Credentials'}</button>
        </form>
        
        <button className="form-view-toggle-btn" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? 'Already registered? Sign In' : 'Need institutional access? Request account here'}
        </button>
      </div>
    </div>
  );
}
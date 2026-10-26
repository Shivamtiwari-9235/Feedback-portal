import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/auth';
import FeedbackForm from './components/FeedbackForm';
import FeedbackList from './components/FeedbackList';
import './App.css';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) setAuthError('Your session could not be restored. Please sign in again.');
      setSession(data.session);
      setLoading(false);
    };

    loadSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthError('');
      setLoading(false);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError('Unable to sign out. Please check your connection and try again.');
  };

  const handleSubmitted = () => {
    setRefreshToken((token) => token + 1);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" aria-hidden="true"></div>
        <p>Loading Feedback Portal...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <a className="brand" href="/" aria-label="Feedback Portal home">
          <span className="brand-mark">F</span>
          <span>Feedback Portal</span>
        </a>
        {session && (
          <div className="header-user">
            <span className="user-email">{session.user.email}</span>
            <button type="button" onClick={handleLogout} className="btn btn-logout">Log out</button>
          </div>
        )}
      </header>

      {authError && <div className="global-alert alert alert-error" role="alert">{authError}</div>}

      <main className="main-content">
        {!session ? (
          <div className="hero-section">
            <div className="hero-text">
              <p className="eyebrow">A better way to be heard</p>
              <h1>Your voice shapes what we build next.</h1>
              <p>Share thoughtful feedback, track your submissions, and help us improve the experience for everyone.</p>
              <div className="trust-row"><span>✓ Private by default</span><span>✓ Secure sign-in</span></div>
            </div>
            <Auth />
          </div>
        ) : (
          <div className="dashboard">
            <div className="dashboard-intro">
              <p className="eyebrow">Welcome back</p>
              <h1>What would you like to tell us?</h1>
              <p>Your feedback is securely linked to your account.</p>
            </div>
            <div className="dashboard-grid">
              <FeedbackForm userId={session.user.id} onSubmitted={handleSubmitted} />
              <FeedbackList
                userId={session.user.id}
                refreshToken={refreshToken}
              />
            </div>
          </div>
        )}
      </main>
      <footer className="app-footer">Feedback Portal · Your feedback stays yours.</footer>
    </div>
  );
}

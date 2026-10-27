import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import Auth from './components/Auth';
import FeedbackForm from './components/FeedbackForm';
import FeedbackList from './components/FeedbackList';
import ProtectedRoute from './components/ProtectedRoute';
import ReviewerDashboard from './components/ReviewerDashboard';
import './App.css';

function getPath() {
  return window.location.hash === '#/reviewer' ? 'reviewer' : 'home';
}

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [path, setPath] = useState(getPath);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
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
      setRole(null);
      setAuthError('');
      setLoading(false);
    });
    const onHashChange = () => setPath(getPath());
    window.addEventListener('hashchange', onHashChange);
    return () => {
      active = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  useEffect(() => {
    if (!session) {
      return;
    }
    let active = true;
    const loadingTimer = window.setTimeout(() => setRoleLoading(true), 0);
    supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError('We could not verify your account access. Please try again.');
      setRole(data?.role || 'user');
      setRoleLoading(false);
    });
    return () => {     active = false;
    window.clearTimeout(loadingTimer); };
  }, [session]);

  if (!isSupabaseConfigured) {
    return <div className="app-container"><header className="app-header"><a className="brand" href="#/"> <span className="brand-mark">F</span><span>Feedback Portal</span></a></header><main className="main-content"><section className="panel setup-panel" role="alert"><p className="eyebrow">Configuration required</p><h1>Feedback Portal is not configured yet.</h1><p className="panel-copy">Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the deployment environment, then redeploy.</p></section></main></div>;
  }

  const handleLogout = async () => {
    setAuthError('');
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError('Unable to sign out. Check your connection and try again.');
  };

  if (loading) return <div className="loading-screen"><div className="spinner" aria-hidden="true"></div><p>Loading Feedback Portal...</p></div>;

  return (
    <div className="app-container">
      <header className="app-header">
        <a className="brand" href="#/" aria-label="Feedback Portal home"><span className="brand-mark">F</span><span>Feedback Portal</span></a>
        {session && <nav className="header-nav" aria-label="Main navigation"><a href="#/">My feedback</a>{role === 'reviewer' && <a href="#/reviewer">Reviewer dashboard</a>}<button type="button" onClick={handleLogout} className="btn btn-logout">Log out</button></nav>}
      </header>
      {authError && <div className="global-alert alert alert-error" role="alert">{authError}</div>}
      <main className="main-content">
        {!session ? <div className="hero-section"><div className="hero-text"><p className="eyebrow">A better way to be heard</p><h1>Your voice shapes what we build next.</h1><p>Share thoughtful feedback, track your submissions, and help us improve the experience for everyone.</p><div className="trust-row"><span>✓ Private by default</span><span>✓ Secure sign-in</span></div></div><Auth /></div> : path === 'reviewer' ? <ProtectedRoute allowed={role === 'reviewer'} loading={roleLoading || role === null}><ReviewerDashboard /></ProtectedRoute> : <div className="dashboard"><div className="dashboard-intro"><p className="eyebrow">Welcome back{session.user.email ? `, ${session.user.email}` : ''}</p><h1>What would you like to tell us?</h1><p>Your feedback is securely linked to your account.</p></div><div className="dashboard-grid"><FeedbackForm userId={session.user.id} onSubmitted={() => setRefreshToken((token) => token + 1)} /><FeedbackList userId={session.user.id} refreshToken={refreshToken} /></div></div>}
      </main>
      <footer className="app-footer">Feedback Portal · Your feedback stays yours.</footer>
    </div>
  );
}

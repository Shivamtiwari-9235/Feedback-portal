import { useState } from 'react';
import { supabase } from '../supabaseClient';

function getAuthMessage(error) {
  if (!error) return 'Something went wrong. Please try again.';
  if (error.message?.toLowerCase().includes('invalid login')) {
    return 'The email or password is incorrect.';
  }
  if (error.message?.toLowerCase().includes('already registered')) {
    return 'An account with this email already exists. Try signing in.';
  }
  return 'We could not complete that request. Check your connection and try again.';
}

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAuth = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setErrorMessage('Enter your email address and password.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Your password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (!data.session) {
          setSuccessMessage('Account created. Check your email to confirm your account, then sign in.');
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setErrorMessage(getAuthMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>{isSignUp ? 'Create your account' : 'Sign in to continue'}</h2>
      <p className="auth-subtitle">
        {isSignUp ? 'Create a secure account to share and track feedback.' : 'Your feedback stays connected to your account.'}
      </p>
      {errorMessage && <div className="alert alert-error" role="alert">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success" role="status">{successMessage}</div>}
      <form onSubmit={handleAuth} noValidate>
        <div className="form-group">
          <label htmlFor="auth-email">Email address</label>
          <input id="auth-email" type="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={loading} autoComplete="email" />
        </div>
        <div className="form-group">
          <label htmlFor="auth-password">Password</label>
          <input id="auth-password" type="password" placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading} autoComplete={isSignUp ? 'new-password' : 'current-password'} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading && <span className="button-spinner spinner small" aria-hidden="true"></span>}
          {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
        </button>
      </form>
      <div className="auth-toggle">
        {isSignUp ? 'Already have an account? ' : 'New here? '}
        <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setSuccessMessage(''); }} className="btn-link">
          {isSignUp ? 'Sign in' : 'Create an account'}
        </button>
      </div>
    </div>
  );
}

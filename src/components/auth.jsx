import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

  
    if (!email.trim() || !password.trim()) {
      setErrorMessage('please fill email and password fields!');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('password must be at least 6 characters long!');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;
        setSuccessMessage('Account created successfully! You can now log in.');
        setIsSignUp(false);
      } else {
        
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) throw error;
        
      }
    } catch (error) {
      
      setErrorMessage(error.message || 'something went wrong! Please try again.');
    } finally {
      
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>{isSignUp ? 'Create Account (Sign Up)' : 'लॉगिन करें (Sign In)'}</h2>
      <p className="auth-subtitle">
        {isSignUp
          ? 'register for a new account to submit feedback'
          : 'submit your feedback securely and track your previous submissions'}
      </p>

      
      {errorMessage && <div className="alert alert-error" role="alert">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success" role="status">{successMessage}</div>}

      <form onSubmit={handleAuth}>
        <div className="form-group">
          <label htmlFor="auth-email">Email Address</label>
          <input
            id="auth-email"
            type="email"
            placeholder="apna-email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Please wait..." : isSignUp ? 'Sign Up करें' : 'Login करें'}
        </button>
      </form>

      <div className="auth-toggle">
        {isSignUp ? (
          <p>
            account already exists?{' '}
            <button type="button" onClick={() => setIsSignUp(false)} className="btn-link">
              login here
            </button>
          </p>
        ) : (
          <p>
            don't have an account?{' '}
            <button type="button" onClick={() => setIsSignUp(true)} className="btn-link">
              Create one
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
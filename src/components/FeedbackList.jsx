import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

function getListError(error) {
  if (error?.code === 'PGRST204' || error?.code === '42703') {
    return 'The Supabase database is missing the latest feedback fields. Run the complete schema migration, then refresh this page.';
  }
  if (error?.code === '42501') {
    return 'Your account is not authorized to read feedback. Please sign in again.';
  }
  return 'We could not load your submissions. Check your connection and try again.';
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function FeedbackList({ userId, refreshToken }) {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    const loadFeedback = async () => {
      setLoading(true);
      setErrorMessage('');
      const { data, error } = await supabase
        .from('feedbacks')
        .select('id, category, message, contact_preference, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!active) return;
      if (error) {
        setErrorMessage(getListError(error));
      } else {
        setFeedback(data || []);
      }
      setLoading(false);
    };

    loadFeedback();
    return () => {
      active = false;
    };
  }, [userId, refreshToken]);

  return (
    <section className="panel" aria-labelledby="feedback-list-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your history</p>
          <h2 id="feedback-list-title">Previous submissions</h2>
        </div>
        {!loading && <span className="count-badge">{feedback.length}</span>}
      </div>
      {loading && (
        <div className="inline-loading">
          <span className="spinner small" aria-hidden="true"></span>
          <span>Loading your submissions...</span>
        </div>
      )}
      {errorMessage && <div className="alert alert-error" role="alert">{errorMessage}</div>}
      {!loading && !errorMessage && feedback.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">✦</span>
          <h3>No feedback yet</h3>
          <p>Your submitted feedback will appear here.</p>
        </div>
      )}
      {!loading && !errorMessage && feedback.length > 0 && (
        <div className="feedback-list">
          {feedback.map((item) => (
            <article className="feedback-item" key={item.id}>
              <div className="feedback-meta">
                <span className="category-tag">{item.category}</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              <p>{item.message}</p>
              <span className={`submission-status status-${item.status || 'pending'}`}>{(item.status || 'pending').replace('_', ' ')}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

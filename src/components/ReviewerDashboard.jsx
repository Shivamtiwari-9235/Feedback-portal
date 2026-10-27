import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const categories = ['All categories', 'Bug Report', 'Feature Request', 'General Feedback'];
const statuses = ['All statuses', 'pending', 'under_review', 'resolved'];

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function readableStatus(status) {
  return status.replace('_', ' ');
}

export default function ReviewerDashboard() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState(categories[0]);
  const [status, setStatus] = useState(statuses[0]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    let query = supabase.from('feedbacks').select('id, user_id, category, message, contact_preference, status, created_at').order('created_at', { ascending: false });
    if (category !== categories[0]) query = query.eq('category', category);
    if (status !== statuses[0]) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) setErrorMessage('We could not load submissions. Check your connection and try again.');
    else setItems(data || []);
    setLoading(false);
  }, [category, status]);

  useEffect(() => {
    const timer = window.setTimeout(loadFeedback, 0);
    return () => window.clearTimeout(timer);
  }, [loadFeedback]);

  const updateStatus = async (id, nextStatus) => {
    setUpdatingId(id);
    setErrorMessage('');
    const { error } = await supabase.from('feedbacks').update({ status: nextStatus }).eq('id', id);
    if (error) setErrorMessage('We could not update that submission. Please try again.');
    else setItems((current) => current.map((item) => item.id === id ? { ...item, status: nextStatus } : item));
    setUpdatingId('');
  };

  return (
    <section className="panel reviewer-panel" aria-labelledby="reviewer-title">
      <div className="section-heading">
        <div><p className="eyebrow">Internal workspace</p><h2 id="reviewer-title">Reviewer dashboard</h2></div>
        <span className="status-pill">Reviewer</span>
      </div>
      <p className="panel-copy">Review incoming feedback and keep submitters informed.</p>
      <div className="filters">
        <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((value) => <option key={value}>{value === 'All statuses' ? value : readableStatus(value)}</option>)}</select></label>
      </div>
      {errorMessage && <div className="alert alert-error" role="alert">{errorMessage}</div>}
      {loading ? <div className="inline-loading"><span className="spinner small" aria-hidden="true"></span><span>Loading all submissions...</span></div> : items.length === 0 ? <div className="empty-state"><h3>No matching submissions</h3><p>Try changing the filters.</p></div> : (
        <div className="review-list">
          {items.map((item) => <article className="review-item" key={item.id}>
            <div className="feedback-meta"><span className="category-tag">{item.category}</span><span>{formatDate(item.created_at)}</span></div>
            <p>{item.message}</p>
            <div className="review-footer"><span className="reviewer-user">{item.user_id.slice(0, 8)}…{item.contact_preference ? ` · ${item.contact_preference}` : ''}</span><select value={item.status} onChange={(event) => updateStatus(item.id, event.target.value)} disabled={updatingId === item.id}>{statuses.slice(1).map((value) => <option key={value} value={value}>{readableStatus(value)}</option>)}</select></div>
          </article>)}
        </div>
      )}
    </section>
  );
}

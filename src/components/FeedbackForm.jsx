import { useState } from 'react';
import { supabase } from '../supabaseClient';

const initialForm = { category: 'General Feedback', message: '', contactPreference: '' };

function getSubmissionError(error) {
  if (error?.code === '23514') {
    return 'This feedback does not match the database rules. Please use a valid category and a message between 10 and 2000 characters.';
  }
  if (error?.code === '42501') {
    return 'Your account is not authorized to submit feedback. Please sign in again.';
  }
  if (error?.code === 'PGRST204' || error?.code === '42703') {
    return 'The Supabase database is missing the latest feedback fields. Run the complete schema migration, then try again.';
  }
  return 'We could not submit your feedback. Check your connection and try again.';
}

export default function FeedbackForm({ userId, onSubmitted }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const message = form.message.trim();
    if (!message) {
      setErrorMessage('Please enter your feedback before submitting.');
      return;
    }
    if (message.length < 10) {
      setErrorMessage('Feedback must be at least 10 characters long.');
      return;
    }
    if (message.length > 2000) {
      setErrorMessage('Feedback must be 2000 characters or less.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedbacks')
        .insert({
          user_id: userId,
          category: form.category,
          message,
          contact_preference: form.contactPreference.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      setForm(initialForm);
      setSuccessMessage('Thank you! Your feedback was submitted successfully.');
      onSubmitted(data);
    } catch (error) {
      setErrorMessage(getSubmissionError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel" aria-labelledby="feedback-form-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Share your experience</p>
          <h2 id="feedback-form-title">Submit feedback</h2>
        </div>
        <span className="status-pill">Secure</span>
      </div>
      <p className="panel-copy">Your submission is private and visible only to your account.</p>
      {errorMessage && <div className="alert alert-error" role="alert">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success" role="status">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            disabled={loading}
          >
            <option>General Feedback</option>
            <option>Bug Report</option>
            <option>Feature Request</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="contact-preference">Contact preference <span className="optional">(optional)</span></label>
          <input
            id="contact-preference"
            type="text"
            maxLength="320"
            placeholder="Email or handle"
            value={form.contactPreference}
            onChange={(event) => setForm({ ...form, contactPreference: event.target.value })}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="message">Your feedback</label>
          <textarea
            id="message"
            rows="6"
            maxLength="2000"
            placeholder="Tell us what went well or what we can improve..."
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            disabled={loading}
          />
          <span className="field-hint">{form.message.length}/2000 characters</span>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit feedback'}
        </button>
      </form>
    </section>
  );
}

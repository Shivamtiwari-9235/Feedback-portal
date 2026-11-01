import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

const initialForm = { category: 'General Feedback', message: '', contactPreference: '' };
const maxMessageLength = 2000;

function getSpeechRecognition() {
  if (typeof window === 'undefined') return undefined;
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function getSpeechErrorMessage(error) {
  const messages = {
    'audio-capture': 'No microphone was found. Check your microphone and try again.',
    'language-not-supported': 'Speech recognition is not available for this language.',
    network: 'Speech recognition could not connect. Check your connection and try again.',
    'not-allowed': 'Microphone access was denied. Allow microphone access and try again.',
    'service-not-allowed': 'Speech recognition is not allowed by this browser.',
    'no-speech': 'No speech was detected. Try speaking closer to your microphone.',
  };

  return messages[error] || 'Speech recognition stopped unexpectedly. Please try again.';
}

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
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const speechSupported = Boolean(getSpeechRecognition());

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(' ')
        .trim();

      if (!transcript) return;

      setForm((currentForm) => {
        const separator = currentForm.message.trim() ? ' ' : '';
        const message = `${currentForm.message}${separator}${transcript}`.slice(0, maxMessageLength);
        return { ...currentForm, message };
      });
    };
    recognition.onerror = (event) => {
      setIsListening(false);
      if (event.error === 'aborted') return;
      setErrorMessage(getSpeechErrorMessage(event.error));
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const handleSpeechToggle = () => {
    if (!speechSupported) {
      setErrorMessage('Speech recognition is not supported in this browser. You can type your feedback instead.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    setErrorMessage('');
    try {
      recognitionRef.current?.start();
    } catch (error) {
      if (error.name === 'InvalidStateError') return;
      setIsListening(false);
      setErrorMessage('Could not start speech recognition. Please try again.');
    }
  };

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
    if (message.length > maxMessageLength) {
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
      recognitionRef.current?.abort();
      setIsListening(false);
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
          <div className="feedback-label-row">
            <label htmlFor="message">Your feedback</label>
            <button
              type="button"
              className={`speech-button${isListening ? ' speech-button-listening' : ''}`}
              onClick={handleSpeechToggle}
              disabled={loading}
              aria-pressed={isListening}
              aria-label={isListening ? 'Stop listening' : 'Speak feedback'}
            >
              <svg className="speech-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
                <path d="M19 11a7 7 0 0 1-14 0M12 18v4M8 22h8" />
              </svg>
              <span className="speech-button-text">
                {isListening ? 'Listening... Speak now' : 'Speak feedback'}
              </span>
            </button>
          </div>
          <textarea
            id="message"
            rows="6"
            maxLength="2000"
            placeholder="Tell us what went well or what we can improve..."
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            disabled={loading}
          />
          <span className="field-hint">
            {form.message.length}/{maxMessageLength} characters
            {!speechSupported && ' · Voice input is not supported in this browser'}
          </span>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit feedback'}
        </button>
      </form>
    </section>
  );
}

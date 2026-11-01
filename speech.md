# Voice-to-text feedback

The feedback form now supports browser-native speech recognition. It does not
use an external package, paid service, or API key.

## What changed

- [`src/components/FeedbackForm.jsx`](./src/components/FeedbackForm.jsx) checks
  for `window.SpeechRecognition` and
  `window.webkitSpeechRecognition`.
- A compact, WhatsApp-style green microphone button appears beside the **Your
  feedback** label.
- While recognition is active, the button changes to **Listening... Speak now**,
  uses a red pulsing style, and can be clicked again to stop listening.
- Recognized text is appended to the existing textarea content and truncated at
  the existing 2,000-character limit.
- Permission, network, missing microphone, no-speech, unsupported-language, and
  other recognition errors show an actionable message and reset listening.
- Unsupported browsers retain the normal typing workflow and show a fallback
  message instead of attempting to use speech recognition.

## How it works

Recognition is created once when the form mounts. The browser asks for
microphone permission when the user clicks the button. A completed recognition
result is added to the current feedback using React's functional state update,
so existing text is preserved even if the form has changed since recognition
started.

Speech recognition availability and language support vary by browser. The
feature is optional: users can always type feedback and submit it normally.

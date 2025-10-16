const express = require("express");
const router = express.Router();
let gTranslate = null;
let gSpeech = null;
try {
  const { v2: TranslateV2 } = require('@google-cloud/translate');
  gTranslate = new TranslateV2.Translate({
    key: process.env.GOOGLE_CLOUD_API_KEY || undefined,
  });
} catch (_) {}
try {
  const speech = require('@google-cloud/speech');
  gSpeech = new speech.SpeechClient();
} catch (_) {}

// Translation endpoint
// POST /api/ai/translate { text, targetLang, sourceLang? }
router.post("/translate", async (req, res) => {
  try {
    const { text, targetLang = "en", sourceLang } = req.body || {};
    if (!text) return res.status(400).json({ error: "text is required" });

    // Dev fallback: echo translation for demo/testing environments
    if (process.env.DEV_FAKE_TRANSLATE === "true") {
      return res.json({
        translatedText: `[${targetLang}] ${text}`,
        provider: "dev-fake",
      });
    }

    const provider = process.env.TRANSLATION_PROVIDER || 'gcp-translate-v2';
    if (provider === 'gcp-translate-v2' && gTranslate) {
      const [translated] = await gTranslate.translate(text, targetLang);
      return res.json({ translatedText: translated, provider });
    }
    return res.status(501).json({ error: `Provider '${provider}' not available` });
  } catch (e) {
    console.error("/ai/translate error:", e);
    return res.status(500).json({ error: e.message });
  }
});

// Transcription endpoint (Whisper, etc.)
// POST /api/ai/transcribe { audioBase64, mimeType? }
router.post("/transcribe", async (req, res) => {
  try {
    const { audioBase64, mimeType = "audio/webm" } = req.body || {};
    if (!audioBase64) return res.status(400).json({ error: "audioBase64 is required" });

    if (process.env.DEV_FAKE_TRANSCRIBE === "true") {
      return res.json({ text: "[stub transcription] hello world", provider: "dev-fake" });
    }

    const provider = process.env.TRANSCRIBE_PROVIDER || 'gcp-speech';
    if (provider === 'gcp-speech' && gSpeech) {
      const audio = { content: audioBase64 };
      const request = {
        audio,
        config: {
          languageCode: 'auto',
          enableAutomaticPunctuation: true,
        },
      };
      const [response] = await gSpeech.recognize(request);
      const transcription = (response.results || [])
        .map(r => r.alternatives && r.alternatives[0] && r.alternatives[0].transcript)
        .filter(Boolean)
        .join(' ');
      return res.json({ text: transcription || '', provider });
    }
    return res.status(501).json({ error: `Provider '${provider}' not available` });
  } catch (e) {
    console.error("/ai/transcribe error:", e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

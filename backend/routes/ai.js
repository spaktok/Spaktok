const express = require("express");
const router = express.Router();

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

    const provider = process.env.TRANSLATION_PROVIDER;
    if (!provider) {
      return res.status(501).json({ error: "No translation provider configured" });
    }

    // Providers can be implemented here (OpenAI, GCP Translate, etc.)
    return res.status(501).json({ error: `Provider '${provider}' not implemented` });
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

    const provider = process.env.TRANSCRIBE_PROVIDER;
    if (!provider) {
      return res.status(501).json({ error: "No transcription provider configured" });
    }

    return res.status(501).json({ error: `Provider '${provider}' not implemented` });
  } catch (e) {
    console.error("/ai/transcribe error:", e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

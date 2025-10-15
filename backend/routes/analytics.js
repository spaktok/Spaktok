const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// POST /api/analytics/event { type, userId, properties }
router.post("/event", async (req, res) => {
  try {
    const { type, userId, properties = {} } = req.body || {};
    if (!type) return res.status(400).json({ error: "type is required" });
    const db = admin.firestore();
    await db.collection("analytics_events").add({
      type,
      userId: userId || null,
      properties,
      ts: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.json({ ok: true });
  } catch (e) {
    console.error("/analytics/event error:", e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

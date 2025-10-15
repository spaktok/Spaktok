const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// Simple recs based on recent popularity (watchCount, likes) with fallback
router.get("/feed", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const db = admin.firestore();
    const snapshot = await db
      .collection("videos")
      .orderBy("views", "desc")
      .limit(limit)
      .get();
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ items });
  } catch (e) {
    console.error("/recs/feed error:", e);
    return res.status(500).json({ error: e.message });
  }
});

// Bandit-style explore/exploit stub
router.get("/next", async (req, res) => {
  try {
    // TODO: integrate bandit model; for now, pick random top-N
    const limit = Math.min(parseInt(req.query.limit || "1", 10), 10);
    const db = admin.firestore();
    const snapshot = await db
      .collection("videos")
      .orderBy("views", "desc")
      .limit(50)
      .get();
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    const sample = items.sort(() => 0.5 - Math.random()).slice(0, limit);
    return res.json({ items: sample });
  } catch (e) {
    console.error("/recs/next error:", e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

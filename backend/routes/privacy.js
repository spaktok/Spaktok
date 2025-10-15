const express = require("express");
const admin = require("firebase-admin");
const router = express.Router();

// Toggle Ghost Mode (visibility control)
// POST /api/privacy/ghost { userId, enabled }
router.post("/ghost", async (req, res) => {
  try {
    const { userId, enabled } = req.body || {};
    if (!userId || typeof enabled !== "boolean") {
      return res.status(400).json({ error: "userId and boolean enabled are required" });
    }
    const db = admin.firestore();
    await db.collection("users").doc(userId).set({ ghostMode: enabled }, { merge: true });
    return res.json({ ok: true, ghostMode: enabled });
  } catch (e) {
    console.error("/privacy/ghost error:", e);
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;

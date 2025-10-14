const express = require("express");
const router = express.Router();

// Aggregate sub-routers when present
try {
  router.use("/streaming", require("./streaming"));
} catch (_) {}

try {
  router.use("/auth", require("./auth"));
} catch (_) {}

try {
  router.use("/battle-gifting", require("./battle_gifting"));
} catch (_) {}

try {
  router.use("/payments", require("./payment"));
} catch (_) {}

// Basic ping
router.get("/ping", (req, res) => res.json({ message: "pong" }));

module.exports = router;

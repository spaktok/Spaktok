const express = require("express");
const router = express.Router();

// Demo login
router.post("/login", (req, res) => {
  res.json({ message: "Login successful" });
});

module.exports = router;

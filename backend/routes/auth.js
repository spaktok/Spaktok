const express = require("express");
const router = express.Router();

// تسجيل دخول تجريبي
router.post("/login", (req, res) => {
  res.json({ message: "تم تسجيل الدخول" });
});

module.exports = router;

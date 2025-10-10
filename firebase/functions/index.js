const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");

admin.initializeApp();
const app = express();
app.use(cors({ origin: true }));

app.get("/hello", (req, res) => {
  res.json({ message: "Hello from Firebase Function!" });
});

exports.api = functions.https.onRequest(app);

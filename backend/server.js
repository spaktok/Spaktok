const express = require("express");
const mongoose = require("mongoose");
const { Pool } = require("pg");
const redis = require("redis");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ MongoDB
mongoose.connect("mongodb://spaktok-mongo:27017/spaktok", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB error:", err));

// ✅ PostgreSQL
const pool = new Pool({
  host: "spaktok-postgres",
  port: 5432,
  user: "spaktok",
  password: "123dano",
  database: "spaktok_db"
});

pool.connect()
.then(() => console.log("✅ PostgreSQL connected"))
.catch(err => console.error("❌ PostgreSQL error:", err));

// ✅ Redis
const redisClient = redis.createClient({
  url: "redis://spaktok-redis:6379"
});

redisClient.connect()
.then(() => console.log("✅ Redis connected"))
.catch(err => console.error("❌ Redis error:", err));

// ✅ API routes
app.get("/", (req, res) => {
  res.send("🚀 Backend is working correctly!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(✅ Server running at http://localhost:${PORT});
});

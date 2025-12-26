var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/utils/jwt.utils.ts
var jwt_utils_exports = {};
__export(jwt_utils_exports, {
  generateToken: () => generateToken,
  verifyToken: () => verifyToken
});
function getJwtSecret(env) {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return env.JWT_SECRET;
}
function base64urlEncode(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function base64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  return atob(str);
}
async function generateToken(userId, type, env) {
  console.log("[generateToken] Generating token for userId:", userId, "type:", type);
  const secret = getJwtSecret(env);
  const now = Math.floor(Date.now() / 1e3);
  const exp = type === "access" ? now + 900 : now + 2592e3;
  console.log("[generateToken] Token lifetime:", type === "access" ? "15min" : "30days", "iat:", now, "exp:", exp);
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const payload = {
    userId,
    type,
    iat: now,
    exp,
    iatMs: Date.now(),
    // millisecond precision for uniqueness
    nonce: Math.random().toString(36).substring(2, 11)
    // 9-char random nonce
  };
  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(payload));
  const message = `${headerEncoded}.${payloadEncoded}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  const signatureEncoded = base64urlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  const fullToken = `${message}.${signatureEncoded}`;
  console.log("[generateToken] Token generated, length:", fullToken.length, "first 30 chars:", fullToken.substring(0, 30));
  return fullToken;
}
async function verifyToken(token, env) {
  try {
    const secret = getJwtSecret(env);
    const parts = token.split(".");
    console.log("[verifyToken] Token parts count:", parts.length);
    if (parts.length !== 3) {
      console.log("[verifyToken] Invalid token format (expected 3 parts)");
      return null;
    }
    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;
    const payloadDecoded = base64urlDecode(payloadEncoded);
    console.log("[verifyToken] Decoded payload string:", payloadDecoded.substring(0, 200));
    const message = `${headerEncoded}.${payloadEncoded}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signature = Uint8Array.from(
      base64urlDecode(signatureEncoded),
      (c) => c.charCodeAt(0)
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signature,
      new TextEncoder().encode(message)
    );
    console.log("[verifyToken] Signature valid:", valid);
    if (!valid) {
      console.log("[verifyToken] Signature verification failed");
      return null;
    }
    const payload = JSON.parse(payloadDecoded);
    console.log("[verifyToken] Parsed payload:", JSON.stringify(payload, null, 2));
    const nowSec = Math.floor(Date.now() / 1e3);
    console.log("[verifyToken] Current time:", nowSec, "Token exp:", payload.exp, "Remaining:", payload.exp - nowSec, "sec");
    if (payload.exp < nowSec) {
      console.log("[verifyToken] Token expired");
      return null;
    }
    console.log("[verifyToken] Token verified successfully, type:", payload.type, "userId:", payload.userId);
    return payload;
  } catch (error) {
    console.error("[verifyToken] Exception during verification:", error);
    console.error("[verifyToken] Error details:", error instanceof Error ? error.message : String(error));
    return null;
  }
}
var init_jwt_utils = __esm({
  "src/utils/jwt.utils.ts"() {
    "use strict";
    __name(getJwtSecret, "getJwtSecret");
    __name(base64urlEncode, "base64urlEncode");
    __name(base64urlDecode, "base64urlDecode");
    __name(generateToken, "generateToken");
    __name(verifyToken, "verifyToken");
  }
});

// src/utils/otel.ts
function startSpan(name, tags) {
  return { name, start: Date.now(), tags };
}
__name(startSpan, "startSpan");
async function endSpan(env, span, endpoint) {
  const duration = Date.now() - span.start;
  try {
    if (endpoint) {
      await env.DB.prepare("INSERT INTO latency_samples (id, endpoint, p50, p95, ts) VALUES (?1, ?2, ?3, ?4, ?5)").bind(crypto.randomUUID(), endpoint, duration, duration, Date.now()).run();
    }
  } catch (_) {
  }
}
__name(endSpan, "endSpan");
async function instrumentRequest(env, endpoint, fn) {
  const span = startSpan(endpoint);
  try {
    const res = await fn();
    return res;
  } finally {
    await endSpan(env, span, endpoint);
  }
}
__name(instrumentRequest, "instrumentRequest");

// src/middleware/auth.ts
init_jwt_utils();

// src/utils/firebase-admin.ts
var publicKeysCache = null;
async function getFirebasePublicKeys(_env) {
  const now = Date.now();
  if (publicKeysCache && publicKeysCache.expiresAt > now) {
    return publicKeysCache.keys;
  }
  try {
    const response = await fetch(
      "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase public keys: ${response.status}`);
    }
    const jwks = await response.json();
    const keys = {};
    for (const k of jwks.keys) {
      if (k.kid) keys[k.kid] = k;
    }
    const cacheControl = response.headers.get("cache-control");
    const maxAge = cacheControl?.match(/max-age=(\d+)/)?.[1];
    const ttl = maxAge ? parseInt(maxAge) * 1e3 : 24 * 60 * 60 * 1e3;
    publicKeysCache = {
      keys,
      expiresAt: now + ttl
    };
    return keys;
  } catch (error) {
    console.error("Error fetching Firebase public keys:", error);
    throw error;
  }
}
__name(getFirebasePublicKeys, "getFirebasePublicKeys");
async function verifyFirebaseToken(idToken, env) {
  const span = startSpan("firebase.verifyToken");
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      console.error("Invalid Firebase token format");
      return null;
    }
    const headerStr = atob(parts[0].replace(/-/g, "+").replace(/_/g, "/"));
    const header = JSON.parse(headerStr);
    const kid = header.kid;
    if (!kid) {
      console.error("Firebase token missing kid");
      return null;
    }
    const payloadStr = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadStr);
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp < now) {
      console.error("Firebase token expired");
      return null;
    }
    if (payload.iat > now + 60) {
      console.error("Firebase token issued in future");
      return null;
    }
    if (env.FIREBASE_PROJECT_ID && payload.aud !== env.FIREBASE_PROJECT_ID) {
      console.error("Firebase token audience mismatch");
      return null;
    }
    const publicKeys = await getFirebasePublicKeys(env);
    const publicKeyJwk = publicKeys[kid];
    if (!publicKeyJwk) {
      console.error(`Firebase public key not found for kid: ${kid}`);
      return null;
    }
    try {
      const cryptoKey = await crypto.subtle.importKey(
        "jwk",
        publicKeyJwk,
        { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
        false,
        ["verify"]
      );
      const dataToVerify = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
      const signatureBytes = Uint8Array.from(atob(parts[2].replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
      const isValid = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        signatureBytes,
        dataToVerify
      );
      if (!isValid) {
        console.error("Firebase token signature invalid");
        return null;
      }
    } catch (sigErr) {
      console.error("Firebase token signature verification failed:", sigErr);
      return null;
    }
    return {
      userId: payload.user_id,
      email: payload.email,
      emailVerified: payload.email_verified || false,
      provider: payload.firebase.sign_in_provider
    };
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    return null;
  } finally {
    await endSpan(env, span, "firebase.verifyToken");
  }
}
__name(verifyFirebaseToken, "verifyFirebaseToken");
async function getOrCreateUserFromFirebase(env, firebaseUser) {
  const span = startSpan("firebase.getOrCreateUser");
  try {
    const existingUser = await env.DB.prepare(
      "SELECT id, username, email FROM users WHERE firebase_uid = ?1"
    ).bind(firebaseUser.userId).first();
    if (existingUser) {
      return existingUser;
    }
    const userId = crypto.randomUUID();
    const username = `user_${userId.substring(0, 8)}`;
    const email = firebaseUser.email || `${userId}@firebase.local`;
    const displayName = firebaseUser.email?.split("@")[0] || username;
    await env.DB.prepare(
      `INSERT INTO users (
        id, username, email, password_hash, display_name, 
        firebase_uid, email_verified, followers_count, following_count, 
        likes_count, is_verified, is_premium, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, ?, ?)`
    ).bind(
      userId,
      username,
      email,
      "",
      // No password for Firebase users
      displayName,
      firebaseUser.userId,
      firebaseUser.emailVerified ? 1 : 0,
      Date.now(),
      Date.now()
    ).run();
    console.log(`Created new user from Firebase: ${userId}`, {
      provider: firebaseUser.provider,
      email: firebaseUser.email
    });
    return {
      id: userId,
      username,
      email
    };
  } catch (error) {
    console.error("Error getting/creating user from Firebase:", error);
    return null;
  } finally {
    await endSpan(env, span, "firebase.getOrCreateUser");
  }
}
__name(getOrCreateUserFromFirebase, "getOrCreateUserFromFirebase");
function extractFirebaseToken(authHeader) {
  if (!authHeader) {
    return null;
  }
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return authHeader;
}
__name(extractFirebaseToken, "extractFirebaseToken");

// src/middleware/auth.ts
function requireAuth(handler) {
  return async (request, env, ctx, params) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Missing authorization header"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const token = extractFirebaseToken(authHeader);
    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid authorization header format"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    try {
      const firebaseUser = await verifyFirebaseToken(token, env);
      if (firebaseUser) {
        const user = await getOrCreateUserFromFirebase(env, firebaseUser);
        if (user) {
          request.userId = user.id;
          request.user = user;
          return handler(request, env, ctx, params);
        }
      }
    } catch (firebaseError) {
      console.log("Firebase token verification failed, trying Workers JWT:", firebaseError);
    }
    try {
      const payload = await verifyToken(token, env);
      if (payload) {
        request.userId = payload.userId;
        return handler(request, env, ctx, params);
      }
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid or expired token"
        }
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  };
}
__name(requireAuth, "requireAuth");
function optionalAuth(handler) {
  return async (request, env, ctx, params) => {
    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      const token = extractFirebaseToken(authHeader);
      if (token) {
        try {
          const firebaseUser = await verifyFirebaseToken(token, env);
          if (firebaseUser) {
            const user = await getOrCreateUserFromFirebase(env, firebaseUser);
            if (user) {
              request.userId = user.id;
              request.user = user;
            }
          }
        } catch {
          try {
            const payload = await verifyToken(token, env);
            if (payload) {
              request.userId = payload.userId;
            }
          } catch {
          }
        }
      }
    }
    return handler(request, env, ctx, params);
  };
}
__name(optionalAuth, "optionalAuth");
function rateLimit(maxAttempts, windowSeconds) {
  return (handler) => {
    return async (request, env, ctx, params) => {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const key = `ratelimit:${ip}:${request.url}`;
      const currentStr = await env.RATE_LIMIT.get(key);
      const current = currentStr ? parseInt(currentStr) : 0;
      if (current >= maxAttempts) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: `Too many requests. Try again in ${windowSeconds} seconds.`
            }
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      await env.RATE_LIMIT.put(key, (current + 1).toString(), {
        expirationTtl: windowSeconds
      });
      return handler(request, env, ctx, params);
    };
  };
}
__name(rateLimit, "rateLimit");

// src/services/db.service.ts
var DatabaseService = class {
  constructor(env) {
    this.env = env;
  }
  static {
    __name(this, "DatabaseService");
  }
  // User operations
  async createUser(user) {
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const fullUser = {
      id,
      ...user,
      followersCount: 0,
      followingCount: 0,
      likesCount: 0,
      isVerified: false,
      isPremium: false,
      createdAt: now,
      updatedAt: now
    };
    try {
      await this.env.DB.prepare(
        `INSERT INTO users (id, username, email, password_hash, display_name, bio, avatar_url, 
         followers_count, following_count, likes_count, is_verified, is_premium, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        fullUser.username,
        fullUser.email,
        fullUser.passwordHash,
        fullUser.displayName,
        fullUser.bio || null,
        fullUser.avatarUrl || null,
        0,
        0,
        0,
        false,
        false,
        now,
        now
      ).run();
      return fullUser;
    } catch (error) {
      console.error("D1 createUser error:", error);
      throw error;
    }
  }
  async getUserByEmail(email) {
    try {
      const result = await this.env.DB.prepare(
        "SELECT * FROM users WHERE email = ?"
      ).bind(email).first();
      if (!result) return null;
      return this.mapDbRowToUser(result);
    } catch (error) {
      console.error("D1 getUserByEmail error:", error);
      return null;
    }
  }
  async getUserById(id) {
    try {
      const result = await this.env.DB.prepare(
        "SELECT * FROM users WHERE id = ?"
      ).bind(id).first();
      if (!result) return null;
      return this.mapDbRowToUser(result);
    } catch (error) {
      console.error("D1 getUserById error:", error);
      return null;
    }
  }
  // Video operations
  async createVideo(video) {
    const id = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const fullVideo = {
      id,
      ...video,
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      processingStatus: "pending",
      createdAt: now,
      updatedAt: now
    };
    try {
      await this.env.DB.prepare(
        `INSERT INTO videos (id, user_id, title, description, video_url, thumbnail_url, 
         duration, width, height, views_count, likes_count, comments_count, shares_count, 
         hashtags, processing_status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        fullVideo.userId,
        fullVideo.title,
        fullVideo.description || null,
        fullVideo.videoUrl,
        fullVideo.thumbnailUrl,
        fullVideo.duration,
        fullVideo.width,
        fullVideo.height,
        0,
        0,
        0,
        0,
        fullVideo.hashtags ? JSON.stringify(fullVideo.hashtags) : null,
        "pending",
        now,
        now
      ).run();
      return fullVideo;
    } catch (error) {
      console.error("D1 createVideo error:", error);
      throw error;
    }
  }
  async getVideosForFeed(limit = 20, cursor) {
    try {
      const query = cursor ? `SELECT * FROM videos WHERE processing_status = 'ready' AND created_at < ? 
           ORDER BY created_at DESC LIMIT ?` : `SELECT * FROM videos WHERE processing_status = 'ready' 
           ORDER BY created_at DESC LIMIT ?`;
      const stmt = cursor ? this.env.DB.prepare(query).bind(cursor, limit) : this.env.DB.prepare(query).bind(limit);
      const result = await stmt.all();
      return result.results.map((row) => this.mapDbRowToVideo(row));
    } catch (error) {
      console.error("D1 getVideosForFeed error:", error);
      return [];
    }
  }
  // Helper methods
  mapDbRowToUser(row) {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      bio: row.bio,
      avatarUrl: row.avatar_url,
      followersCount: row.followers_count || 0,
      followingCount: row.following_count || 0,
      likesCount: row.likes_count || 0,
      isVerified: Boolean(row.is_verified),
      isPremium: Boolean(row.is_premium),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
  mapDbRowToVideo(row) {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      width: row.width,
      height: row.height,
      viewsCount: row.views_count || 0,
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      sharesCount: row.shares_count || 0,
      hashtags: row.hashtags ? JSON.parse(row.hashtags) : void 0,
      processingStatus: row.processing_status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
};

// src/utils/hash.utils.ts
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordData = encoder.encode(password);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltArray = Array.from(salt);
  const saltHex = saltArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `$pbkdf2$${saltHex}$${hashHex}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hash) {
  if (hash.startsWith("$pbkdf2$")) {
    const parts = hash.split("$");
    if (parts.length !== 4) return false;
    const saltHex = parts[2];
    const storedHashHex = parts[3];
    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
    );
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 1e5,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex === storedHashHex;
  }
  if (hash.startsWith("$sha256$")) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `$sha256$${hashHex}` === hash;
  }
  return false;
}
__name(verifyPassword, "verifyPassword");

// src/handlers/auth.handler.ts
init_jwt_utils();
var register = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  try {
    const body = await request.json();
    if (!body.username || !body.email || !body.password || !body.displayName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required fields"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const db = new DatabaseService(env);
    const existingUser = await db.getUserByEmail(body.email);
    if (existingUser) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "USER_EXISTS",
            message: "User with this email already exists"
          }
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const passwordHash = await hashPassword(body.password);
    const user = await db.createUser({
      username: body.username,
      email: body.email,
      passwordHash,
      displayName: body.displayName
    });
    const accessToken = await generateToken(user.id, "access", env);
    const refreshToken = await generateToken(user.id, "refresh", env);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Register error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to register user"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "register");
var login = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  try {
    const body = await request.json();
    if (!body.email || !body.password) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Email and password are required"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const db = new DatabaseService(env);
    const user = await db.getUserByEmail(body.email);
    if (!user) {
      const failKey = `authfail:${body.email.toLowerCase()}`;
      const failuresRaw = await env.RATE_LIMIT.get(failKey);
      const failures = failuresRaw ? parseInt(failuresRaw) : 0;
      const newFailures = failures + 1;
      await env.RATE_LIMIT.put(failKey, newFailures.toString(), { expirationTtl: 1800 });
      if (newFailures >= 10) {
        await env.RATE_LIMIT.put(`lock:${body.email.toLowerCase()}`, "1", { expirationTtl: 1800 });
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const lock = await env.RATE_LIMIT.get(`lock:${body.email.toLowerCase()}`);
    if (lock) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "ACCOUNT_LOCKED",
            message: "Too many failed attempts. Try again later."
          }
        }),
        { status: 423, headers: { "Content-Type": "application/json" } }
      );
    }
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) {
      const failKey = `authfail:${body.email.toLowerCase()}`;
      const failuresRaw = await env.RATE_LIMIT.get(failKey);
      const failures = failuresRaw ? parseInt(failuresRaw) : 0;
      const newFailures = failures + 1;
      await env.RATE_LIMIT.put(failKey, newFailures.toString(), { expirationTtl: 1800 });
      if (newFailures >= 10) {
        await env.RATE_LIMIT.put(`lock:${body.email.toLowerCase()}`, "1", { expirationTtl: 1800 });
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const accessToken = await generateToken(user.id, "access", env);
    const refreshToken = await generateToken(user.id, "refresh", env);
    await env.RATE_LIMIT.delete(`authfail:${body.email.toLowerCase()}`);
    await env.RATE_LIMIT.delete(`lock:${body.email.toLowerCase()}`);
    const { passwordHash: _, ...userWithoutPassword } = user;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken,
            refreshToken
          }
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Login error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to login"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "login");
var logout = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  return new Response(
    JSON.stringify({
      success: true,
      data: { message: "Logged out successfully" }
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}, "logout");
var refresh = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  try {
    console.log("[refresh] Starting refresh token handler");
    console.log("[refresh] env.JWT_SECRET exists:", !!env.JWT_SECRET);
    console.log("[refresh] env keys:", Object.keys(env));
    const body = await request.json().catch(() => ({}));
    const refreshToken = body.refreshToken;
    console.log("[refresh] Received refreshToken:", refreshToken ? `${refreshToken.substring(0, 20)}...` : "MISSING");
    if (!refreshToken) {
      console.log("[refresh] Validation failed: no refreshToken provided");
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "refreshToken required" }
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("[refresh] Verifying token...");
    const payload = await verifyToken(refreshToken, env);
    console.log("[refresh] Token verification result:", payload ? `userId=${payload.userId}, type=${payload.type}` : "NULL");
    if (!payload || payload.type !== "refresh") {
      console.log("[refresh] Token invalid or wrong type");
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Invalid refresh token" }
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    console.log("[refresh] Generating new tokens for userId:", payload.userId);
    const newAccess = await generateToken(payload.userId, "access", env);
    console.log("[refresh] Generated new access token:", newAccess ? `${newAccess.substring(0, 20)}...` : "FAILED");
    const newRefresh = await generateToken(payload.userId, "refresh", env);
    console.log("[refresh] Generated new refresh token:", newRefresh ? `${newRefresh.substring(0, 20)}...` : "FAILED");
    return new Response(
      JSON.stringify({
        success: true,
        data: { tokens: { accessToken: newAccess, refreshToken: newRefresh } }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[refresh] Exception caught:", error);
    console.error("[refresh] Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("[refresh] Error message:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to refresh token" }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}, "refresh");

// src/services/feed.service.ts
var FeedService = class {
  constructor(env) {
    this.env = env;
  }
  static {
    __name(this, "FeedService");
  }
  /**
   * Get personalized For You feed with AI-based ranking
   * Algorithm factors:
   * - User engagement history (likes, comments, shares, watch time)
   * - Content freshness (recency bias)
   * - Creator diversity (avoid single-creator dominance)
   * - Trending signals (viral content boost)
   * - User preferences and interests
   */
  async getForYouFeed(userId, limit = 20, cursor) {
    try {
      if (userId) {
        return await this.getPersonalizedFeed(userId, limit, cursor);
      }
      return await this.getTrendingFeed(limit, cursor);
    } catch (error) {
      console.error("Get For You feed error:", error);
      throw error;
    }
  }
  /**
   * Personalized feed for authenticated users
   */
  async getPersonalizedFeed(userId, limit, cursor) {
    const query = `
      WITH user_engagement AS (
        SELECT 
          video_id,
          COUNT(*) as engagement_count
        FROM (
          SELECT video_id FROM likes WHERE user_id = ?
          UNION ALL
          SELECT video_id FROM comments WHERE user_id = ?
        )
        GROUP BY video_id
      ),
      user_following AS (
        SELECT following_id FROM followers WHERE follower_id = ?
      ),
      video_scores AS (
        SELECT 
          v.id,
          v.user_id,
          v.title,
          v.description,
          v.video_url,
          v.thumbnail_url,
          v.duration,
          v.views_count,
          v.likes_count,
          v.comments_count,
          v.shares_count,
          v.created_at,
          u.username,
          u.display_name,
          u.avatar_url,
          u.is_verified,
          -- Engagement score (40% weight)
          (v.likes_count * 3 + v.comments_count * 5 + v.shares_count * 7) * 0.4 AS engagement_score,
          -- Freshness score (30% weight) - decay over time
          (1.0 / (1.0 + (julianday('now') - julianday(v.created_at)) / 7.0)) * 0.3 AS freshness_score,
          -- Following boost (20% weight)
          CASE WHEN uf.following_id IS NOT NULL THEN 0.2 ELSE 0 END AS following_score,
          -- Viral potential (10% weight)
          CASE 
            WHEN v.views_count > 0 THEN 
              ((v.likes_count + v.comments_count * 2.0) / v.views_count) * 0.1
            ELSE 0
          END AS viral_score
        FROM videos v
        LEFT JOIN users u ON v.user_id = u.id
        LEFT JOIN user_following uf ON v.user_id = uf.following_id
        LEFT JOIN user_engagement ue ON v.id = ue.video_id
        WHERE 
          v.processing_status = 'completed'
          AND ue.video_id IS NULL  -- Exclude already engaged videos
          AND v.user_id != ?  -- Exclude own videos
      )
      SELECT 
        *,
        (engagement_score + freshness_score + following_score + viral_score) AS total_score
      FROM video_scores
      ORDER BY total_score DESC, created_at DESC
      LIMIT ?
    `;
    const results = await this.env.DB.prepare(query).bind(userId, userId, userId, userId, limit + 1).all();
    const hasMore = results.results.length > limit;
    const videos = results.results.slice(0, limit).map(this.mapVideoRow);
    return {
      videos,
      cursor: hasMore ? videos[videos.length - 1].id : null
    };
  }
  /**
   * Trending feed for anonymous users
   */
  async getTrendingFeed(limit, cursor) {
    const query = `
      SELECT 
        v.id,
        v.user_id,
        v.title,
        v.description,
        v.video_url,
        v.thumbnail_url,
        v.duration,
        v.views_count,
        v.likes_count,
        v.comments_count,
        v.shares_count,
        v.created_at,
        u.username,
        u.display_name,
        u.avatar_url,
        u.is_verified,
        -- Trending score: engagement rate \xD7 freshness
        ((v.likes_count + v.comments_count * 2 + v.shares_count * 3) / (1.0 + v.views_count)) *
        (1.0 / (1.0 + (julianday('now') - julianday(v.created_at)) / 3.0)) AS trending_score
      FROM videos v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE 
        v.processing_status = 'completed'
        AND v.created_at > datetime('now', '-7 days')  -- Only last 7 days
      ORDER BY trending_score DESC, v.created_at DESC
      LIMIT ?
    `;
    const results = await this.env.DB.prepare(query).bind(limit + 1).all();
    const hasMore = results.results.length > limit;
    const videos = results.results.slice(0, limit).map(this.mapVideoRow);
    return {
      videos,
      cursor: hasMore ? videos[videos.length - 1].id : null
    };
  }
  /**
   * Get Following feed (chronological from followed users)
   */
  async getFollowingFeed(userId, limit = 20, cursor) {
    const query = `
      SELECT 
        v.id,
        v.user_id,
        v.title,
        v.description,
        v.video_url,
        v.thumbnail_url,
        v.duration,
        v.views_count,
        v.likes_count,
        v.comments_count,
        v.shares_count,
        v.created_at,
        u.username,
        u.display_name,
        u.avatar_url,
        u.is_verified
      FROM videos v
      INNER JOIN followers f ON v.user_id = f.following_id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE 
        f.follower_id = ?
        AND v.processing_status = 'completed'
      ORDER BY v.created_at DESC
      LIMIT ?
    `;
    const results = await this.env.DB.prepare(query).bind(userId, limit + 1).all();
    const hasMore = results.results.length > limit;
    const videos = results.results.slice(0, limit).map(this.mapVideoRow);
    return {
      videos,
      cursor: hasMore ? videos[videos.length - 1].id : null
    };
  }
  /**
   * Map database row to video object
   */
  mapVideoRow(row) {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      videoUrl: row.video_url,
      thumbnailUrl: row.thumbnail_url,
      duration: row.duration,
      viewsCount: row.views_count || 0,
      likesCount: row.likes_count || 0,
      commentsCount: row.comments_count || 0,
      sharesCount: row.shares_count || 0,
      createdAt: row.created_at,
      creator: {
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        isVerified: Boolean(row.is_verified)
      }
    };
  }
  /**
   * Update video engagement metrics (for feed ranking)
   */
  async updateEngagementMetrics(videoId) {
    try {
      await this.env.DB.prepare(
        `UPDATE videos 
         SET engagement_score = (likes_count * 3 + comments_count * 5 + shares_count * 7)
         WHERE id = ?`
      ).bind(videoId).run();
    } catch (error) {
      console.error("Update engagement metrics error:", error);
    }
  }
};

// src/services/cache.service.ts
var CacheService = class {
  constructor(env) {
    this.env = env;
  }
  static {
    __name(this, "CacheService");
  }
  // Cache TTL strategies (in seconds)
  TTL = {
    HOT: 60,
    // 1 minute - frequently changing data
    FEED: 300,
    // 5 minutes - feed data
    PROFILE: 600,
    // 10 minutes - user profiles
    STATIC: 3600,
    // 1 hour - relatively static data
    LONG: 86400
    // 24 hours - rarely changing data
  };
  /**
   * Get cached value
   */
  async get(key) {
    try {
      const value = await this.env.CACHE.get(key, "json");
      return value;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }
  /**
   * Set cached value with TTL
   */
  async set(key, value, ttl = this.TTL.FEED) {
    try {
      await this.env.CACHE.put(key, JSON.stringify(value), {
        expirationTtl: ttl
      });
    } catch (error) {
      console.error("Cache set error:", error);
    }
  }
  /**
   * Delete cached value
   */
  async delete(key) {
    try {
      await this.env.CACHE.delete(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }
  /**
   * Cache user profile
   */
  async cacheUserProfile(userId, profile) {
    await this.set(`user:${userId}`, profile, this.TTL.PROFILE);
  }
  /**
   * Get cached user profile
   */
  async getUserProfile(userId) {
    return await this.get(`user:${userId}`);
  }
  /**
   * Cache video metadata
   */
  async cacheVideo(videoId, video) {
    await this.set(`video:${videoId}`, video, this.TTL.STATIC);
  }
  /**
   * Get cached video
   */
  async getVideo(videoId) {
    return await this.get(`video:${videoId}`);
  }
  /**
   * Cache For You feed
   */
  async cacheFeed(userId, videos) {
    const key = userId ? `feed:foryou:${userId}` : "feed:foryou:anonymous";
    await this.set(key, videos, this.TTL.FEED);
  }
  /**
   * Get cached feed
   */
  async getFeed(userId) {
    const key = userId ? `feed:foryou:${userId}` : "feed:foryou:anonymous";
    return await this.get(key);
  }
  /**
   * Invalidate user cache (on profile update)
   */
  async invalidateUser(userId) {
    await this.delete(`user:${userId}`);
  }
  /**
   * Invalidate video cache (on update/delete)
   */
  async invalidateVideo(videoId) {
    await this.delete(`video:${videoId}`);
  }
  /**
   * Invalidate feed cache (on new video upload)
   */
  async invalidateFeed(userId) {
    const key = userId ? `feed:foryou:${userId}` : "feed:foryou:anonymous";
    await this.delete(key);
  }
  /**
   * Get or set with cache-aside pattern
   */
  async getOrSet(key, fetchFn, ttl = this.TTL.FEED) {
    const cached = await this.get(key);
    if (cached !== null) {
      return cached;
    }
    const value = await fetchFn();
    await this.set(key, value, ttl);
    return value;
  }
};

// src/utils/otel_wrapper.ts
function withSpan(handler, name) {
  return async (request, env, ctx, params) => {
    const spanName = name || `${request.method} ${new URL(request.url).pathname}`;
    return instrumentRequest(env, spanName, () => handler(request, env, ctx, params));
  };
}
__name(withSpan, "withSpan");

// src/handlers/feed.handler.ts
var forYouCore = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const cursor = url.searchParams.get("cursor") || void 0;
    const authHeader = request.headers.get("Authorization");
    let userId = null;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { verifyToken: verifyToken2 } = await Promise.resolve().then(() => (init_jwt_utils(), jwt_utils_exports));
        const payload = await verifyToken2(authHeader.substring(7), env);
        userId = payload?.userId || null;
      } catch {
      }
    }
    const cache = new CacheService(env);
    const feedService = new FeedService(env);
    if (!userId) {
      const cached = await cache.getFeed(null);
      if (cached) {
        return new Response(
          JSON.stringify({
            success: true,
            data: { videos: cached, cursor: null }
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }
    const result = await feedService.getForYouFeed(userId, limit, cursor);
    if (!userId && result.videos.length > 0) {
      ctx.waitUntil(cache.cacheFeed(null, result.videos));
    }
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("ForYou feed error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load feed"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "forYouCore");
var forYou = withSpan(forYouCore, "feed.forYou");
var followingCore = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const { verifyToken: verifyToken2 } = await Promise.resolve().then(() => (init_jwt_utils(), jwt_utils_exports));
    const payload = await verifyToken2(authHeader.substring(7), env);
    if (!payload) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid token"
          }
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);
    const cursor = url.searchParams.get("cursor");
    const feedService = new FeedService(env);
    const result = await feedService.getFollowingFeed(payload.userId, limit, cursor);
    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Following feed error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load following feed"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "followingCore");
var following = withSpan(followingCore, "feed.following");

// src/services/storage.service.ts
var StorageService = class {
  constructor(env) {
    this.env = env;
  }
  static {
    __name(this, "StorageService");
  }
  /**
   * Upload file to R2 bucket
   * @param key - Object key (path) in bucket
   * @param data - File data as ArrayBuffer, ReadableStream, or string
   * @param contentType - MIME type
   */
  async upload(key, data, contentType) {
    try {
      await this.env.R2.put(key, data, {
        httpMetadata: {
          contentType
        }
      });
      return `https://storage.spaktok.com/${key}`;
    } catch (error) {
      console.error("R2 upload error:", error);
      throw new Error("Failed to upload file");
    }
  }
  /**
   * Upload video with multiple quality versions
   */
  async uploadVideo(videoId, videoData, contentType = "video/mp4") {
    const key = `videos/${videoId}/original.mp4`;
    const url = await this.upload(key, videoData, contentType);
    return { url, key };
  }
  /**
   * Upload thumbnail image
   */
  async uploadThumbnail(videoId, thumbnailData, contentType = "image/jpeg") {
    const key = `thumbnails/${videoId}/thumb.jpg`;
    const url = await this.upload(key, thumbnailData, contentType);
    return { url, key };
  }
  /**
   * Upload user avatar
   */
  async uploadAvatar(userId, avatarData, contentType = "image/jpeg") {
    const key = `avatars/${userId}/avatar.jpg`;
    const url = await this.upload(key, avatarData, contentType);
    return { url, key };
  }
  /**
   * Get file from R2
   */
  async get(key) {
    try {
      return await this.env.R2.get(key);
    } catch (error) {
      console.error("R2 get error:", error);
      return null;
    }
  }
  /**
   * Delete file from R2
   */
  async delete(key) {
    try {
      await this.env.R2.delete(key);
    } catch (error) {
      console.error("R2 delete error:", error);
      throw new Error("Failed to delete file");
    }
  }
  /**
   * Generate presigned URL for direct upload (future enhancement)
   */
  async generateUploadUrl(key, expiresIn = 3600) {
    return `https://api.spaktok.com/upload?key=${encodeURIComponent(key)}`;
  }
};

// src/services/analytics.service.ts
var AnalyticsService = class {
  constructor(env) {
    this.env = env;
  }
  static {
    __name(this, "AnalyticsService");
  }
  /**
   * Log API request metrics
   */
  async logRequest(endpoint, method, statusCode, duration, userId) {
    if (!this.env.ANALYTICS) return;
    try {
      await this.env.ANALYTICS.writeDataPoint({
        blobs: [endpoint, method, statusCode.toString()],
        doubles: [duration],
        indexes: [userId || "anonymous"]
      });
    } catch (error) {
      console.error("Analytics logging error:", error);
    }
  }
  /**
   * Log video view
   */
  async logVideoView(videoId, userId) {
    if (!this.env.ANALYTICS) return;
    try {
      await this.env.ANALYTICS.writeDataPoint({
        blobs: ["video_view", videoId],
        doubles: [Date.now()],
        indexes: [userId || "anonymous"]
      });
    } catch (error) {
      console.error("Analytics logging error:", error);
    }
  }
  /**
   * Log video upload
   */
  async logVideoUpload(videoId, userId, fileSize, duration) {
    if (!this.env.ANALYTICS) return;
    try {
      await this.env.ANALYTICS.writeDataPoint({
        blobs: ["video_upload", videoId, userId],
        doubles: [fileSize, duration],
        indexes: [userId]
      });
    } catch (error) {
      console.error("Analytics logging error:", error);
    }
  }
  /**
   * Log user action (like, comment, follow)
   */
  async logUserAction(action, userId, targetId) {
    if (!this.env.ANALYTICS) return;
    try {
      await this.env.ANALYTICS.writeDataPoint({
        blobs: [action, userId, targetId],
        doubles: [Date.now()],
        indexes: [userId]
      });
    } catch (error) {
      console.error("Analytics logging error:", error);
    }
  }
};

// src/services/video-processing.service.ts
var VideoProcessingService = class {
  constructor(env) {
    this.env = env;
  }
  static {
    __name(this, "VideoProcessingService");
  }
  TRANSCODING_PROFILES = [
    {
      quality: "360p",
      resolution: { width: 640, height: 360 },
      bitrate: 8e5,
      fps: 30
    },
    {
      quality: "720p",
      resolution: { width: 1280, height: 720 },
      bitrate: 25e5,
      fps: 30
    },
    {
      quality: "1080p",
      resolution: { width: 1920, height: 1080 },
      bitrate: 5e6,
      fps: 60
    },
    {
      quality: "4k",
      resolution: { width: 3840, height: 2160 },
      bitrate: 2e7,
      fps: 60
    }
  ];
  THUMBNAIL_CONFIG = {
    positions: [0, 25, 50, 75, 100],
    sizes: [
      { width: 320, height: 180, name: "small" },
      { width: 640, height: 360, name: "medium" },
      { width: 1280, height: 720, name: "large" }
    ]
  };
  /**
   * Start video processing pipeline
   * Returns immediately, processing happens asynchronously
   */
  async startProcessing(videoId, userId, sourceUrl, originalSize) {
    const job = {
      videoId,
      userId,
      sourceUrl,
      originalSize,
      startTime: (/* @__PURE__ */ new Date()).toISOString(),
      status: "pending"
    };
    await this.env.CACHE.put(
      `processing:${videoId}`,
      JSON.stringify(job),
      { expirationTtl: 3600 }
      // 1 hour
    );
    await this.env.DB.prepare(
      "UPDATE videos SET processing_status = ?, updated_at = ? WHERE id = ?"
    ).bind("processing", (/* @__PURE__ */ new Date()).toISOString(), videoId).run();
  }
  /**
   * Process video with GPU transcoding
   * This is a placeholder - actual implementation would use:
   * - Cloudflare Stream API
   * - GPU Workers for transcoding
   * - ffmpeg with GPU acceleration
   */
  async transcodeVideo(videoId, sourceUrl) {
    try {
      const variants = this.TRANSCODING_PROFILES.map((profile) => ({
        quality: profile.quality,
        url: `${sourceUrl.replace(".mp4", "")}_${profile.quality}.mp4`,
        size: Math.floor(this.estimateSize(profile))
      }));
      const duration = 60;
      await this.env.DB.prepare(
        `INSERT INTO video_variants (video_id, quality, url, size, created_at)
         VALUES ${variants.map(() => "(?, ?, ?, ?, ?)").join(", ")}`
      ).bind(
        ...variants.flatMap((v) => [
          videoId,
          v.quality,
          v.url,
          v.size,
          (/* @__PURE__ */ new Date()).toISOString()
        ])
      ).run();
      return { variants, duration };
    } catch (error) {
      console.error("Transcoding error:", error);
      throw error;
    }
  }
  /**
   * Generate thumbnails at key positions
   */
  async generateThumbnails(videoId, sourceUrl) {
    try {
      const thumbnails = [];
      for (const position of this.THUMBNAIL_CONFIG.positions) {
        for (const size of this.THUMBNAIL_CONFIG.sizes) {
          thumbnails.push({
            position,
            url: `https://cdn.spaktok.com/thumbnails/${videoId}/p${position}_${size.name}.jpg`,
            size: size.name
          });
        }
      }
      const selected = thumbnails.find((t) => t.position === 25 && t.size === "large").url;
      await this.env.DB.prepare(
        "UPDATE videos SET thumbnail_url = ? WHERE id = ?"
      ).bind(selected, videoId).run();
      return { thumbnails, selected };
    } catch (error) {
      console.error("Thumbnail generation error:", error);
      throw error;
    }
  }
  /**
   * Extract video metadata
   */
  async extractMetadata(videoId, sourceUrl) {
    try {
      const metadata = {
        duration: 60,
        width: 1080,
        height: 1920,
        fps: 60,
        codec: "h264",
        bitrate: 5e6,
        size: 375e5
        // ~37.5 MB for 60s
      };
      await this.env.DB.prepare(
        `UPDATE videos SET 
         duration = ?, width = ?, height = ?, 
         updated_at = ?
         WHERE id = ?`
      ).bind(
        metadata.duration,
        metadata.width,
        metadata.height,
        (/* @__PURE__ */ new Date()).toISOString(),
        videoId
      ).run();
      return metadata;
    } catch (error) {
      console.error("Metadata extraction error:", error);
      throw error;
    }
  }
  /**
   * Complete processing pipeline
   */
  async completeProcessing(videoId) {
    try {
      const video = await this.env.DB.prepare(
        "SELECT video_url FROM videos WHERE id = ?"
      ).bind(videoId).first();
      if (!video) {
        throw new Error("Video not found");
      }
      const sourceUrl = video.video_url;
      const metadata = await this.extractMetadata(videoId, sourceUrl);
      const { variants, duration } = await this.transcodeVideo(videoId, sourceUrl);
      const { thumbnails, selected } = await this.generateThumbnails(videoId, sourceUrl);
      await this.env.DB.prepare(
        `UPDATE videos SET 
         processing_status = ?,
         duration = ?,
         thumbnail_url = ?,
         updated_at = ?
         WHERE id = ?`
      ).bind(
        "completed",
        duration,
        selected,
        (/* @__PURE__ */ new Date()).toISOString(),
        videoId
      ).run();
      await this.env.CACHE.delete(`processing:${videoId}`);
      await this.logProcessingComplete(videoId, metadata, variants.length, thumbnails.length);
    } catch (error) {
      console.error("Complete processing error:", error);
      await this.failProcessing(videoId, error);
    }
  }
  /**
   * Mark processing as failed
   */
  async failProcessing(videoId, error) {
    await this.env.DB.prepare(
      "UPDATE videos SET processing_status = ? WHERE id = ?"
    ).bind("failed", videoId).run();
    await this.env.CACHE.put(
      `processing:error:${videoId}`,
      JSON.stringify({ error: String(error), timestamp: (/* @__PURE__ */ new Date()).toISOString() }),
      { expirationTtl: 86400 }
      // 24 hours
    );
  }
  /**
   * Get processing status
   */
  async getProcessingStatus(videoId) {
    const jobData = await this.env.CACHE.get(`processing:${videoId}`);
    return jobData ? JSON.parse(jobData) : null;
  }
  /**
   * Log processing analytics
   */
  async logProcessingComplete(videoId, metadata, variantCount, thumbnailCount) {
    await this.env.DB.prepare(
      `INSERT INTO video_processing_logs (
        video_id, duration, variants_created, thumbnails_created,
        original_size, processing_time, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      videoId,
      metadata.duration,
      variantCount,
      thumbnailCount,
      metadata.size,
      0,
      // Calculate from start time
      (/* @__PURE__ */ new Date()).toISOString()
    ).run();
  }
  /**
   * Estimate transcoded file size
   */
  estimateSize(profile) {
    return profile.bitrate * 60 / 8;
  }
};

// src/utils/region_age_policy.ts
var DEFAULT_REGION_AGE_POLICY = {
  "US": { minimumAge: 13, policyName: "COPPA", notes: "Children Online Privacy Protection Act" },
  "EU": { minimumAge: 16, residencyRequired: true, policyName: "GDPR", notes: "General Data Protection Regulation" },
  "UK": { minimumAge: 13, residencyRequired: true, policyName: "DSA", notes: "Digital Services Act" },
  "CA": { minimumAge: 13, policyName: "PIPEDA" },
  "BR": { minimumAge: 12, policyName: "LGPD" },
  "IN": { minimumAge: 18, policyName: "IT Rules" },
  "RU": { minimumAge: 14, policyName: "FZ-152" },
  "CN": { minimumAge: 14, policyName: "PIPL" },
  "KR": { minimumAge: 14, policyName: "PIPA" },
  "JP": { minimumAge: 13, policyName: "APPI" },
  "GLOBAL": { minimumAge: 13, policyName: "Default" }
};
async function loadRegionAgePolicy(env) {
  try {
    if (env.CONFIG) {
      const raw = await env.CONFIG.get("REGION_AGE_POLICY", "json");
      if (raw && typeof raw === "object") return raw;
    }
  } catch {
  }
  return DEFAULT_REGION_AGE_POLICY;
}
__name(loadRegionAgePolicy, "loadRegionAgePolicy");
function resolveUserRegion({ ip, locale, profileRegion }) {
  if (profileRegion) return profileRegion;
  if (locale && locale.length >= 2) return locale.slice(-2).toUpperCase();
  return "GLOBAL";
}
__name(resolveUserRegion, "resolveUserRegion");
function getMinimumAgeForRegion(policy, region) {
  return policy[region]?.minimumAge ?? policy["GLOBAL"].minimumAge;
}
__name(getMinimumAgeForRegion, "getMinimumAgeForRegion");
function isResidencyRequired(policy, region) {
  return !!policy[region]?.residencyRequired;
}
__name(isResidencyRequired, "isResidencyRequired");

// src/utils/guard.ts
async function ensureMinimumAgeRegionAware(env, userId, userContext) {
  const policy = await loadRegionAgePolicy(env);
  const region = resolveUserRegion(userContext);
  const requiredAge = getMinimumAgeForRegion(policy, region);
  const residencyRequired = isResidencyRequired(policy, region);
  const policyName = policy[region]?.policyName;
  let requiredClass = "u13";
  if (requiredAge >= 18) requiredClass = "u18";
  else if (requiredAge >= 16) requiredClass = "u16";
  if (requiredAge >= 21) requiredClass = "adult";
  const allowed = await ensureMinimumAge(env, userId, requiredClass);
  return { allowed, requiredAge, region, residencyRequired, policyName };
}
__name(ensureMinimumAgeRegionAware, "ensureMinimumAgeRegionAware");
async function ensureMinimumAge(env, userId, requiredClass) {
  try {
    let row = await env.DB.prepare("SELECT ageClass, verified FROM age_verification WHERE userId=?1").bind(userId).first();
    if (!row) {
      try {
        row = await env.DB.prepare("SELECT ageClass, verified FROM age_verification WHERE user_id=?1").bind(userId).first();
      } catch {
      }
    }
    if (!row) return false;
    const order = ["u13", "u16", "u18", "adult"];
    const idxUser = order.indexOf(String(row.ageClass || ""));
    const idxReq = order.indexOf(requiredClass);
    if (idxUser < 0 || idxReq < 0) return false;
    return idxUser >= idxReq && (row.verified === 1 || row.verified === true);
  } catch {
    return false;
  }
}
__name(ensureMinimumAge, "ensureMinimumAge");
async function isCountryRestricted(env, countryCode) {
  try {
    const row = await env.DB.prepare("SELECT active FROM restricted_countries WHERE code=?1").bind(countryCode).first();
    return !!row && row.active === 1;
  } catch {
    return false;
  }
}
__name(isCountryRestricted, "isCountryRestricted");

// src/middleware.ts
init_jwt_utils();
var GLOBAL_RATE_LIMIT = 100;
var LOGIN_RATE_LIMIT = 5;
var REGISTER_RATE_LIMIT = 3;
var corsMiddleware = /* @__PURE__ */ __name(async (request, env) => {
  const origin = env.FRONTEND_ORIGIN || "*";
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400"
      }
    });
  }
  return null;
}, "corsMiddleware");
var rateLimitMiddleware = /* @__PURE__ */ __name(async (request, env) => {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const url = new URL(request.url);
  const path = url.pathname;
  let limit = GLOBAL_RATE_LIMIT;
  let bucket = "global";
  if (path.startsWith("/auth/login")) {
    limit = LOGIN_RATE_LIMIT;
    bucket = "login";
  } else if (path.startsWith("/auth/register")) {
    limit = REGISTER_RATE_LIMIT;
    bucket = "register";
  }
  const key = `rate:${bucket}:${ip}`;
  const current = await env.RATE_LIMIT.get(key);
  const count = current ? parseInt(current) : 0;
  if (count >= limit) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests, slow down",
          bucket,
          limit
        }
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60"
        }
      }
    );
  }
  await env.RATE_LIMIT.put(key, (count + 1).toString(), { expirationTtl: 60 });
  return null;
}, "rateLimitMiddleware");
async function requireAuth2(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid authorization header"
        }
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  const token = authHeader.substring(7);
  if (env.FIREBASE_PROJECT_ID) {
    try {
      const firebaseUser = await verifyFirebaseToken(token, env);
      if (firebaseUser) {
        const user = await getOrCreateUserFromFirebase(env, firebaseUser);
        if (user) {
          return {
            userId: user.id,
            type: "access",
            iat: Math.floor(Date.now() / 1e3),
            exp: Math.floor(Date.now() / 1e3) + 3600
          };
        }
      }
    } catch (error) {
      console.debug("Firebase token verification failed, trying Workers JWT:", error);
    }
  }
  try {
    const payload = await verifyToken(token, env);
    if (!payload || payload.type !== "access") {
      throw new Error("Invalid token type");
    }
    return payload;
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token"
        }
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
__name(requireAuth2, "requireAuth");
async function applyMiddleware(request, env, ctx) {
  const corsSpan = startSpan("middleware.cors");
  const corsResult = await corsMiddleware(request, env, ctx);
  await endSpan(env, corsSpan, "cors");
  if (corsResult) return corsResult;
  const rateSpan = startSpan("middleware.rate");
  const rateLimitResult = await rateLimitMiddleware(request, env, ctx);
  await endSpan(env, rateSpan, "rateLimit");
  if (rateLimitResult) return rateLimitResult;
  const geo = request.headers.get("CF-IPCountry");
  if (geo) {
    const restricted = await isCountryRestricted(env, geo);
    if (restricted) {
      return new Response(JSON.stringify({ success: false, error: { code: "REGION_BLOCKED", message: "Service not available in your country" } }), { status: 451, headers: { "Content-Type": "application/json" } });
    }
  }
  return null;
}
__name(applyMiddleware, "applyMiddleware");
function addCorsHeaders(response, env) {
  const origin = env?.FRONTEND_ORIGIN || "*";
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", origin);
  newHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  newHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
__name(addCorsHeaders, "addCorsHeaders");

// src/handlers/video.handler.ts
var upload = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  return withSpan("video.upload", env, async () => {
    const authResult = await requireAuth2(request, env);
    if (authResult instanceof Response) return authResult;
    const userId = authResult.userId;
    const ageCheck = await ensureMinimumAgeRegionAware(env, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed) {
      return new Response(
        JSON.stringify({ success: false, error: { code: "AGE_RESTRICTED", message: "User does not meet regional minimum age requirements for uploading." } }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    try {
      const formData = await request.formData();
      const videoFile = formData.get("video");
      const title = formData.get("title");
      const description = formData.get("description");
      const hashtagsStr = formData.get("hashtags");
      if (!videoFile || !title) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "Video file and title are required"
            }
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      const videoId = crypto.randomUUID();
      const storage = new StorageService(env);
      const db = new DatabaseService(env);
      const cache = new CacheService(env);
      const analytics = new AnalyticsService(env);
      const videoBuffer = await videoFile.arrayBuffer();
      const { url: videoUrl } = await storage.uploadVideo(
        videoId,
        videoBuffer,
        videoFile.type
      );
      const thumbnailUrl = `https://storage.spaktok.com/thumbnails/${videoId}/thumb.jpg`;
      const hashtags = hashtagsStr ? JSON.parse(hashtagsStr) : void 0;
      const video = await db.createVideo({
        userId,
        title,
        description: description || void 0,
        videoUrl,
        thumbnailUrl,
        duration: 0,
        // TODO: Extract from video metadata
        width: 1080,
        height: 1920,
        hashtags
      });
      ctx.waitUntil(
        analytics.logVideoUpload(videoId, userId, videoBuffer.byteLength, 0)
      );
      ctx.waitUntil(cache.invalidateFeed(null));
      const processingService = new VideoProcessingService(env);
      ctx.waitUntil(
        processingService.startProcessing(videoId, userId, videoUrl, videoBuffer.byteLength).then(() => processingService.completeProcessing(videoId)).catch((error) => {
          console.error("Video processing failed:", error);
          processingService.failProcessing(videoId, error);
        })
      );
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            video,
            message: "Video uploaded successfully. Processing in progress.",
            processingStatus: "pending"
          }
        }),
        {
          status: 201,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Video upload error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to upload video"
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  });
}, "upload");
var get = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  try {
    const videoId = params.id;
    if (!videoId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Video ID is required"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const cache = new CacheService(env);
    const db = new DatabaseService(env);
    const analytics = new AnalyticsService(env);
    let video = await cache.getVideo(videoId);
    if (!video) {
      const result = await env.DB.prepare(
        "SELECT * FROM videos WHERE id = ?"
      ).bind(videoId).first();
      if (!result) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "Video not found"
            }
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      video = result;
      ctx.waitUntil(cache.cacheVideo(videoId, video));
    }
    ctx.waitUntil(analytics.logVideoView(videoId));
    return new Response(
      JSON.stringify({
        success: true,
        data: { video }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Get video error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to retrieve video"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "get");
var like = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const videoId = params.id;
  try {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO likes (user_id, video_id, created_at) VALUES (?, ?, ?)"
    ).bind(userId, videoId, (/* @__PURE__ */ new Date()).toISOString()).run();
    await env.DB.prepare(
      "UPDATE videos SET likes_count = likes_count + 1 WHERE id = ?"
    ).bind(videoId).run();
    const cache = new CacheService(env);
    ctx.waitUntil(cache.invalidateVideo(videoId));
    const analytics = new AnalyticsService(env);
    ctx.waitUntil(analytics.logUserAction("like", userId, videoId));
    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Video liked successfully" }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Like video error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to like video"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "like");
var unlike = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const videoId = params.id;
  try {
    await env.DB.prepare(
      "DELETE FROM likes WHERE user_id = ? AND video_id = ?"
    ).bind(userId, videoId).run();
    await env.DB.prepare(
      "UPDATE videos SET likes_count = likes_count - 1 WHERE id = ? AND likes_count > 0"
    ).bind(videoId).run();
    const cache = new CacheService(env);
    ctx.waitUntil(cache.invalidateVideo(videoId));
    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Video unliked successfully" }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Unlike video error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to unlike video"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "unlike");
var addComment = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const videoId = params.id;
  try {
    const body = await request.json();
    if (!body.content) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Comment content is required"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const commentId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      `INSERT INTO comments (id, video_id, user_id, content, likes_count, replies_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 0, ?, ?)`
    ).bind(commentId, videoId, userId, body.content, now, now).run();
    await env.DB.prepare(
      "UPDATE videos SET comments_count = comments_count + 1 WHERE id = ?"
    ).bind(videoId).run();
    const cache = new CacheService(env);
    ctx.waitUntil(cache.invalidateVideo(videoId));
    const analytics = new AnalyticsService(env);
    ctx.waitUntil(analytics.logUserAction("comment", userId, videoId));
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          comment: {
            id: commentId,
            videoId,
            userId,
            content: body.content,
            likesCount: 0,
            repliesCount: 0,
            createdAt: now,
            updatedAt: now
          }
        }
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Add comment error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to add comment"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "addComment");
var getProcessingStatus = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const videoId = params.id;
  try {
    const processingService = new VideoProcessingService(env);
    const status = await processingService.getProcessingStatus(videoId);
    const video = await env.DB.prepare(
      "SELECT processing_status, duration, thumbnail_url FROM videos WHERE id = ?"
    ).bind(videoId).first();
    if (!video) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Video not found" }
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          videoId,
          processingStatus: video.processing_status,
          duration: video.duration,
          thumbnailUrl: video.thumbnail_url,
          jobStatus: status
        }
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Get processing status error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to get status" }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "getProcessingStatus");

// src/handlers/user.handler.ts
var me = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const cache = new CacheService(env);
    const db = new DatabaseService(env);
    let user = await cache.getUserProfile(userId);
    if (!user) {
      user = await db.getUserById(userId);
      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "User not found"
            }
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      ctx.waitUntil(cache.cacheUserProfile(userId, user));
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return new Response(
      JSON.stringify({
        success: true,
        data: { user: userWithoutPassword }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get user profile"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "me");
var get2 = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  try {
    const userId = params.id;
    if (!userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "User ID is required"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const cache = new CacheService(env);
    const db = new DatabaseService(env);
    let user = await cache.getUserProfile(userId);
    if (!user) {
      user = await db.getUserById(userId);
      if (!user) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "User not found"
            }
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      ctx.waitUntil(cache.cacheUserProfile(userId, user));
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return new Response(
      JSON.stringify({
        success: true,
        data: { user: userWithoutPassword }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Get user error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get user profile"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "get");
var update = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const currentUserId = authResult.userId;
  const targetUserId = params.id;
  if (currentUserId !== targetUserId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You can only update your own profile"
        }
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  try {
    const body = await request.json();
    const updates = [];
    const values = [];
    if (body.displayName) {
      updates.push("display_name = ?");
      values.push(body.displayName);
    }
    if (body.bio !== void 0) {
      updates.push("bio = ?");
      values.push(body.bio);
    }
    if (body.avatarUrl) {
      updates.push("avatar_url = ?");
      values.push(body.avatarUrl);
    }
    if (updates.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "No fields to update"
          }
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    updates.push("updated_at = ?");
    values.push((/* @__PURE__ */ new Date()).toISOString());
    values.push(targetUserId);
    await env.DB.prepare(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`
    ).bind(...values).run();
    const cache = new CacheService(env);
    ctx.waitUntil(cache.invalidateUser(targetUserId));
    const db = new DatabaseService(env);
    const user = await db.getUserById(targetUserId);
    if (!user) {
      throw new Error("Failed to retrieve updated user");
    }
    const { passwordHash, ...userWithoutPassword } = user;
    return new Response(
      JSON.stringify({
        success: true,
        data: { user: userWithoutPassword }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Update user error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update user profile"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "update");
var follow = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const followerId = authResult.userId;
  const followingId = params.id;
  if (followerId === followingId) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "You cannot follow yourself"
        }
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  try {
    await env.DB.prepare(
      "INSERT OR IGNORE INTO followers (follower_id, following_id, created_at) VALUES (?, ?, ?)"
    ).bind(followerId, followingId, (/* @__PURE__ */ new Date()).toISOString()).run();
    await env.DB.prepare(
      "UPDATE users SET following_count = following_count + 1 WHERE id = ?"
    ).bind(followerId).run();
    await env.DB.prepare(
      "UPDATE users SET followers_count = followers_count + 1 WHERE id = ?"
    ).bind(followingId).run();
    const cache = new CacheService(env);
    ctx.waitUntil(Promise.all([
      cache.invalidateUser(followerId),
      cache.invalidateUser(followingId)
    ]));
    const analytics = new AnalyticsService(env);
    ctx.waitUntil(analytics.logUserAction("follow", followerId, followingId));
    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Followed successfully" }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Follow user error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to follow user"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "follow");
var unfollow = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const followerId = authResult.userId;
  const followingId = params.id;
  try {
    await env.DB.prepare(
      "DELETE FROM followers WHERE follower_id = ? AND following_id = ?"
    ).bind(followerId, followingId).run();
    await env.DB.prepare(
      "UPDATE users SET following_count = following_count - 1 WHERE id = ? AND following_count > 0"
    ).bind(followerId).run();
    await env.DB.prepare(
      "UPDATE users SET followers_count = followers_count - 1 WHERE id = ? AND followers_count > 0"
    ).bind(followingId).run();
    const cache = new CacheService(env);
    ctx.waitUntil(Promise.all([
      cache.invalidateUser(followerId),
      cache.invalidateUser(followingId)
    ]));
    return new Response(
      JSON.stringify({
        success: true,
        data: { message: "Unfollowed successfully" }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Unfollow user error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to unfollow user"
        }
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}, "unfollow");

// src/handlers/chat.handler.stable.ts
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonResponse, "jsonResponse");
var getConversations = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const conversations = await env.DB.prepare(
      `SELECT 
        c.id, c.user1_id, c.user2_id, c.last_message_content,
        c.last_message_at, c.unread_count, c.created_at,
        u1.username as user1_username, u1.avatar_url as user1_avatar,
        u2.username as user2_username, u2.avatar_url as user2_avatar
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.last_message_at DESC`
    ).bind(userId, userId).all();
    const participantIds = conversations.results.flatMap((conv) => [
      conv.user1_id,
      conv.user2_id
    ]);
    const presenceMap = /* @__PURE__ */ new Map();
    await Promise.all(participantIds.map(async (id) => {
      const presenceData = await env.CACHE.get(`presence:${id}`);
      if (presenceData) {
        presenceMap.set(id, JSON.parse(presenceData));
      } else {
        presenceMap.set(id, {
          userId: id,
          status: "offline",
          lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
          isTyping: false
        });
      }
    }));
    const enhancedConversations = conversations.results.map((conv) => {
      const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
      const presence = presenceMap.get(otherUserId);
      return {
        ...conv,
        otherUser: {
          id: otherUserId,
          username: conv.user1_id === userId ? conv.user2_username : conv.user1_username,
          avatarUrl: conv.user1_id === userId ? conv.user2_avatar : conv.user1_avatar,
          presence
        }
      };
    });
    return jsonResponse({
      success: true,
      data: { conversations: enhancedConversations }
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return jsonResponse({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to fetch conversations"
      }
    }, 500);
  }
}, "getConversations");
var getMessages = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const conversationId = params.id;
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  const before = url.searchParams.get("before");
  try {
    const conversation = await env.DB.prepare(
      "SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)"
    ).bind(conversationId, userId, userId).first();
    if (!conversation) {
      return jsonResponse({
        success: false,
        error: { code: "NOT_FOUND", message: "Conversation not found" }
      }, 404);
    }
    let query = `
      SELECT m.*, u.username, u.avatar_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
    `;
    const bindings = [conversationId];
    if (before) {
      query += " AND m.created_at < ?";
      bindings.push(before);
    }
    query += " ORDER BY m.created_at DESC LIMIT ?";
    bindings.push(limit);
    const messages = await env.DB.prepare(query).bind(...bindings).all();
    const undeliveredIds = messages.results.filter((m) => m.receiver_id === userId && !m.delivered_at).map((m) => m.id);
    if (undeliveredIds.length > 0) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await Promise.all(undeliveredIds.map(
        (id) => env.DB.prepare(
          "UPDATE messages SET status = ?, delivered_at = ? WHERE id = ?"
        ).bind("delivered", now, id).run()
      ));
    }
    const ghostMessages = messages.results.filter(
      (m) => m.receiver_id === userId && m.ghost_mode && !m.read_at
    );
    if (ghostMessages.length > 0) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      await Promise.all(ghostMessages.map(
        (m) => env.DB.prepare(
          "UPDATE messages SET is_read = 1, read_at = ?, status = ? WHERE id = ?"
        ).bind(now, "read", m.id).run()
      ));
    }
    await env.CACHE.put(
      `activity:${userId}:${conversationId}`,
      JSON.stringify({ status: "open", openedAt: (/* @__PURE__ */ new Date()).toISOString() }),
      { expirationTtl: 300 }
    );
    return jsonResponse({
      success: true,
      data: {
        messages: messages.results.reverse(),
        hasMore: messages.results.length === limit
      }
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return jsonResponse({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to fetch messages" }
    }, 500);
  }
}, "getMessages");
var sendMessage = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const body = await request.json();
    const {
      conversationId,
      receiverId,
      content,
      mediaUrl,
      mediaType,
      encryptionMetadata,
      ghostMode = false,
      deleteOnView = false,
      sensitivityLevel = "medium"
    } = body;
    if (!content && !mediaUrl) {
      return jsonResponse({
        success: false,
        error: { code: "BAD_REQUEST", message: "Content or media required" }
      }, 400);
    }
    let finalConversationId = conversationId;
    if (!conversationId && receiverId) {
      const existing = await env.DB.prepare(
        `SELECT id FROM conversations 
         WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`
      ).bind(userId, receiverId, receiverId, userId).first();
      if (existing) {
        finalConversationId = existing.id;
      } else {
        const newConvId = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO conversations (id, user1_id, user2_id, created_at)
           VALUES (?, ?, ?, ?)`
        ).bind(newConvId, userId, receiverId, (/* @__PURE__ */ new Date()).toISOString()).run();
        finalConversationId = newConvId;
      }
    }
    let expiresAt;
    if (ghostMode) {
      const expirationMinutes = {
        low: 1440,
        // 24 hours
        medium: 60,
        // 1 hour
        high: 5,
        critical: 1
      }[sensitivityLevel] || 60;
      expiresAt = new Date(Date.now() + expirationMinutes * 6e4).toISOString();
    }
    const messageId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      `INSERT INTO messages (
        id, conversation_id, sender_id, receiver_id, content,
        media_url, media_type, status, created_at,
        ghost_mode, delete_on_view, sensitivity_level,
        encryption_metadata, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      messageId,
      finalConversationId,
      userId,
      receiverId || null,
      content,
      mediaUrl || null,
      mediaType || null,
      "sent",
      now,
      ghostMode ? 1 : 0,
      deleteOnView ? 1 : 0,
      sensitivityLevel,
      encryptionMetadata ? JSON.stringify(encryptionMetadata) : null,
      expiresAt || null
    ).run();
    await env.DB.prepare(
      `UPDATE conversations 
       SET last_message_content = ?, last_message_at = ?, unread_count = unread_count + 1
       WHERE id = ?`
    ).bind(content || "[Media]", now, finalConversationId).run();
    await env.CACHE.delete(`conv:list:${userId}`);
    await env.CACHE.delete(`conv:list:${receiverId}`);
    return jsonResponse({
      success: true,
      data: {
        message: {
          id: messageId,
          conversationId: finalConversationId,
          senderId: userId,
          receiverId,
          content,
          mediaUrl,
          mediaType,
          status: "sent",
          createdAt: now,
          ghostMode,
          expiresAt
        }
      }
    }, 201);
  } catch (error) {
    console.error("Error sending message:", error);
    return jsonResponse({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to send message" }
    }, 500);
  }
}, "sendMessage");
var startTyping = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const body = await request.json();
    const { conversationId } = body;
    const now = /* @__PURE__ */ new Date();
    const expiresAt = new Date(now.getTime() + 5e3);
    const indicator = {
      conversationId,
      userId,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    await env.CACHE.put(
      `typing:${conversationId}:${userId}`,
      JSON.stringify(indicator),
      { expirationTtl: 5 }
    );
    return jsonResponse({ success: true, data: indicator });
  } catch (error) {
    console.error("Error starting typing:", error);
    return jsonResponse({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to start typing" }
    }, 500);
  }
}, "startTyping");
var stopTyping = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const body = await request.json();
    const { conversationId } = body;
    await env.CACHE.delete(`typing:${conversationId}:${userId}`);
    return jsonResponse({ success: true, data: null });
  } catch (error) {
    console.error("Error stopping typing:", error);
    return jsonResponse({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to stop typing" }
    }, 500);
  }
}, "stopTyping");
var updatePresence = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const body = await request.json();
    const { status, currentConversationId } = body;
    const presence = {
      userId,
      status,
      lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
      isTyping: false,
      currentConversationId
    };
    await env.CACHE.put(
      `presence:${userId}`,
      JSON.stringify(presence),
      { expirationTtl: 30 }
    );
    return jsonResponse({ success: true, data: presence });
  } catch (error) {
    console.error("Error updating presence:", error);
    return jsonResponse({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to update presence" }
    }, 500);
  }
}, "updatePresence");
var getPresence = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const targetUserId = params.userId;
  try {
    const presenceData = await env.CACHE.get(`presence:${targetUserId}`);
    let presence;
    if (presenceData) {
      presence = JSON.parse(presenceData);
    } else {
      presence = {
        userId: targetUserId,
        status: "offline",
        lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
        isTyping: false
      };
    }
    return jsonResponse({ success: true, data: presence });
  } catch (error) {
    console.error("Error getting presence:", error);
    return jsonResponse({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to get presence" }
    }, 500);
  }
}, "getPresence");
var deleteMessage = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const messageId = params.id;
  try {
    const message = await env.DB.prepare(
      "SELECT * FROM messages WHERE id = ? AND sender_id = ?"
    ).bind(messageId, userId).first();
    if (!message) {
      return jsonResponse({
        success: false,
        error: { code: "NOT_FOUND", message: "Message not found" }
      }, 404);
    }
    if (message.ghost_mode) {
      await env.DB.prepare("DELETE FROM messages WHERE id = ?").bind(messageId).run();
      await env.CACHE.delete(`msg:${messageId}`);
    } else {
      await env.DB.prepare(
        "UPDATE messages SET status = ?, deleted_at = ? WHERE id = ?"
      ).bind("deleted", (/* @__PURE__ */ new Date()).toISOString(), messageId).run();
    }
    return jsonResponse({ success: true, data: null });
  } catch (error) {
    console.error("Error deleting message:", error);
    return jsonResponse({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to delete message" }
    }, 500);
  }
}, "deleteMessage");

// src/services/ads.service.ts
var AdsService = class {
  constructor(env) {
    this.env = env;
  }
  static {
    __name(this, "AdsService");
  }
  /**
   * Get ads to display for a user (AI-powered selection)
   */
  async getAdsForUser(userId, placement, limit = 4) {
    const user = await this.env.DB.prepare(
      "SELECT age, gender, country, city, interests FROM users WHERE id = ?"
    ).bind(userId).first();
    if (!user) return [];
    const engagementLevel = await this.calculateUserEngagementLevel(userId);
    const campaigns = await this.env.DB.prepare(
      `SELECT DISTINCT c.id, c.budget_remaining, c.bid_amount, c.pricing_model
       FROM ad_campaigns c
       JOIN ad_targeting t ON c.id = t.campaign_id
       WHERE c.status = 'active'
         AND c.budget_remaining > 0
         AND datetime(c.start_date) <= datetime('now')
         AND datetime(c.end_date) >= datetime('now')
         AND (t.age_min IS NULL OR t.age_min <= ?)
         AND (t.age_max IS NULL OR t.age_max >= ?)
         AND (t.engagement_level = ? OR t.engagement_level = 'all')
       ORDER BY c.bid_amount DESC
       LIMIT 20`
    ).bind(user.age || 25, user.age || 25, engagementLevel).all();
    if (campaigns.results.length === 0) return [];
    const campaignIds = campaigns.results.map((c) => c.id).join("','");
    const creatives = await this.env.DB.prepare(
      `SELECT * FROM ad_creatives
       WHERE campaign_id IN ('${campaignIds}')
         AND status = 'approved'
       ORDER BY RANDOM()
       LIMIT ?`
    ).bind(limit).all();
    for (const creative of creatives.results) {
      await this.trackImpression({
        creativeId: creative.id,
        campaignId: creative.campaign_id,
        userId,
        placement,
        format: creative.format,
        position: 0
      });
    }
    return creatives.results;
  }
  /**
   * Get adaptive ad layout (grid vs fullscreen)
   * Returns optimal format based on user behavior and available budget
   */
  async getAdaptiveAdLayout(userId, scrollPosition) {
    const isFullscreenSlot = scrollPosition % 10 === 0;
    if (isFullscreenSlot) {
      const fullscreenAds = await this.getPremiumFullscreenAds(userId, 1);
      if (fullscreenAds.length > 0) {
        return { format: "fullscreen", ads: fullscreenAds };
      }
    }
    const gridAds = await this.getGridAds(userId, 4);
    return { format: "grid", ads: gridAds };
  }
  /**
   * Get premium fullscreen ads (highest bidders)
   */
  async getPremiumFullscreenAds(userId, limit = 1) {
    const user = await this.env.DB.prepare(
      "SELECT age, gender, country FROM users WHERE id = ?"
    ).bind(userId).first();
    if (!user) return [];
    const creatives = await this.env.DB.prepare(
      `SELECT c.*, cam.bid_amount
       FROM ad_creatives c
       JOIN ad_campaigns cam ON c.campaign_id = cam.id
       JOIN ad_targeting t ON cam.id = t.campaign_id
       WHERE c.format = 'fullscreen'
         AND c.status = 'approved'
         AND cam.status = 'active'
         AND cam.budget_remaining > cam.bid_amount
         AND datetime(cam.start_date) <= datetime('now')
         AND datetime(cam.end_date) >= datetime('now')
         AND (t.age_min IS NULL OR t.age_min <= ?)
         AND (t.age_max IS NULL OR t.age_max >= ?)
       ORDER BY cam.bid_amount DESC
       LIMIT ?`
    ).bind(user.age || 25, user.age || 25, limit).all();
    return creatives.results;
  }
  /**
   * Get grid ads (4 per view, lower cost entry point)
   */
  async getGridAds(userId, limit = 4) {
    const user = await this.env.DB.prepare(
      "SELECT age, gender, interests FROM users WHERE id = ?"
    ).bind(userId).first();
    if (!user) return [];
    const creatives = await this.env.DB.prepare(
      `SELECT c.*, cam.bid_amount
       FROM ad_creatives c
       JOIN ad_campaigns cam ON c.campaign_id = cam.id
       WHERE c.format = 'grid'
         AND c.status = 'approved'
         AND cam.status = 'active'
         AND cam.budget_remaining > 0
         AND datetime(cam.start_date) <= datetime('now')
         AND datetime(cam.end_date) >= datetime('now')
       ORDER BY cam.bid_amount DESC, RANDOM()
       LIMIT ?`
    ).bind(limit).all();
    return creatives.results.map((creative, index) => ({
      ...creative,
      layoutPosition: index % 4 + 1
    }));
  }
  /**
   * Track ad impression
   */
  async trackImpression(data) {
    const impressionId = crypto.randomUUID();
    const campaign = await this.env.DB.prepare(
      "SELECT pricing_model, bid_amount FROM ad_campaigns WHERE id = ?"
    ).bind(data.campaignId).first();
    if (!campaign) return;
    let cost = 0;
    if (campaign.pricing_model === "cpm") {
      cost = campaign.bid_amount / 1e3;
    }
    await this.env.DB.prepare(
      `INSERT INTO ad_impressions (
        id, creative_id, campaign_id, user_id,
        placement, format, position, cost_usd,
        viewed, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
    ).bind(
      impressionId,
      data.creativeId,
      data.campaignId,
      data.userId,
      data.placement,
      data.format,
      data.position,
      cost,
      (/* @__PURE__ */ new Date()).toISOString()
    ).run();
    await this.env.DB.prepare(
      `UPDATE ad_campaigns 
       SET impressions = impressions + 1,
           budget_spent = budget_spent + ?,
           budget_remaining = budget_remaining - ?
       WHERE id = ?`
    ).bind(cost, cost, data.campaignId).run();
    await this.env.DB.prepare(
      "UPDATE ad_creatives SET impressions = impressions + 1 WHERE id = ?"
    ).bind(data.creativeId).run();
  }
  /**
   * Track ad click
   */
  async trackClick(impressionId, userId) {
    const impression = await this.env.DB.prepare(
      "SELECT creative_id, campaign_id, cost_usd FROM ad_impressions WHERE id = ?"
    ).bind(impressionId).first();
    if (!impression) return;
    const campaign = await this.env.DB.prepare(
      "SELECT pricing_model, bid_amount FROM ad_campaigns WHERE id = ?"
    ).bind(impression.campaign_id).first();
    if (!campaign) return;
    let additionalCost = 0;
    if (campaign.pricing_model === "cpc") {
      additionalCost = campaign.bid_amount;
    }
    await this.env.DB.prepare(
      "UPDATE ad_impressions SET clicked = 1, cost_usd = cost_usd + ? WHERE id = ?"
    ).bind(additionalCost, impressionId).run();
    await this.env.DB.prepare(
      `UPDATE ad_campaigns 
       SET clicks = clicks + 1,
           budget_spent = budget_spent + ?,
           budget_remaining = budget_remaining - ?
       WHERE id = ?`
    ).bind(additionalCost, additionalCost, impression.campaign_id).run();
    await this.env.DB.prepare(
      `UPDATE ad_creatives 
       SET clicks = clicks + 1,
           ctr = CAST(clicks + 1 AS REAL) / CAST(impressions AS REAL) * 100
       WHERE id = ?`
    ).bind(impression.creative_id).run();
  }
  /**
   * Calculate user engagement level (for targeting)
   */
  async calculateUserEngagementLevel(userId) {
    const activity = await this.env.DB.prepare(
      `SELECT 
         (SELECT COUNT(*) FROM video_likes WHERE user_id = ? AND created_at > datetime('now', '-7 days')) as likes,
         (SELECT COUNT(*) FROM comments WHERE user_id = ? AND created_at > datetime('now', '-7 days')) as comments,
         (SELECT COUNT(*) FROM shares WHERE user_id = ? AND created_at > datetime('now', '-7 days')) as shares
      `
    ).bind(userId, userId, userId).first();
    if (!activity) return "low";
    const totalEngagements = activity.likes + activity.comments + activity.shares;
    if (totalEngagements > 50) return "high";
    if (totalEngagements > 10) return "medium";
    return "low";
  }
  /**
   * Get recommended pricing for advertiser based on goals
   */
  async getRecommendedPricing(targetAudience, format, duration) {
    const baseCPM = format === "grid" ? 2.5 : 5;
    const estimatedImpressions = targetAudience * duration * 3;
    const recommendedBudget = estimatedImpressions / 1e3 * baseCPM;
    const avgCTR = format === "grid" ? 0.02 : 0.04;
    const estimatedClicks = Math.round(estimatedImpressions * avgCTR);
    let tierName = "starter";
    if (recommendedBudget > 1e4) tierName = "premium";
    else if (recommendedBudget > 1e3) tierName = "growth";
    return {
      tierName,
      minBudget: Math.max(100, recommendedBudget * 0.5),
      recommendedBudget: Math.round(recommendedBudget),
      estimatedImpressions,
      estimatedClicks
    };
  }
  /**
   * Create new ad campaign
   */
  async createCampaign(data) {
    const campaignId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await this.env.DB.prepare(
      `INSERT INTO ad_campaigns (
        id, advertiser_id, name, budget_total, budget_daily,
        budget_remaining, pricing_model, bid_amount,
        start_date, end_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(
      campaignId,
      data.advertiserId,
      data.name,
      data.budgetTotal,
      data.budgetDaily,
      data.budgetTotal,
      data.pricingModel,
      data.bidAmount,
      data.startDate,
      data.endDate,
      now,
      now
    ).run();
    return campaignId;
  }
  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId) {
    const campaign = await this.env.DB.prepare(
      "SELECT * FROM ad_campaigns WHERE id = ?"
    ).bind(campaignId).first();
    if (!campaign) {
      throw new Error("Campaign not found");
    }
    const ctr = campaign.impressions ? campaign.clicks / campaign.impressions * 100 : 0;
    const roi = campaign.budget_spent ? campaign.conversions * 10 / campaign.budget_spent : 0;
    return {
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      ctr,
      spent: campaign.budget_spent,
      remaining: campaign.budget_remaining,
      roi
    };
  }
};

// src/utils/legal_telemetry.ts
async function logLegalEvent(env, event) {
  const span = startSpan("legal.logEvent", { eventType: event.eventType, userId: event.userId });
  try {
    await env.DB.prepare(
      `INSERT INTO legal_audit_log (user_id, event_type, details, ip_address, user_agent, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      event.userId,
      event.eventType,
      JSON.stringify(event.details),
      event.ipAddress || "unknown",
      event.userAgent || "unknown",
      event.timestamp
    ).run();
    const key = `legal:${event.userId}:${event.eventType}:${event.timestamp}`;
    await env.CACHE.put(key, JSON.stringify(event), { expirationTtl: 2592e3 });
    console.log(`[LEGAL] ${event.eventType} for user ${event.userId}`, event.details);
  } catch (error) {
    console.error("Failed to log legal event:", error);
  } finally {
    await endSpan(env, span, "legal.log");
  }
}
__name(logLegalEvent, "logLegalEvent");
async function logConsentChange(env, userId, consentType, granted, request) {
  await logLegalEvent(env, {
    userId,
    eventType: granted ? "consent_granted" : "consent_withdrawn",
    details: { consentType, granted },
    ipAddress: request.headers.get("CF-Connecting-IP") || void 0,
    userAgent: request.headers.get("User-Agent") || void 0,
    timestamp: Date.now()
  });
}
__name(logConsentChange, "logConsentChange");
async function logDataAccess(env, userId, resourceType, resourceId, request) {
  await logLegalEvent(env, {
    userId,
    eventType: "data_accessed",
    details: { resourceType, resourceId, accessTime: (/* @__PURE__ */ new Date()).toISOString() },
    ipAddress: request.headers.get("CF-Connecting-IP") || void 0,
    userAgent: request.headers.get("User-Agent") || void 0,
    timestamp: Date.now()
  });
}
__name(logDataAccess, "logDataAccess");
async function logDataErasure(env, userId, resourceTypes, totalRecordsDeleted) {
  await logLegalEvent(env, {
    userId,
    eventType: "data_erased",
    details: {
      resourceTypes,
      totalRecordsDeleted,
      erasureTime: (/* @__PURE__ */ new Date()).toISOString()
    },
    timestamp: Date.now()
  });
}
__name(logDataErasure, "logDataErasure");
async function logAgeVerification(env, userId, ageClass, verificationMethod, request) {
  await logLegalEvent(env, {
    userId,
    eventType: "age_verified",
    details: { ageClass, verificationMethod, verifiedAt: (/* @__PURE__ */ new Date()).toISOString() },
    ipAddress: request.headers.get("CF-Connecting-IP") || void 0,
    userAgent: request.headers.get("User-Agent") || void 0,
    timestamp: Date.now()
  });
}
__name(logAgeVerification, "logAgeVerification");
async function logRestrictedAccess(env, userId, reason, regionOrCountry, requiredAge, request) {
  await logLegalEvent(env, {
    userId,
    eventType: "restricted_access",
    details: { reason, region: regionOrCountry, requiredAge, blockedAt: (/* @__PURE__ */ new Date()).toISOString() },
    ipAddress: request?.headers.get("CF-Connecting-IP") || void 0,
    userAgent: request?.headers.get("User-Agent") || void 0,
    timestamp: Date.now()
  });
}
__name(logRestrictedAccess, "logRestrictedAccess");

// src/handlers/ads.handler.ts
function jsonSuccess(data, message = "Success") {
  return new Response(JSON.stringify({
    success: true,
    data,
    message
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonSuccess, "jsonSuccess");
function jsonError(message, code = "INTERNAL_ERROR", status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: { code, message }
  }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
__name(jsonError, "jsonError");
var getAdsForFeed = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const url = new URL(request.url);
    const ageCheck = await ensureMinimumAgeRegionAware(env, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed) {
      await logRestrictedAccess(env, userId, "ads", ageCheck.region, ageCheck.requiredAge, request);
      return jsonError("Age verification required for ad viewing", "AGE_RESTRICTED", 403);
    }
    const placement = url.searchParams.get("placement") || "feed";
    const scrollPosition = parseInt(url.searchParams.get("position") || "0");
    const adsService = new AdsService(env);
    const { format, ads } = await adsService.getAdaptiveAdLayout(userId, scrollPosition);
    return jsonSuccess({
      format,
      ads,
      count: ads.length
    }, "Ads retrieved successfully");
  } catch (error) {
    return jsonError(error.message);
  }
}, "getAdsForFeed");
var trackImpression = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const body = await request.json();
    const { creativeId, campaignId, placement, format, position } = body;
    if (!creativeId || !campaignId) {
      return jsonError("Missing required fields", "VALIDATION_ERROR", 400);
    }
    const adsService = new AdsService(env);
    await adsService.trackImpression({
      creativeId,
      campaignId,
      userId,
      placement: placement || "feed",
      format: format || "grid",
      position: position || 0
    });
    return jsonSuccess(null, "Impression tracked");
  } catch (error) {
    return jsonError(error.message);
  }
}, "trackImpression");
var trackClick = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const body = await request.json();
    const { impressionId } = body;
    if (!impressionId) {
      return jsonError("Missing impression ID", "VALIDATION_ERROR", 400);
    }
    const adsService = new AdsService(env);
    await adsService.trackClick(impressionId, userId);
    return jsonSuccess(null, "Click tracked");
  } catch (error) {
    return jsonError(error.message);
  }
}, "trackClick");
var createCampaign = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const ageCheck = await ensureMinimumAgeRegionAware(env, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
  if (!ageCheck.allowed || ageCheck.requiredAge < 18) {
    await logRestrictedAccess(env, userId, "ad_campaign_creation", ageCheck.region, ageCheck.requiredAge, request);
    return jsonError("You must be 18 or older to create ad campaigns", "AGE_RESTRICTED", 403);
  }
  try {
    const body = await request.json();
    const {
      name,
      budgetTotal,
      budgetDaily,
      pricingModel,
      bidAmount,
      startDate,
      endDate
    } = body;
    if (!name || !budgetTotal || !budgetDaily || !pricingModel || !bidAmount) {
      return jsonError("Missing required fields", "VALIDATION_ERROR", 400);
    }
    if (budgetTotal < 100) {
      return jsonError("Minimum budget is $100", "VALIDATION_ERROR", 400);
    }
    if (budgetDaily > budgetTotal) {
      return jsonError("Daily budget cannot exceed total budget", "VALIDATION_ERROR", 400);
    }
    const advertiser = await env.DB.prepare(
      "SELECT id, status FROM advertisers WHERE user_id = ?"
    ).bind(userId).first();
    if (!advertiser) {
      return jsonError("Advertiser account required", "UNAUTHORIZED", 403);
    }
    if (advertiser.status !== "approved") {
      return jsonError("Advertiser account not approved", "FORBIDDEN", 403);
    }
    const adsService = new AdsService(env);
    const campaignId = await adsService.createCampaign({
      advertiserId: advertiser.id,
      name,
      budgetTotal,
      budgetDaily,
      pricingModel,
      bidAmount,
      startDate: startDate || (/* @__PURE__ */ new Date()).toISOString(),
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
    });
    return jsonSuccess({ campaignId }, "Campaign created successfully");
  } catch (error) {
    return jsonError(error.message);
  }
}, "createCampaign");
var getCampaignAnalytics = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  const campaignId = params.campaignId;
  try {
    const campaign = await env.DB.prepare(
      `SELECT c.id FROM ad_campaigns c
       JOIN advertisers a ON c.advertiser_id = a.id
       WHERE c.id = ? AND a.user_id = ?`
    ).bind(campaignId, userId).first();
    if (!campaign) {
      return jsonError("Campaign not found or access denied", "NOT_FOUND", 404);
    }
    const adsService = new AdsService(env);
    const analytics = await adsService.getCampaignAnalytics(campaignId);
    return jsonSuccess({ analytics }, "Analytics retrieved");
  } catch (error) {
    return jsonError(error.message);
  }
}, "getCampaignAnalytics");
var getRecommendedPricing = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  try {
    const url = new URL(request.url);
    const targetAudience = parseInt(url.searchParams.get("audience") || "10000");
    const format = url.searchParams.get("format") || "grid";
    const duration = parseInt(url.searchParams.get("days") || "30");
    const adsService = new AdsService(env);
    const pricing = await adsService.getRecommendedPricing(
      targetAudience,
      format,
      duration
    );
    return jsonSuccess({ pricing }, "Pricing recommendation generated");
  } catch (error) {
    return jsonError(error.message);
  }
}, "getRecommendedPricing");
var createAdvertiserAccount = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const body = await request.json();
    const { companyName, companyWebsite, businessType, billingEmail } = body;
    if (!companyName || !billingEmail) {
      return jsonError("Company name and billing email required", "VALIDATION_ERROR", 400);
    }
    const existing = await env.DB.prepare(
      "SELECT id FROM advertisers WHERE user_id = ?"
    ).bind(userId).first();
    if (existing) {
      return jsonError("Advertiser account already exists", "CONFLICT", 409);
    }
    const advertiserId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      `INSERT INTO advertisers (
        id, user_id, company_name, company_website,
        business_type, billing_email, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(
      advertiserId,
      userId,
      companyName,
      companyWebsite || "",
      businessType || "small",
      billingEmail,
      now,
      now
    ).run();
    return jsonSuccess(
      { advertiserId },
      "Advertiser account created - pending approval"
    );
  } catch (error) {
    return jsonError(error.message);
  }
}, "createAdvertiserAccount");
var getPricingTiers = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  try {
    const tiers = await env.DB.prepare(
      "SELECT * FROM ad_pricing_tiers WHERE is_active = 1 ORDER BY tier_level ASC"
    ).all();
    return jsonSuccess({ tiers: tiers.results }, "Pricing tiers retrieved");
  } catch (error) {
    return jsonError(error.message);
  }
}, "getPricingTiers");
var uploadCreative = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const body = await request.json();
    const {
      campaignId,
      format,
      mediaUrl,
      mediaType,
      headline,
      description,
      callToAction,
      destinationUrl
    } = body;
    if (!campaignId || !format || !mediaUrl || !headline || !callToAction || !destinationUrl) {
      return jsonError("Missing required fields", "VALIDATION_ERROR", 400);
    }
    const campaign = await env.DB.prepare(
      `SELECT c.id FROM ad_campaigns c
       JOIN advertisers a ON c.advertiser_id = a.id
       WHERE c.id = ? AND a.user_id = ?`
    ).bind(campaignId, userId).first();
    if (!campaign) {
      return jsonError("Campaign not found or access denied", "NOT_FOUND", 404);
    }
    const creativeId = crypto.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      `INSERT INTO ad_creatives (
        id, campaign_id, format, media_url, media_type,
        headline, description, call_to_action, destination_url,
        status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(
      creativeId,
      campaignId,
      format,
      mediaUrl,
      mediaType,
      headline,
      description || "",
      callToAction,
      destinationUrl,
      now,
      now
    ).run();
    return jsonSuccess(
      { creativeId },
      "Creative uploaded - pending approval"
    );
  } catch (error) {
    return jsonError(error.message);
  }
}, "uploadCreative");
var getAdvertiserDashboard = /* @__PURE__ */ __name(async (request, env, ctx, params) => {
  const authResult = await requireAuth2(request, env);
  if (authResult instanceof Response) return authResult;
  const userId = authResult.userId;
  try {
    const advertiser = await env.DB.prepare(
      "SELECT * FROM advertisers WHERE user_id = ?"
    ).bind(userId).first();
    if (!advertiser) {
      return jsonError("Advertiser account not found", "NOT_FOUND", 404);
    }
    const campaigns = await env.DB.prepare(
      `SELECT 
         COUNT(*) as total_campaigns,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
         SUM(impressions) as total_impressions,
         SUM(clicks) as total_clicks,
         SUM(budget_spent) as total_spent,
         SUM(budget_remaining) as total_remaining
       FROM ad_campaigns
       WHERE advertiser_id = ?`
    ).bind(advertiser.id).first();
    const recentCampaigns = await env.DB.prepare(
      `SELECT id, name, status, budget_total, budget_spent,
              impressions, clicks, created_at
       FROM ad_campaigns
       WHERE advertiser_id = ?
       ORDER BY created_at DESC
       LIMIT 5`
    ).bind(advertiser.id).all();
    return jsonSuccess({
      advertiser: {
        id: advertiser.id,
        companyName: advertiser.company_name,
        status: advertiser.status,
        totalSpent: advertiser.total_spent,
        averageCTR: advertiser.average_ctr
      },
      summary: campaigns,
      recentCampaigns: recentCampaigns.results
    }, "Dashboard data retrieved");
  } catch (error) {
    return jsonError(error.message);
  }
}, "getAdvertiserDashboard");

// src/utils/response.utils.ts
function jsonResponse2(success, data, errorCode, status = 200) {
  return new Response(
    JSON.stringify(
      success ? { success: true, data } : { success: false, error: { code: errorCode || "UNKNOWN", message: errorCode || "error" } }
    ),
    { status, headers: { "Content-Type": "application/json" } }
  );
}
__name(jsonResponse2, "jsonResponse");

// src/utils/fraud_detection.ts
async function ensureFraudTables(env) {
  try {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS gift_anomalies (userId TEXT, giftType TEXT, giftValue INTEGER, zScore REAL, mean REAL, stdDev REAL, timestamp INTEGER, ipAddress TEXT, deviceId TEXT)").run();
  } catch (e) {
  }
}
__name(ensureFraudTables, "ensureFraudTables");
async function detectGiftFraud(env, userId, giftValue, context) {
  const reasons = [];
  let riskScore = 0;
  try {
    await ensureFraudTables(env);
    const recentGifts = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM gift_events WHERE userId = ? AND ts > ?"
    ).bind(userId, Date.now() - 6e4).first();
    const giftCount = recentGifts?.count || 0;
    if (giftCount >= 30) {
      reasons.push("RATE_LIMIT_EXCEEDED");
      riskScore += 40;
    }
    const stats = await env.DB.prepare(
      `SELECT AVG(value) as mean, COUNT(*) as count FROM gift_events 
       WHERE userId = ? AND ts > ?`
    ).bind(userId, Date.now() - 864e5 * 30).first();
    if (stats && stats.count > 5) {
      const mean = stats.mean || 0;
      const varQuery = await env.DB.prepare(
        `SELECT AVG((value - ?)*(value - ?)) as variance FROM gift_events 
         WHERE userId = ? AND ts > ?`
      ).bind(mean, mean, userId, Date.now() - 864e5 * 30).first();
      const variance = varQuery?.variance || 0;
      const stdDev = Math.sqrt(variance);
      const zScore = stdDev > 0 ? Math.abs((giftValue - mean) / stdDev) : 0;
      if (zScore > 3) {
        reasons.push("STATISTICAL_ANOMALY");
        riskScore += 30;
        await env.DB.prepare(
          `INSERT INTO gift_anomalies (userId, giftValue, zScore, mean, stdDev, timestamp, ipAddress, deviceId)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          userId,
          giftValue,
          zScore,
          mean,
          stdDev,
          Date.now(),
          context.ipAddress || "unknown",
          context.deviceId || "unknown"
        ).run();
      }
    }
    if (context.ipAddress) {
      const ipGifts = await env.DB.prepare(
        "SELECT COUNT(DISTINCT userId) as userCount FROM gift_events WHERE ipAddress = ? AND ts > ?"
      ).bind(context.ipAddress, Date.now() - 36e5).first();
      const userCount = ipGifts?.userCount || 0;
      if (userCount > 10) {
        reasons.push("IP_MULTIPLE_ACCOUNTS");
        riskScore += 25;
      }
    }
    if (context.deviceId) {
      const deviceGifts = await env.DB.prepare(
        "SELECT COUNT(DISTINCT userId) as userCount FROM gift_events WHERE deviceId = ? AND ts > ?"
      ).bind(context.deviceId, Date.now() - 36e5).first();
      const userCount = deviceGifts?.userCount || 0;
      if (userCount > 5) {
        reasons.push("DEVICE_MULTIPLE_ACCOUNTS");
        riskScore += 25;
      }
    }
    if (context.recipientId) {
      const circularGift = await env.DB.prepare(
        `SELECT COUNT(*) as count FROM gift_events 
         WHERE userId = ? AND receiverId = ? AND ts > ?`
      ).bind(context.recipientId, userId, Date.now() - 864e5).first();
      const circularCount = circularGift?.count || 0;
      if (circularCount > 0) {
        reasons.push("CIRCULAR_GIFTING");
        riskScore += 20;
      }
    }
    const userAge = await env.DB.prepare(
      "SELECT created_at FROM users WHERE id = ?"
    ).bind(userId).first();
    if (userAge && userAge.created_at) {
      const accountAge = Date.now() - new Date(userAge.created_at).getTime();
      const daysSinceCreation = accountAge / 864e5;
      if (daysSinceCreation < 1 && giftValue > 500) {
        reasons.push("NEW_ACCOUNT_HIGH_VALUE");
        riskScore += 30;
      }
    }
    return {
      suspicious: reasons.length > 0,
      riskScore: Math.min(riskScore, 100),
      reasons,
      shouldBlock: riskScore >= 70
      // Block at 70+ risk score
    };
  } catch (error) {
    console.error("Fraud detection error:", error);
    return {
      suspicious: false,
      riskScore: 0,
      reasons: ["DETECTION_ERROR"],
      shouldBlock: false
    };
  }
}
__name(detectGiftFraud, "detectGiftFraud");

// src/handlers/live.handler.ts
function getStub(env, streamId) {
  if (!env.LIVE_STREAM) throw new Error("LIVE_STREAM Durable Object not bound");
  const id = env.LIVE_STREAM.idFromName(streamId);
  return env.LIVE_STREAM.get(id);
}
__name(getStub, "getStub");
async function joinStream(request, env) {
  const url = new URL(request.url);
  const streamId = url.pathname.split("/")[2];
  const userId = url.searchParams.get("userId");
  if (!userId) return jsonResponse2(false, null, "MISSING_USER", 400);
  const ageCheck = await ensureMinimumAgeRegionAware(env, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
  if (!ageCheck.allowed) {
    await logRestrictedAccess(env, userId, "live_stream_join", ageCheck.region, ageCheck.requiredAge, request);
    return jsonResponse2(false, null, "AGE_RESTRICTED", 403);
  }
  const span = startSpan("live.join", { streamId });
  try {
    await logDataAccess(env, userId, "live_stream", streamId, request);
    const stub = getStub(env, streamId);
    const res = await stub.fetch(`https://do/${streamId}/join?userId=${encodeURIComponent(userId)}`, { method: "POST" });
    return res;
  } finally {
    await endSpan(env, span, "live.join");
  }
}
__name(joinStream, "joinStream");
async function leaveStream(request, env) {
  const url = new URL(request.url);
  const streamId = url.pathname.split("/")[2];
  const userId = url.searchParams.get("userId");
  if (!userId) return jsonResponse2(false, null, "MISSING_USER", 400);
  const span = startSpan("live.leave", { streamId });
  try {
    const stub = getStub(env, streamId);
    const res = await stub.fetch(`https://do/${streamId}/leave?userId=${encodeURIComponent(userId)}`, { method: "POST" });
    return res;
  } finally {
    await endSpan(env, span, "live.leave");
  }
}
__name(leaveStream, "leaveStream");
async function sendStreamGift(request, env) {
  const url = new URL(request.url);
  const streamId = url.pathname.split("/")[2];
  const body = await request.json().catch(() => ({}));
  const userId = body.userId;
  const giftType = body.giftType;
  if (!giftType) return jsonResponse2(false, null, "MISSING_GIFT_TYPE", 400);
  if (!userId) return jsonResponse2(false, null, "MISSING_USER", 400);
  const ageCheck = await ensureMinimumAgeRegionAware(env, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
  if (!ageCheck.allowed) {
    await logRestrictedAccess(env, userId, "live_stream_gift", ageCheck.region, ageCheck.requiredAge, request);
    return jsonResponse2(false, null, "AGE_RESTRICTED", 403);
  }
  const giftValueMap = { rose: 10, diamond: 100, rocket: 500, star: 50, gold: 250 };
  const giftValue = giftValueMap[giftType] || 10;
  const fraudResult = await detectGiftFraud(env, userId, giftValue, {
    ipAddress: request.headers.get("cf-connecting-ip") || void 0,
    deviceId: request.headers.get("x-device-id") || void 0,
    recipientId: streamId
    // treating stream as recipient context for circular gifting detection
  });
  if (fraudResult.shouldBlock) {
    return jsonResponse2(false, { reasons: fraudResult.reasons }, "FRAUD_BLOCKED", 429);
  }
  if (fraudResult.reasons.includes("RATE_LIMIT_EXCEEDED")) {
    return jsonResponse2(false, { reasons: fraudResult.reasons }, "RATE_LIMIT_EXCEEDED", 429);
  }
  const span = startSpan("live.gift", { streamId, riskScore: fraudResult.riskScore });
  try {
    const stub = getStub(env, streamId);
    const res = await stub.fetch(`https://do/${streamId}/gift`, { method: "POST", body: JSON.stringify({ giftType, value: giftValue, fraudRisk: fraudResult.riskScore }), headers: { "Content-Type": "application/json" } });
    return res;
  } finally {
    await endSpan(env, span, "live.gift");
  }
}
__name(sendStreamGift, "sendStreamGift");
async function getStreamState(request, env) {
  const url = new URL(request.url);
  const streamId = url.pathname.split("/")[2];
  const span = startSpan("live.state", { streamId });
  try {
    const stub = getStub(env, streamId);
    const res = await stub.fetch(`https://do/${streamId}/state`, { method: "GET" });
    return res;
  } finally {
    await endSpan(env, span, "live.state");
  }
}
__name(getStreamState, "getStreamState");
async function updatePresence2(request, env) {
  const url = new URL(request.url);
  const streamId = url.pathname.split("/")[2];
  const body = await request.json().catch(() => ({}));
  const userId = body.userId;
  const status = body.status || "online";
  if (!userId) return jsonResponse2(false, null, "MISSING_USER", 400);
  const span = startSpan("live.presence", { streamId });
  try {
    const stub = getStub(env, streamId);
    const res = await stub.fetch(`https://do/${streamId}/presence`, { method: "POST", body: JSON.stringify({ userId, status }), headers: { "Content-Type": "application/json" } });
    return res;
  } finally {
    await endSpan(env, span, "live.presence");
  }
}
__name(updatePresence2, "updatePresence");

// src/handlers/compliance.handler.ts
async function recordConsent(request, env) {
  const body = await request.json().catch(() => ({}));
  const userId = body.userId;
  const scopes = body.scopes || [];
  const version = body.version || "v1";
  const region = body.region || "global";
  if (!userId || !Array.isArray(scopes) || scopes.length === 0) {
    return jsonResponse2(false, null, "INVALID_CONSENT", 400);
  }
  try {
    for (const scope of scopes) {
      await env.DB.prepare("INSERT INTO consent_log (subject, scope, version, ts, region) VALUES (?1, ?2, ?3, ?4, ?5)").bind(userId, scope, version, Date.now(), region).run();
      await logConsentChange(env, userId, scope, true, request);
    }
    return jsonResponse2(true, { recorded: scopes.length });
  } catch (e) {
    return jsonResponse2(false, null, "CONSENT_WRITE_FAILED", 500);
  }
}
__name(recordConsent, "recordConsent");
async function getConsent(request, env, _ctx, params) {
  const userId = params.userId;
  const result = await env.DB.prepare("SELECT scope, version, ts, region FROM consent_log WHERE subject = ?1").bind(userId).all();
  return jsonResponse2(true, { entries: result.results });
}
__name(getConsent, "getConsent");
async function withdrawConsent(request, env, _ctx, params) {
  const userId = params.userId;
  const body = await request.json().catch(() => ({}));
  const scopes = body.scopes || [];
  if (!Array.isArray(scopes) || scopes.length === 0) return jsonResponse2(false, null, "INVALID_SCOPES", 400);
  try {
    for (const scope of scopes) {
      await env.DB.prepare("DELETE FROM consent_log WHERE subject = ?1 AND scope = ?2").bind(userId, scope).run();
      await logConsentChange(env, userId, scope, false, request);
    }
    return jsonResponse2(true, { removed: scopes.length });
  } catch (e) {
    return jsonResponse2(false, null, "CONSENT_WITHDRAW_FAILED", 500);
  }
}
__name(withdrawConsent, "withdrawConsent");
async function eraseUserData(request, env, _ctx, params) {
  const userId = params.userId;
  const reqId = crypto.randomUUID();
  await env.DB.prepare("INSERT INTO erase_requests (id, user_id, status, initiated_at) VALUES (?1, ?2, ?3, ?4)").bind(reqId, userId, "processing", Date.now()).run();
  try {
    await env.DB.prepare("DELETE FROM consent_log WHERE subject = ?1").bind(userId).run();
    await env.DB.prepare("DELETE FROM payment_events WHERE user_id = ?1").bind(userId).run();
    await env.DB.prepare("DELETE FROM gift_events WHERE sender_id = ?1").bind(userId).run();
    await env.DB.prepare("DELETE FROM referral_activations WHERE referred_user_id = ?1").bind(userId).run();
    await env.DB.prepare("DELETE FROM referral_codes WHERE owner_user_id = ?1").bind(userId).run();
    await env.DB.prepare("DELETE FROM age_verification WHERE user_id = ?1 OR userId = ?1").bind(userId).run();
    await env.DB.prepare("UPDATE erase_requests SET status = ?1, completed_at = ?2 WHERE id = ?3").bind("completed", Date.now(), reqId).run();
    await logDataErasure(env, userId, ["consent", "payments", "gifts", "referrals", "age_verification"], 0);
    return jsonResponse2(true, { status: "completed", requestId: reqId });
  } catch (e) {
    await env.DB.prepare("UPDATE erase_requests SET status = ?1, failure_reason = ?2 WHERE id = ?3").bind("failed", e.message || "ERROR", reqId).run();
    return jsonResponse2(false, null, "ERASE_FAILED", 500);
  }
}
__name(eraseUserData, "eraseUserData");
async function recordAgeVerification(request, env) {
  const body = await request.json().catch(() => ({}));
  const userId = body.userId;
  const ageClass = body.ageClass;
  const verified = !!body.verified;
  if (!userId || !ageClass) return jsonResponse2(false, null, "INVALID_AGE_DATA", 400);
  await logAgeVerification(env, userId, ageClass, body.method || "self-reported", request);
  try {
    await env.DB.prepare("INSERT OR REPLACE INTO age_verification (userId, ageClass, verified, ts) VALUES (?1, ?2, ?3, ?4)").bind(userId, ageClass, verified ? 1 : 0, Date.now()).run();
    return jsonResponse2(true, { userId, ageClass, verified });
  } catch (e) {
    const msg = String(e.message || "");
    if (/no such table/i.test(msg)) {
      try {
        await env.DB.prepare("CREATE TABLE IF NOT EXISTS age_verification (userId TEXT PRIMARY KEY, ageClass TEXT, verified INTEGER, ts INTEGER)").run();
        await env.DB.prepare("INSERT OR REPLACE INTO age_verification (userId, ageClass, verified, ts) VALUES (?1, ?2, ?3, ?4)").bind(userId, ageClass, verified ? 1 : 0, Date.now()).run();
        return jsonResponse2(true, { userId, ageClass, verified, autoCreated: true });
      } catch (e2) {
        return jsonResponse2(false, { reason: e2.message || "ERROR" }, "AGE_VERIFICATION_FAILED", 500);
      }
    }
    return jsonResponse2(false, { reason: msg }, "AGE_VERIFICATION_FAILED", 500);
  }
}
__name(recordAgeVerification, "recordAgeVerification");
async function auditUserCompliance(_req, env, _ctx, params) {
  const userId = params.userId;
  try {
    const consent = await env.DB.prepare("SELECT scope, version, ts, region FROM consent_log WHERE subject=?1 ORDER BY ts DESC LIMIT 100").bind(userId).all();
    const age = await env.DB.prepare("SELECT ageClass, verified, ts FROM age_verification WHERE user_id=?1 OR userId=?1").bind(userId).first();
    const erase = await env.DB.prepare("SELECT id, status, initiated_at, completed_at, failure_reason FROM erase_requests WHERE user_id=?1 ORDER BY initiated_at DESC LIMIT 20").bind(userId).all();
    const anomalies = await env.DB.prepare("SELECT COUNT(*) as cnt FROM gift_anomalies WHERE user_id=?1").bind(userId).first();
    const tax = await env.DB.prepare("SELECT country_code, tax_class, updated_at FROM user_tax_profile WHERE user_id=?1").bind(userId).first();
    const region = await env.DB.prepare("SELECT region_code, residency_version, updated_at FROM user_region_meta WHERE user_id=?1").bind(userId).first();
    return jsonResponse2(true, {
      consent: consent.results || [],
      ageVerification: age || null,
      eraseRequests: erase.results || [],
      anomalyCount: anomalies?.cnt || 0,
      taxProfile: tax || null,
      regionProfile: region || null
    });
  } catch (e) {
    return jsonResponse2(false, null, "AUDIT_FAILED", 500);
  }
}
__name(auditUserCompliance, "auditUserCompliance");

// src/handlers/metrics.handler.ts
async function getEconomySummary(_req, env) {
  const span = startSpan("getEconomySummary");
  try {
    const gifts = await env.DB.prepare("SELECT COUNT(*) as count, SUM(value) as totalValue FROM gift_events").all();
    const payments = await env.DB.prepare("SELECT COUNT(*) as count, SUM(amount) as totalAmount FROM payment_events").all();
    return jsonResponse2(true, {
      gifts: gifts.results?.[0] || {},
      payments: payments.results?.[0] || {}
    });
  } finally {
    await endSpan(env, span, "getEconomySummary");
  }
}
__name(getEconomySummary, "getEconomySummary");
async function getTopGifters(_req, env) {
  const span = startSpan("getTopGifters");
  try {
    const top = await env.DB.prepare("SELECT userId, SUM(value) as totalValue FROM gift_events GROUP BY userId ORDER BY totalValue DESC LIMIT 25").all();
    return jsonResponse2(true, { top: top.results });
  } finally {
    await endSpan(env, span, "getTopGifters");
  }
}
__name(getTopGifters, "getTopGifters");
async function getLatencySnapshot(_req, env) {
  const span = startSpan("getLatencySnapshot");
  try {
    const latest = await env.DB.prepare("SELECT endpoint, p50, p95, ts FROM latency_samples ORDER BY ts DESC LIMIT 50").all();
    return jsonResponse2(true, { samples: latest.results });
  } finally {
    await endSpan(env, span, "getLatencySnapshot");
  }
}
__name(getLatencySnapshot, "getLatencySnapshot");
async function getSubscriptionSummary(_req, env) {
  const span = startSpan("getSubscriptionSummary");
  try {
    const plans = await env.DB.prepare("SELECT code, name, price_cents, interval FROM subscription_plans").all();
    const subs = await env.DB.prepare('SELECT plan_code, COUNT(*) as cnt FROM user_subscriptions WHERE status="active" GROUP BY plan_code').all();
    return jsonResponse2(true, { plans: plans.results, activeCounts: subs.results });
  } finally {
    await endSpan(env, span, "getSubscriptionSummary");
  }
}
__name(getSubscriptionSummary, "getSubscriptionSummary");

// src/handlers/perf-telemetry.handler.ts
async function postPerfTelemetry(req, env) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ success: false, error: { code: "INVALID_PAYLOAD", message: "Body must be JSON object" } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS perf_telemetry (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        device_ts TEXT,
        frame_times TEXT, -- JSON array
        network_latencies TEXT, -- JSON array
        errors TEXT, -- JSON array
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    const deviceTs = typeof body.deviceTs === "string" ? body.deviceTs : (/* @__PURE__ */ new Date()).toISOString();
    const frameTimes = Array.isArray(body.frameTimes) ? JSON.stringify(body.frameTimes) : JSON.stringify([]);
    const networkLatencies = Array.isArray(body.networkLatencies) ? JSON.stringify(body.networkLatencies) : JSON.stringify([]);
    const errors = Array.isArray(body.errors) ? JSON.stringify(body.errors) : JSON.stringify([]);
    await env.DB.prepare(`
      INSERT INTO perf_telemetry (device_ts, frame_times, network_latencies, errors)
      VALUES (?1, ?2, ?3, ?4)
    `).bind(deviceTs, frameTimes, networkLatencies, errors).run();
    return jsonResponse2(true, { received: true });
  } catch (error) {
    console.error("[PerfTelemetry] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to store telemetry" } }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(postPerfTelemetry, "postPerfTelemetry");

// src/utils/telemetry_exporter.ts
async function exportTelemetry(env) {
  const span = startSpan("telemetry.export");
  try {
    const now = Date.now();
    const since = now - 24 * 3600 * 1e3;
    const giftsRow = await env.DB.prepare("SELECT COUNT(*) as c FROM gift_events WHERE created_at > ?1").bind(since).first();
    const payoutRow = await env.DB.prepare('SELECT COUNT(*) as c FROM payment_events WHERE event_type = "payout_pending" AND created_at > ?1').bind(since).first();
    const consentRow = await env.DB.prepare('SELECT COUNT(*) as c FROM consent_log WHERE created_at > datetime(?1, "unixepoch", "subsec")').bind(since / 1e3).first();
    let avgLatency;
    let p50;
    let p95;
    try {
      const lat = await env.DB.prepare("SELECT AVG(latency_ms) as avgLatency FROM latency_samples WHERE ts > ?1").bind(since).first();
      avgLatency = lat?.avgLatency;
      const dist = await env.DB.prepare("SELECT latency_ms FROM latency_samples WHERE ts > ?1 ORDER BY latency_ms").bind(since).all();
      const arr = dist.results?.map((r) => r.latency_ms).filter((n) => typeof n === "number") || [];
      if (arr.length) {
        const idx50 = Math.floor(arr.length * 0.5);
        const idx95 = Math.floor(arr.length * 0.95);
        p50 = arr[idx50];
        p95 = arr[idx95];
      }
    } catch {
    }
    return {
      ts: now,
      giftsToday: giftsRow?.c || 0,
      payoutRequestsToday: payoutRow?.c || 0,
      consentWritesToday: consentRow?.c || 0,
      avgApiLatencyMs: avgLatency,
      p50LatencyMs: p50,
      p95LatencyMs: p95
    };
  } finally {
    await endSpan(env, span, "telemetry");
  }
}
__name(exportTelemetry, "exportTelemetry");
async function recordLatencySample(env, path, latencyMs) {
  try {
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS latency_samples (ts INTEGER, path TEXT, latency_ms INTEGER)").run();
    await env.DB.prepare("INSERT INTO latency_samples (ts, path, latency_ms) VALUES (?1, ?2, ?3)").bind(Date.now(), path, latencyMs).run();
  } catch (e) {
  }
}
__name(recordLatencySample, "recordLatencySample");

// src/handlers/subscription.handler.ts
async function createPlan(request, env) {
  const span = startSpan("subscription.createPlan");
  try {
    const body = await request.json().catch(() => ({}));
    const { code, name, priceCents, interval, features } = body;
    if (!code || !name || !priceCents || !interval || !Array.isArray(features)) {
      return jsonResponse2(false, null, "INVALID_PLAN_DATA", 400);
    }
    await env.DB.prepare("INSERT INTO subscription_plans (code, name, price_cents, interval, features) VALUES (?1, ?2, ?3, ?4, ?5)").bind(code, name, priceCents, interval, JSON.stringify(features)).run();
    return jsonResponse2(true, { code });
  } catch (e) {
    return jsonResponse2(false, null, "PLAN_CREATE_FAILED", 500);
  } finally {
    await endSpan(env, span, "subscription.createPlan");
  }
}
__name(createPlan, "createPlan");
async function listPlans(_req, env) {
  const span = startSpan("subscription.listPlans");
  try {
    const rs = await env.DB.prepare("SELECT code, name, price_cents, interval, features, active FROM subscription_plans WHERE active=1").all();
    const raw = rs.results || [];
    const plans = raw.map((p) => ({ ...p, features: JSON.parse(String(p.features || "[]")) }));
    return jsonResponse2(true, { plans });
  } catch (e) {
    return jsonResponse2(false, null, "PLAN_LIST_FAILED", 500);
  } finally {
    await endSpan(env, span, "subscription.listPlans");
  }
}
__name(listPlans, "listPlans");
async function subscribe(request, env) {
  const span = startSpan("subscription.subscribe");
  try {
    const body = await request.json().catch(() => ({}));
    const { userId, planCode } = body;
    if (!userId || !planCode) return jsonResponse2(false, null, "INVALID_SUBSCRIBE", 400);
    const ageCheck = await ensureMinimumAgeRegionAware(env, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed || ageCheck.requiredAge < 18) {
      return jsonResponse2(false, null, "AGE_RESTRICTED", 403);
    }
    await logDataAccess(env, userId, "subscription", planCode, request);
    const plan = await env.DB.prepare("SELECT code, interval FROM subscription_plans WHERE code=?1 AND active=1").bind(planCode).first();
    if (!plan) return jsonResponse2(false, null, "PLAN_NOT_FOUND", 404);
    const expires = computeExpiry(String(plan.interval || "monthly"));
    await env.DB.prepare("INSERT INTO user_subscriptions (user_id, plan_code, expires_at) VALUES (?1, ?2, ?3)").bind(userId, planCode, expires).run();
    return jsonResponse2(true, { userId, planCode, expiresAt: expires });
  } catch (e) {
    return jsonResponse2(false, null, "SUBSCRIBE_FAILED", 500);
  } finally {
    await endSpan(env, span, "subscription.subscribe");
  }
}
__name(subscribe, "subscribe");
async function mySubscription(request, env) {
  const span = startSpan("subscription.mySubscription");
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return jsonResponse2(false, null, "MISSING_USER", 400);
    const sub = await env.DB.prepare('SELECT plan_code, status, expires_at FROM user_subscriptions WHERE user_id=?1 AND status="active" ORDER BY started_at DESC LIMIT 1').bind(userId).first();
    if (!sub) return jsonResponse2(true, { active: false });
    return jsonResponse2(true, { active: true, planCode: sub.plan_code, expiresAt: sub.expires_at });
  } catch (e) {
    return jsonResponse2(false, null, "SUB_LOOKUP_FAILED", 500);
  } finally {
    await endSpan(env, span, "subscription.mySubscription");
  }
}
__name(mySubscription, "mySubscription");
async function cancelSubscription(request, env) {
  const span = startSpan("subscription.cancel");
  try {
    const body = await request.json().catch(() => ({}));
    const { userId } = body;
    if (!userId) return jsonResponse2(false, null, "MISSING_USER", 400);
    await env.DB.prepare('UPDATE user_subscriptions SET status="canceled", canceled_at=?2 WHERE user_id=?1 AND status="active"').bind(userId, Date.now()).run();
    return jsonResponse2(true, { canceled: true });
  } catch (e) {
    return jsonResponse2(false, null, "SUB_CANCEL_FAILED", 500);
  } finally {
    await endSpan(env, span, "subscription.cancel");
  }
}
__name(cancelSubscription, "cancelSubscription");
async function checkFeatureGate(request, env) {
  const span = startSpan("subscription.featureGate");
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const feature = url.searchParams.get("feature");
    if (!userId || !feature) return jsonResponse2(false, null, "MISSING_PARAMS", 400);
    const sub = await env.DB.prepare('SELECT plan_code FROM user_subscriptions WHERE user_id=?1 AND status="active" ORDER BY started_at DESC LIMIT 1').bind(userId).first();
    if (!sub) return jsonResponse2(true, { allowed: false, reason: "NO_SUBSCRIPTION" });
    const plan = await env.DB.prepare("SELECT features FROM subscription_plans WHERE code=?1").bind(sub.plan_code).first();
    if (!plan) return jsonResponse2(true, { allowed: false, reason: "PLAN_NOT_FOUND" });
    const features = JSON.parse(String(plan.features || "[]"));
    const allowed = features.includes(feature);
    if (allowed) {
      await env.DB.prepare("INSERT INTO feature_usage (user_id, feature_code) VALUES (?1, ?2)").bind(userId, feature).run();
    }
    return jsonResponse2(true, { allowed });
  } catch (e) {
    return jsonResponse2(false, null, "FEATURE_CHECK_FAILED", 500);
  } finally {
    await endSpan(env, span, "subscription.featureGate");
  }
}
__name(checkFeatureGate, "checkFeatureGate");
function computeExpiry(interval) {
  const now = Date.now();
  const ms = interval === "annual" ? 365 * 24 * 3600 * 1e3 : 30 * 24 * 3600 * 1e3;
  return new Date(now + ms).toISOString();
}
__name(computeExpiry, "computeExpiry");

// src/handlers/creator.handler.ts
async function getCreatorAnalytics(_req, env, _ctx, params) {
  const span = startSpan("creator.analytics");
  try {
    const userId = params.userId;
    const gifts = await env.DB.prepare("SELECT COUNT(*) as giftCount, SUM(value) as giftValue FROM gift_events WHERE receiver_id=?1 OR receiverId=?1").bind(userId).first();
    const payments = await env.DB.prepare("SELECT COUNT(*) as paymentCount, SUM(amount) as paymentTotal FROM payment_events WHERE user_id=?1").bind(userId).first();
    const subs = await env.DB.prepare('SELECT COUNT(*) as activeSubs FROM user_subscriptions WHERE plan_code IN (SELECT code FROM subscription_plans) AND user_id=?1 AND status="active"').bind(userId).first();
    return jsonResponse2(true, { gifts, payments, subscriptions: subs });
  } catch (e) {
    return jsonResponse2(false, null, "CREATOR_ANALYTICS_FAILED", 500);
  } finally {
    await endSpan(env, span, "creator.analytics");
  }
}
__name(getCreatorAnalytics, "getCreatorAnalytics");

// src/utils/payout_validation.ts
var MIN_PAYOUT_CENTS = 2e3;
var MAX_DAILY_PAYOUT_CENTS = 1e6;
var COOLDOWN_PERIOD_MS = 864e5;
async function validatePayoutRequest(env, userId, amountCents) {
  const span = startSpan("payout.validate", { userId, amountCents });
  try {
    if (amountCents < MIN_PAYOUT_CENTS) {
      return {
        allowed: false,
        reason: "BELOW_MINIMUM",
        minimumBalance: MIN_PAYOUT_CENTS
      };
    }
    const balanceResult = await env.DB.prepare(
      `SELECT SUM(
        CASE 
          WHEN event_type = 'gift_received' THEN amount_cents 
          WHEN event_type = 'payout_completed' THEN -amount_cents
          ELSE 0 
        END
      ) as balance FROM payment_events WHERE user_id = ?`
    ).bind(userId).first();
    const balance = balanceResult?.balance || 0;
    if (balance < amountCents) {
      return {
        allowed: false,
        reason: "INSUFFICIENT_BALANCE",
        balance
      };
    }
    const pendingResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM payment_events 
       WHERE user_id = ? AND event_type = 'payout_pending' AND created_at > ?`
    ).bind(userId, Date.now() - COOLDOWN_PERIOD_MS).first();
    if ((pendingResult?.count || 0) > 0) {
      return {
        allowed: false,
        reason: "PENDING_PAYOUT_EXISTS"
      };
    }
    const todayStart = (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0);
    const dailyResult = await env.DB.prepare(
      `SELECT SUM(amount_cents) as daily_total FROM payment_events 
       WHERE user_id = ? AND event_type IN ('payout_pending', 'payout_completed') 
       AND created_at > ?`
    ).bind(userId, todayStart).first();
    const dailyTotal = dailyResult?.daily_total || 0;
    const remainingDaily = MAX_DAILY_PAYOUT_CENTS - dailyTotal;
    if (amountCents > remainingDaily) {
      return {
        allowed: false,
        reason: "DAILY_LIMIT_EXCEEDED",
        dailyLimit: MAX_DAILY_PAYOUT_CENTS,
        remainingDaily
      };
    }
    const kycResult = await env.DB.prepare(
      `SELECT kyc_status FROM payment_events 
       WHERE user_id = ? AND event_type = 'kyc_submitted' 
       ORDER BY created_at DESC LIMIT 1`
    ).bind(userId).first();
    const kycStatus = kycResult?.kyc_status || "not_submitted";
    if (kycStatus !== "approved" && amountCents >= 1e4) {
      return {
        allowed: false,
        reason: "KYC_REQUIRED"
      };
    }
    return {
      allowed: true,
      balance,
      remainingDaily
    };
  } finally {
    await endSpan(env, span, "payout.validate");
  }
}
__name(validatePayoutRequest, "validatePayoutRequest");
async function detectPayoutFraud(env, userId, amountCents) {
  const span = startSpan("payout.fraudCheck", { userId, amountCents });
  const reasons = [];
  try {
    const recentPayouts = await env.DB.prepare(
      `SELECT COUNT(*) as count, SUM(amount_cents) as total 
       FROM payment_events 
       WHERE user_id = ? AND event_type IN ('payout_pending', 'payout_completed') 
       AND created_at > ?`
    ).bind(userId, Date.now() - 36e5).first();
    if ((recentPayouts?.count || 0) >= 3) {
      reasons.push("RAPID_WITHDRAWAL_PATTERN");
    }
    const balanceResult = await env.DB.prepare(
      `SELECT SUM(
        CASE 
          WHEN event_type = 'gift_received' THEN amount_cents 
          WHEN event_type = 'payout_completed' THEN -amount_cents
          ELSE 0 
        END
      ) as balance FROM payment_events WHERE user_id = ?`
    ).bind(userId).first();
    const balance = balanceResult?.balance || 0;
    const withdrawalPercent = amountCents / balance * 100;
    if (withdrawalPercent >= 95) {
      reasons.push("FULL_BALANCE_DRAIN");
    }
    const recentGifts = await env.DB.prepare(
      `SELECT COUNT(*) as count, SUM(amount_cents) as total 
       FROM payment_events 
       WHERE user_id = ? AND event_type = 'gift_received' 
       AND created_at > ?`
    ).bind(userId, Date.now() - 864e5).first();
    const giftTotal = recentGifts?.total || 0;
    if (giftTotal >= amountCents * 0.9 && (recentGifts?.count || 0) <= 2) {
      reasons.push("SUSPICIOUS_GIFT_PATTERN");
    }
    const accountAge = await env.DB.prepare(
      `SELECT MIN(created_at) as first_activity 
       FROM payment_events WHERE user_id = ?`
    ).bind(userId).first();
    const accountAgeMs = Date.now() - (accountAge?.first_activity || Date.now());
    const accountAgeDays = accountAgeMs / 864e5;
    if (accountAgeDays < 7 && amountCents >= 5e3) {
      reasons.push("NEW_ACCOUNT_LARGE_WITHDRAWAL");
    }
    return {
      suspicious: reasons.length > 0,
      reasons
    };
  } finally {
    await endSpan(env, span, "payout.fraudCheck");
  }
}
__name(detectPayoutFraud, "detectPayoutFraud");
async function logPayoutAttempt(env, userId, amountCents, validationResult, fraudCheck) {
  try {
    await env.DB.prepare(
      `INSERT INTO payment_events 
       (user_id, event_type, amount_cents, metadata, created_at) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      userId,
      "payout_attempt",
      amountCents,
      JSON.stringify({ validationResult, fraudCheck }),
      Date.now()
    ).run();
  } catch (error) {
    console.error("Failed to log payout attempt:", error);
  }
}
__name(logPayoutAttempt, "logPayoutAttempt");

// src/handlers/payout.handler.ts
async function requestPayout(request, env) {
  const span = startSpan("payout.request");
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    const amountCents = body.amountCents || body.amount;
    if (!userId || !amountCents || amountCents <= 0) {
      return jsonResponse2(false, null, "INVALID_PAYOUT", 400);
    }
    const ageCheck = await ensureMinimumAgeRegionAware(env, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed || ageCheck.requiredAge < 18) {
      await logRestrictedAccess(env, userId, "payout_request", ageCheck.region, ageCheck.requiredAge, request);
      return jsonResponse2(false, null, "AGE_RESTRICTED_PAYOUT", 403);
    }
    const validation = await validatePayoutRequest(env, userId, amountCents);
    if (!validation.allowed) {
      return jsonResponse2(false, {
        reason: validation.reason,
        balance: validation.balance,
        minimumBalance: validation.minimumBalance,
        dailyLimit: validation.dailyLimit,
        remainingDaily: validation.remainingDaily
      }, validation.reason || "VALIDATION_FAILED", 400);
    }
    const fraudCheck = await detectPayoutFraud(env, userId, amountCents);
    await logPayoutAttempt(env, userId, amountCents, validation, fraudCheck);
    const status = fraudCheck.suspicious ? "review" : "pending";
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO payment_events (id, user_id, event_type, amount_cents, status, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      userId,
      "payout_pending",
      amountCents,
      status,
      JSON.stringify({ fraudReasons: fraudCheck.reasons }),
      Date.now()
    ).run();
    return jsonResponse2(true, {
      id,
      status,
      suspicious: fraudCheck.suspicious,
      reasons: fraudCheck.reasons,
      balance: validation.balance,
      remainingDaily: validation.remainingDaily
    });
  } catch (e) {
    console.error("Payout request error:", e);
    return jsonResponse2(false, null, "PAYOUT_ERROR", 500);
  } finally {
    await endSpan(env, span, "payout.request");
  }
}
__name(requestPayout, "requestPayout");
async function getLedger(request, env) {
  const span = startSpan("payout.ledger");
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split("/")[3];
    if (!userId) return jsonResponse2(false, null, "MISSING_USER", 400);
    const rs = await env.DB.prepare("SELECT id, event_type, amount, status, created_at FROM payment_events WHERE user_id=?1 ORDER BY created_at DESC LIMIT 100").bind(userId).all();
    return jsonResponse2(true, { events: rs.results || [] });
  } catch (_) {
    return jsonResponse2(false, null, "LEDGER_ERROR", 500);
  } finally {
    await endSpan(env, span, "payout.ledger");
  }
}
__name(getLedger, "getLedger");
async function submitKyc(request, env) {
  const span = startSpan("payout.kyc");
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    const country = body.country;
    if (!userId || !country) return jsonResponse2(false, null, "INVALID_KYC", 400);
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO payment_events (id, user_id, event_type, amount, status) VALUES (?1, ?2, ?3, ?4, ?5)").bind(id, userId, "hold", 0, "pending").run();
    return jsonResponse2(true, { kycId: id, status: "pending" });
  } catch (_) {
    return jsonResponse2(false, null, "KYC_ERROR", 500);
  } finally {
    await endSpan(env, span, "payout.kyc");
  }
}
__name(submitKyc, "submitKyc");

// src/handlers/referral.handler.ts
function generateCode() {
  return Math.random().toString(36).substring(2, 8);
}
__name(generateCode, "generateCode");
async function createCode(request, env) {
  const span = startSpan("referral.create");
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId;
    if (!userId) return jsonResponse2(false, null, "MISSING_USER", 400);
    const ageCheck = await ensureMinimumAgeRegionAware(env, userId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed) {
      await logRestrictedAccess(env, userId, "referral_code_creation", ageCheck.region, ageCheck.requiredAge, request);
      return jsonResponse2(false, null, "AGE_RESTRICTED", 403);
    }
    const code = generateCode();
    await env.DB.prepare("INSERT INTO referral_codes (code, owner_user_id) VALUES (?1, ?2)").bind(code, userId).run();
    return jsonResponse2(true, { code });
  } catch (e) {
    return jsonResponse2(false, null, "CODE_ERROR", 500);
  } finally {
    await endSpan(env, span, "referral.create");
  }
}
__name(createCode, "createCode");
async function activateCode(request, env) {
  const span = startSpan("referral.activate");
  try {
    const body = await request.json().catch(() => ({}));
    const code = body.code;
    const referredUserId = body.userId;
    if (!code || !referredUserId) return jsonResponse2(false, null, "INVALID_ACTIVATION", 400);
    const ageCheck = await ensureMinimumAgeRegionAware(env, referredUserId, { ip: request.headers.get("cf-connecting-ip") || void 0 });
    if (!ageCheck.allowed) {
      await logRestrictedAccess(env, referredUserId, "referral_activation", ageCheck.region, ageCheck.requiredAge, request);
      return jsonResponse2(false, null, "AGE_RESTRICTED", 403);
    }
    const existing = await env.DB.prepare("SELECT code FROM referral_codes WHERE code=?1").bind(code).first();
    if (!existing) return jsonResponse2(false, null, "CODE_NOT_FOUND", 404);
    await env.DB.prepare("INSERT INTO referral_activations (code, referred_user_id) VALUES (?1, ?2)").bind(code, referredUserId).run();
    await env.DB.prepare("UPDATE referral_codes SET activations_count = activations_count + 1 WHERE code=?1").bind(code).run();
    return jsonResponse2(true, { code, activated: true });
  } catch (_) {
    return jsonResponse2(false, null, "ACTIVATION_ERROR", 500);
  } finally {
    await endSpan(env, span, "referral.activate");
  }
}
__name(activateCode, "activateCode");
async function getStats(request, env) {
  const span = startSpan("referral.stats");
  try {
    const url = new URL(request.url);
    const code = url.pathname.split("/")[3];
    if (!code) return jsonResponse2(false, null, "MISSING_CODE", 400);
    const ref = await env.DB.prepare("SELECT code, owner_user_id, activations_count, created_at FROM referral_codes WHERE code=?1").bind(code).first();
    if (!ref) return jsonResponse2(false, null, "CODE_NOT_FOUND", 404);
    const activations = await env.DB.prepare("SELECT referred_user_id, created_at FROM referral_activations WHERE code=?1 ORDER BY created_at DESC LIMIT 100").bind(code).all();
    return jsonResponse2(true, { code: ref.code, owner: ref.owner_user_id, activations_count: ref.activations_count, activations: activations.results || [] });
  } catch (_) {
    return jsonResponse2(false, null, "STATS_ERROR", 500);
  } finally {
    await endSpan(env, span, "referral.stats");
  }
}
__name(getStats, "getStats");

// src/services/coins.service.ts
var COIN_PACKAGES = [
  { id: "coins_100", coins: 100, priceUSD: 0.99, priceCents: 99, bonusCoins: 0, popularityRank: 1 },
  { id: "coins_500", coins: 500, priceUSD: 4.49, priceCents: 449, bonusCoins: 50, popularityRank: 2 },
  { id: "coins_1000", coins: 1e3, priceUSD: 8.99, priceCents: 899, bonusCoins: 150, popularityRank: 3 },
  { id: "coins_2500", coins: 2500, priceUSD: 19.99, priceCents: 1999, bonusCoins: 500, popularityRank: 4 },
  { id: "coins_5000", coins: 5e3, priceUSD: 39.99, priceCents: 3999, bonusCoins: 1200, popularityRank: 5 },
  { id: "coins_10000", coins: 1e4, priceUSD: 74.99, priceCents: 7499, bonusCoins: 3e3, popularityRank: 6 }
];
function generateTransactionId() {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
__name(generateTransactionId, "generateTransactionId");
function validateCoinAmount(amount) {
  return amount > 0 && amount <= 1e6 && Number.isInteger(amount);
}
__name(validateCoinAmount, "validateCoinAmount");
var CoinsService = class {
  constructor(env) {
    this.env = env;
  }
  static {
    __name(this, "CoinsService");
  }
  /**
   * Get user's current coin balance
   */
  async getBalance(userId) {
    const span = startSpan("coins.getBalance");
    try {
      const result = await this.env.DB.prepare(
        `SELECT 
           coin_balance as balance,
           total_earned,
           total_spent,
           total_purchased,
           updated_at as lastUpdated
         FROM users 
         WHERE id = ?1`
      ).bind(userId).first();
      if (!result) {
        throw new Error("User not found");
      }
      return {
        userId,
        balance: result.balance || 0,
        totalEarned: result.total_earned || 0,
        totalSpent: result.total_spent || 0,
        totalPurchased: result.total_purchased || 0,
        lastUpdated: result.lastUpdated || Date.now()
      };
    } finally {
      await endSpan(this.env, span, "coins.getBalance");
    }
  }
  /**
   * Credit coins to user (from purchase)
   * ATOMIC operation with transaction logging
   */
  async creditCoins(userId, amount, type, metadata) {
    const span = startSpan("coins.credit");
    try {
      if (!validateCoinAmount(amount)) {
        throw new Error("Invalid coin amount");
      }
      const currentBalance = await this.getBalance(userId);
      const newBalance = currentBalance.balance + amount;
      const transactionId = generateTransactionId();
      const now = Date.now();
      const batch = [
        // Update user balance
        this.env.DB.prepare(
          `UPDATE users 
           SET coin_balance = ?1,
               total_purchased = total_purchased + ?2,
               updated_at = ?3
           WHERE id = ?4`
        ).bind(newBalance, type === "purchase" ? amount : 0, now, userId),
        // Insert transaction record
        this.env.DB.prepare(
          `INSERT INTO coin_transactions 
           (id, user_id, amount, type, balance_before, balance_after, metadata, created_at, stripe_charge_id)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
        ).bind(
          transactionId,
          userId,
          amount,
          type,
          currentBalance.balance,
          newBalance,
          JSON.stringify(metadata || {}),
          now,
          metadata?.stripeChargeId || null
        )
      ];
      await this.env.DB.batch(batch);
      if (this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["coin_credit", type, userId],
          doubles: [amount, newBalance],
          indexes: [this.env.ENVIRONMENT]
        });
      }
      console.log(`Credited ${amount} coins to user ${userId}. New balance: ${newBalance}`);
      return {
        id: transactionId,
        userId,
        amount,
        type,
        balanceBefore: currentBalance.balance,
        balanceAfter: newBalance,
        metadata,
        createdAt: now,
        stripeChargeId: metadata?.stripeChargeId
      };
    } finally {
      await endSpan(this.env, span, "coins.credit");
    }
  }
  /**
   * Debit coins from user (for gifts, etc.)
   * ATOMIC operation with balance check
   */
  async debitCoins(userId, amount, type, metadata) {
    const span = startSpan("coins.debit");
    try {
      if (!validateCoinAmount(amount)) {
        throw new Error("Invalid coin amount");
      }
      const currentBalance = await this.getBalance(userId);
      if (currentBalance.balance < amount) {
        throw new Error("Insufficient coin balance");
      }
      const newBalance = currentBalance.balance - amount;
      const transactionId = generateTransactionId();
      const now = Date.now();
      const batch = [
        // Update user balance
        this.env.DB.prepare(
          `UPDATE users 
           SET coin_balance = ?1,
               total_spent = total_spent + ?2,
               updated_at = ?3
           WHERE id = ?4`
        ).bind(newBalance, amount, now, userId),
        // Insert transaction record
        this.env.DB.prepare(
          `INSERT INTO coin_transactions 
           (id, user_id, amount, type, balance_before, balance_after, metadata, created_at, related_user_id, gift_id)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
        ).bind(
          transactionId,
          userId,
          -amount,
          // Negative for debit
          type,
          currentBalance.balance,
          newBalance,
          JSON.stringify(metadata || {}),
          now,
          metadata?.relatedUserId || null,
          metadata?.giftId || null
        )
      ];
      await this.env.DB.batch(batch);
      if (this.env.ANALYTICS) {
        this.env.ANALYTICS.writeDataPoint({
          blobs: ["coin_debit", type, userId],
          doubles: [amount, newBalance],
          indexes: [this.env.ENVIRONMENT]
        });
      }
      console.log(`Debited ${amount} coins from user ${userId}. New balance: ${newBalance}`);
      return {
        id: transactionId,
        userId,
        amount: -amount,
        type,
        balanceBefore: currentBalance.balance,
        balanceAfter: newBalance,
        metadata,
        createdAt: now,
        relatedUserId: metadata?.relatedUserId,
        giftId: metadata?.giftId
      };
    } finally {
      await endSpan(this.env, span, "coins.debit");
    }
  }
  /**
   * Transfer coins between users (for gifts)
   * ATOMIC operation - both debit and credit in single transaction
   */
  async transferCoins(fromUserId, toUserId, amount, giftId, videoId) {
    const span = startSpan("coins.transfer");
    try {
      const debitTx = await this.debitCoins(fromUserId, amount, "gift_sent", {
        relatedUserId: toUserId,
        giftId,
        videoId
      });
      const creditTx = await this.creditCoins(toUserId, amount, "reward", {
        relatedUserId: fromUserId,
        giftId,
        videoId
      });
      return { debit: debitTx, credit: creditTx };
    } finally {
      await endSpan(this.env, span, "coins.transfer");
    }
  }
  /**
   * Get transaction history with pagination
   */
  async getTransactionHistory(userId, limit = 50, offset = 0) {
    const span = startSpan("coins.getHistory");
    try {
      const results = await this.env.DB.prepare(
        `SELECT 
           id, user_id, amount, type, 
           balance_before, balance_after, 
           metadata, created_at, stripe_charge_id,
           related_user_id, gift_id
         FROM coin_transactions
         WHERE user_id = ?1
         ORDER BY created_at DESC
         LIMIT ?2 OFFSET ?3`
      ).bind(userId, limit, offset).all();
      return results.results.map((row) => ({
        id: row.id,
        userId: row.user_id,
        amount: row.amount,
        type: row.type,
        balanceBefore: row.balance_before,
        balanceAfter: row.balance_after,
        metadata: row.metadata ? JSON.parse(row.metadata) : void 0,
        createdAt: row.created_at,
        stripeChargeId: row.stripe_charge_id,
        relatedUserId: row.related_user_id,
        giftId: row.gift_id
      }));
    } finally {
      await endSpan(this.env, span, "coins.getHistory");
    }
  }
  /**
   * Get coin packages available for purchase
   */
  getCoinPackages() {
    return COIN_PACKAGES;
  }
  /**
   * Validate and get package details
   */
  getPackageById(packageId) {
    return COIN_PACKAGES.find((pkg) => pkg.id === packageId) || null;
  }
};
function createCoinsService(env) {
  return new CoinsService(env);
}
__name(createCoinsService, "createCoinsService");

// src/handlers/stripe-webhook.handler.ts
async function verifyStripeSignature(payload, signature, secret) {
  try {
    const encoder = new TextEncoder();
    const signatureParts = signature.split(",");
    let timestamp = "";
    let expectedSignature = "";
    for (const part of signatureParts) {
      const [key2, value] = part.split("=");
      if (key2 === "t") timestamp = value;
      if (key2 === "v1") expectedSignature = value;
    }
    if (!timestamp || !expectedSignature) {
      return false;
    }
    const signedPayload = `${timestamp}.${payload}`;
    const signedData = encoder.encode(signedPayload);
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, signedData);
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const computedSignature = signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    if (computedSignature.length !== expectedSignature.length) {
      return false;
    }
    let mismatch = 0;
    for (let i = 0; i < computedSignature.length; i++) {
      if (computedSignature[i] !== expectedSignature[i]) {
        mismatch++;
      }
    }
    return mismatch === 0;
  } catch (error) {
    console.error("Stripe signature verification failed:", error);
    return false;
  }
}
__name(verifyStripeSignature, "verifyStripeSignature");
async function handleStripeWebhook(request, env) {
  const span = startSpan("stripe.webhook");
  try {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return jsonResponse2(false, null, "WEBHOOK_NOT_CONFIGURED", 500);
    }
    const payload = await request.text();
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return jsonResponse2(false, null, "MISSING_SIGNATURE", 400);
    }
    const isValid = await verifyStripeSignature(
      payload,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
    if (!isValid) {
      console.error("Invalid Stripe webhook signature");
      return jsonResponse2(false, null, "INVALID_SIGNATURE", 401);
    }
    const event = JSON.parse(payload);
    const eventType = event.type;
    const eventData = event.data.object;
    console.log(`Received Stripe webhook: ${eventType}`, {
      id: event.id,
      objectId: eventData.id
    });
    switch (eventType) {
      case "charge.succeeded":
        await handleChargeSucceeded(env, eventData);
        break;
      case "charge.failed":
        await handleChargeFailed(env, eventData);
        break;
      case "transfer.created":
        await handleTransferCreated(env, eventData);
        break;
      case "transfer.paid":
        await handleTransferPaid(env, eventData);
        break;
      case "transfer.failed":
        await handleTransferFailed(env, eventData);
        break;
      case "payout.paid":
        await handlePayoutPaid(env, eventData);
        break;
      case "payout.failed":
        await handlePayoutFailed(env, eventData);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return jsonResponse2(false, null, "WEBHOOK_ERROR", 500);
  } finally {
    await endSpan(env, span, "stripe.webhook");
  }
}
__name(handleStripeWebhook, "handleStripeWebhook");
async function handleChargeSucceeded(env, charge) {
  const userId = charge.metadata?.userId;
  const amountCents = charge.amount;
  const chargeId = charge.id;
  const productType = charge.metadata?.productType;
  const packageId = charge.metadata?.packageId;
  if (!userId) {
    console.error("Charge missing userId in metadata:", chargeId);
    return;
  }
  try {
    await env.DB.prepare(
      `UPDATE payment_events 
       SET status = 'completed', 
           metadata = json_set(metadata, '$.stripeChargeId', ?2),
           updated_at = ?3
       WHERE user_id = ?1 
         AND event_type = 'purchase' 
         AND amount_cents = ?4
         AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`
    ).bind(userId, chargeId, Date.now(), amountCents).run();
    if (productType === "coins") {
      const coinsService = createCoinsService(env);
      const coinPackage = packageId ? coinsService.getPackageById(packageId) : null;
      let totalCoins = 0;
      if (coinPackage) {
        totalCoins = coinPackage.coins + (coinPackage.bonusCoins || 0);
      } else {
        totalCoins = charge.metadata?.coins ? parseInt(charge.metadata.coins) : 0;
      }
      if (totalCoins > 0) {
        await coinsService.creditCoins(
          userId,
          totalCoins,
          "purchase",
          {
            stripeChargeId: chargeId,
            packageId,
            amountCents,
            bonusCoins: coinPackage?.bonusCoins || 0,
            purchaseDate: Date.now()
          }
        );
        console.log(`\u2705 Charge succeeded for user ${userId}: ${totalCoins} coins credited`, {
          chargeId,
          packageId,
          amountCents,
          baseCoins: coinPackage?.coins || 0,
          bonusCoins: coinPackage?.bonusCoins || 0
        });
      } else {
        console.error("\u274C No coins to credit for charge:", chargeId);
      }
    } else if (productType === "premium") {
      await env.DB.prepare(
        `UPDATE users 
         SET premium_status = 'active',
             premium_tier = ?1,
             premium_expires_at = ?2,
             updated_at = ?3
         WHERE id = ?4`
      ).bind(
        charge.metadata?.tier || "vip",
        Date.now() + 30 * 24 * 60 * 60 * 1e3,
        // 30 days
        Date.now(),
        userId
      ).run();
      console.log(`\u2705 Premium subscription activated for user ${userId}`, {
        chargeId,
        tier: charge.metadata?.tier || "vip"
      });
    } else {
      console.warn(`\u26A0\uFE0F Unknown product type: ${productType} for charge ${chargeId}`);
    }
  } catch (error) {
    console.error("\u274C Error handling charge.succeeded:", error);
    throw error;
  }
}
__name(handleChargeSucceeded, "handleChargeSucceeded");
async function handleChargeFailed(env, charge) {
  const userId = charge.metadata?.userId;
  const chargeId = charge.id;
  const failureCode = charge.failure_code;
  const failureMessage = charge.failure_message;
  if (!userId) {
    console.error("Failed charge missing userId:", chargeId);
    return;
  }
  try {
    await env.DB.prepare(
      `UPDATE payment_events 
       SET status = 'failed',
           metadata = json_set(
             metadata, 
             '$.stripeChargeId', ?2,
             '$.failureCode', ?3,
             '$.failureMessage', ?4
           ),
           updated_at = ?5
       WHERE user_id = ?1
         AND event_type = 'purchase'
         AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`
    ).bind(userId, chargeId, failureCode, failureMessage, Date.now()).run();
    console.log(`Charge failed for user ${userId}:`, {
      chargeId,
      failureCode,
      failureMessage
    });
  } catch (error) {
    console.error("Error handling charge.failed:", error);
  }
}
__name(handleChargeFailed, "handleChargeFailed");
async function handleTransferCreated(env, transfer) {
  const userId = transfer.metadata?.userId;
  const transferId = transfer.id;
  const amountCents = transfer.amount;
  if (!userId) {
    console.error("Transfer missing userId:", transferId);
    return;
  }
  try {
    await env.DB.prepare(
      `UPDATE payment_events 
       SET status = 'processing',
           metadata = json_set(metadata, '$.stripeTransferId', ?2),
           updated_at = ?3
       WHERE user_id = ?1
         AND event_type = 'payout_pending'
         AND amount_cents = ?4
         AND status IN ('pending', 'review')
       ORDER BY created_at DESC
       LIMIT 1`
    ).bind(userId, transferId, Date.now(), amountCents).run();
    console.log(`Transfer created for user ${userId}:`, {
      transferId,
      amountCents
    });
  } catch (error) {
    console.error("Error handling transfer.created:", error);
  }
}
__name(handleTransferCreated, "handleTransferCreated");
async function handleTransferPaid(env, transfer) {
  const userId = transfer.metadata?.userId;
  const transferId = transfer.id;
  if (!userId) {
    console.error("Transfer paid missing userId:", transferId);
    return;
  }
  try {
    await env.DB.prepare(
      `UPDATE payment_events 
       SET status = 'completed',
           updated_at = ?2
       WHERE user_id = ?1
         AND metadata LIKE '%' || ?3 || '%'
         AND event_type = 'payout_pending'
       LIMIT 1`
    ).bind(userId, Date.now(), transferId).run();
    console.log(`Transfer paid for user ${userId}:`, { transferId });
  } catch (error) {
    console.error("Error handling transfer.paid:", error);
  }
}
__name(handleTransferPaid, "handleTransferPaid");
async function handleTransferFailed(env, transfer) {
  const userId = transfer.metadata?.userId;
  const transferId = transfer.id;
  const failureCode = transfer.failure_code;
  const failureMessage = transfer.failure_message;
  if (!userId) {
    console.error("Transfer failed missing userId:", transferId);
    return;
  }
  try {
    await env.DB.prepare(
      `UPDATE payment_events 
       SET status = 'failed',
           metadata = json_set(
             metadata,
             '$.failureCode', ?2,
             '$.failureMessage', ?3
           ),
           updated_at = ?4
       WHERE user_id = ?1
         AND metadata LIKE '%' || ?5 || '%'
         AND event_type = 'payout_pending'
       LIMIT 1`
    ).bind(userId, failureCode, failureMessage, Date.now(), transferId).run();
    const result = await env.DB.prepare(
      `SELECT amount_cents FROM payment_events 
       WHERE user_id = ?1 
         AND metadata LIKE '%' || ?2 || '%'
       LIMIT 1`
    ).bind(userId, transferId).first();
    if (result && result.amount_cents) {
      await env.DB.prepare(
        `UPDATE users 
         SET balance_cents = balance_cents + ?1,
             updated_at = ?2
         WHERE id = ?3`
      ).bind(result.amount_cents, Date.now(), userId).run();
    }
    console.log(`Transfer failed for user ${userId}:`, {
      transferId,
      failureCode,
      failureMessage
    });
  } catch (error) {
    console.error("Error handling transfer.failed:", error);
  }
}
__name(handleTransferFailed, "handleTransferFailed");
async function handlePayoutPaid(_env, payout) {
  const payoutId = payout.id;
  const amountCents = payout.amount;
  try {
    console.log("Payout paid:", {
      payoutId,
      amountCents,
      arrivalDate: payout.arrival_date
    });
  } catch (error) {
    console.error("Error handling payout.paid:", error);
  }
}
__name(handlePayoutPaid, "handlePayoutPaid");
async function handlePayoutFailed(_env, payout) {
  const payoutId = payout.id;
  const failureCode = payout.failure_code;
  const failureMessage = payout.failure_message;
  try {
    console.error("Payout failed:", {
      payoutId,
      failureCode,
      failureMessage
    });
  } catch (error) {
    console.error("Error handling payout.failed:", error);
  }
}
__name(handlePayoutFailed, "handlePayoutFailed");

// src/handlers/device-telemetry.handler.ts
async function receiveDeviceMetrics(req, env) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];
    if (items.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: { code: "INVALID_PAYLOAD", message: "Empty payload" } }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const first = items[0];
    if (!first.deviceId || !first.platform || !first.metrics) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: "INVALID_PAYLOAD", message: "Missing required fields" }
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS device_metrics (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        device_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        app_version TEXT,
        session_id TEXT,
        startup_time_ms INTEGER,
        auth_latency_ms INTEGER,
        ws_connect_time_ms INTEGER,
        first_message_rtt_ms INTEGER,
        token_rotation_latency_ms INTEGER,
        operation TEXT,
        status_code INTEGER,
        error TEXT,
        timestamp TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    await env.DB.prepare("BEGIN").run();
    for (const itm of items) {
      await env.DB.prepare(`
        INSERT INTO device_metrics (
          device_id,
          platform,
          app_version,
          session_id,
          startup_time_ms,
          auth_latency_ms,
          ws_connect_time_ms,
          first_message_rtt_ms,
          token_rotation_latency_ms,
          operation,
          status_code,
          error,
          timestamp
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
      `).bind(
        itm.deviceId,
        itm.platform,
        itm.appVersion || null,
        itm.sessionId || null,
        itm.metrics.startupTimeMs || null,
        itm.metrics.authLatencyMs || null,
        itm.metrics.wsConnectTimeMs || null,
        itm.metrics.firstMessageRttMs || null,
        itm.metrics.tokenRotationLatencyMs || null,
        itm.metrics.operation || null,
        itm.metrics.statusCode || null,
        itm.metrics.error || null,
        itm.timestamp
      ).run();
    }
    await env.DB.prepare("COMMIT").run();
    try {
      const sample = items[0];
      console.log("[DeviceTelemetry]", {
        device: `${sample.platform}/${(sample.deviceId || "").substring(0, 8)}`,
        metrics: sample.metrics,
        count: items.length
      });
    } catch {
    }
    return new Response(
      JSON.stringify({ success: true, data: { received: true, count: items.length } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[DeviceTelemetry] Error:", error);
    try {
      await env.DB.prepare("ROLLBACK").run();
    } catch {
    }
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to store metrics" }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(receiveDeviceMetrics, "receiveDeviceMetrics");
async function getDeviceMetricsAggregates(req, env) {
  try {
    const since = Date.now() - 24 * 3600 * 1e3;
    const sinceDate = new Date(since).toISOString();
    const aggregates = await env.DB.prepare(`
      SELECT
        platform,
        COUNT(*) as sample_count,
        AVG(auth_latency_ms) as avg_auth_latency,
        AVG(ws_connect_time_ms) as avg_ws_connect,
        AVG(first_message_rtt_ms) as avg_first_msg_rtt,
        AVG(token_rotation_latency_ms) as avg_token_rotation,
        COUNT(DISTINCT device_id) as unique_devices,
        COUNT(DISTINCT session_id) as unique_sessions
      FROM device_metrics
      WHERE created_at > ?1
      GROUP BY platform
    `).bind(sinceDate).all();
    const latencyDist = await env.DB.prepare(`
      SELECT auth_latency_ms, ws_connect_time_ms, first_message_rtt_ms
      FROM device_metrics
      WHERE created_at > ?1 AND auth_latency_ms IS NOT NULL
      ORDER BY auth_latency_ms
    `).bind(sinceDate).all();
    const authLatencies = latencyDist.results?.map((r) => r.auth_latency_ms).filter((n) => n) || [];
    const p50Auth = authLatencies[Math.floor(authLatencies.length * 0.5)] || null;
    const p95Auth = authLatencies[Math.floor(authLatencies.length * 0.95)] || null;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          aggregates: aggregates.results,
          percentiles: {
            auth_p50: p50Auth,
            auth_p95: p95Auth
          },
          period: "24h"
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[DeviceTelemetry] Aggregates error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to get aggregates" }
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
__name(getDeviceMetricsAggregates, "getDeviceMetricsAggregates");

// src/handlers/auth.sync.handler.ts
async function syncUser(req, env) {
  try {
    const auth = req.headers.get("Authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Missing token" } }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    const fbUser = await verifyFirebaseToken(token, env);
    if (!fbUser) {
      return new Response(JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid Firebase token" } }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
    const body = await req.json();
    const uid = body?.uid || fbUser.uid;
    const email = body?.email || fbUser.email || null;
    const username = body?.username || null;
    const displayName = body?.displayName || null;
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        username TEXT,
        display_name TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    const existing = await env.DB.prepare("SELECT id FROM users WHERE id = ?1").bind(uid).first();
    if (!existing) {
      await env.DB.prepare("INSERT INTO users (id, email, username, display_name) VALUES (?1, ?2, ?3, ?4)").bind(uid, email, username, displayName).run();
    } else {
      await env.DB.prepare("UPDATE users SET email = ?2, username = ?3, display_name = ?4 WHERE id = ?1").bind(uid, email, username, displayName).run();
    }
    return jsonResponse2(true, { synced: true, uid });
  } catch (error) {
    console.error("[auth.sync] Error:", error);
    return new Response(JSON.stringify({ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to sync user" } }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
__name(syncUser, "syncUser");

// src/ws/chat.websocket.ts
var rooms = /* @__PURE__ */ new Map();
function getRoom(id) {
  let r = rooms.get(id);
  if (!r) {
    r = /* @__PURE__ */ new Set();
    rooms.set(id, r);
  }
  return r;
}
__name(getRoom, "getRoom");
var handleChatWebSocket = /* @__PURE__ */ __name(async (request, _env, _ctx, params) => {
  try {
    let sendError2 = function(code, message) {
      server.send(JSON.stringify({ type: "error", code, message }));
      try {
        server.close(code, message);
      } catch {
      }
    };
    var sendError = sendError2;
    __name(sendError2, "sendError");
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 400 });
    }
    const roomId = params.roomId || "latencyroom";
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    const room = getRoom(roomId);
    let authed = false;
    let userContext = {};
    server.addEventListener("message", (ev) => {
      const raw = String(ev.data || "").trim();
      if (!raw) return;
      if (!authed) {
        let auth;
        try {
          auth = JSON.parse(raw);
        } catch {
          sendError2(400, "Malformed auth payload");
          return;
        }
        if (!auth.token || !auth.role || typeof auth.twofa !== "boolean") {
          sendError2(401, "Missing auth fields");
          return;
        }
        if (auth.token.length < 8) {
          sendError2(401, "Invalid token");
          return;
        }
        authed = true;
        userContext = { userId: auth.token.slice(0, 8), role: auth.role, twofa: auth.twofa };
        room.add(server);
        server.send(JSON.stringify({ type: "welcome", roomId, connections: room.size, ts: Date.now(), context: userContext }));
        return;
      }
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        sendError2(400, "Malformed message");
        return;
      }
      if (!["ping", "chat", "admin", "ops", "support"].includes(msg.type)) {
        sendError2(403, "Invalid message type");
        return;
      }
      if (msg.type === "admin" && userContext.role !== "ROLE_ADMIN") {
        sendError2(403, "Admin access denied");
        return;
      }
      if (msg.type === "ops" && userContext.role !== "ROLE_OPS") {
        sendError2(403, "Ops access denied");
        return;
      }
      if (msg.type === "ping") {
        try {
          server.send(JSON.stringify({ type: "pong", ts: Date.now() }));
        } catch {
        }
        return;
      }
      if (msg.type === "chat" && typeof msg.payload === "string" && msg.payload.length < 256) {
        for (const ws of room) {
          if (ws === server) continue;
          try {
            ws.send(JSON.stringify({ type: "chat", payload: msg.payload, context: userContext }));
          } catch {
            room.delete(ws);
          }
        }
        return;
      }
      server.send(JSON.stringify({ type: msg.type, payload: msg.payload, context: userContext }));
    });
    server.addEventListener("close", () => {
      room.delete(server);
    });
    return new Response(null, { status: 101, webSocket: client });
  } catch (e) {
    console.error("WebSocket setup error", e);
    return new Response(JSON.stringify({ success: false, error: "WEBSOCKET_INIT_FAILED", message: String(e.message || "error") }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}, "handleChatWebSocket");

// src/router.ts
var routes = [];
function addRoute(method, path, handler) {
  const paramNames = [];
  const pattern = path.replace(/\//g, "\\/").replace(/:(\w+)/g, (_, name) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  routes.push({
    method: method.toUpperCase(),
    pattern: new RegExp(`^${pattern}$`),
    handler,
    paramNames
  });
}
__name(addRoute, "addRoute");
async function route(path, method, request, env, ctx) {
  for (const route2 of routes) {
    if (route2.method !== method.toUpperCase()) continue;
    const match = path.match(route2.pattern);
    if (!match) continue;
    const params = {};
    for (let i = 0; i < route2.paramNames.length; i++) {
      params[route2.paramNames[i]] = match[i + 1];
    }
    const endpointTag = `route:${route2.method}:${route2.pattern.source}`;
    return await instrumentRequest(env, endpointTag, () => route2.handler(request, env, ctx, params));
  }
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Endpoint not found"
      }
    }),
    {
      status: 404,
      headers: { "Content-Type": "application/json" }
    }
  );
}
__name(route, "route");
function setupRoutes() {
  const healthHandler = /* @__PURE__ */ __name(async () => {
    return new Response(
      JSON.stringify({
        success: true,
        data: { status: "healthy", timestamp: Date.now() }
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }, "healthHandler");
  addRoute("GET", "/health", healthHandler);
  addRoute("GET", "/healthz", healthHandler);
  addRoute("POST", "/auth/register", rateLimit(5, 300)(register));
  addRoute("POST", "/auth/login", rateLimit(5, 300)(login));
  addRoute("POST", "/auth/refresh", rateLimit(20, 300)(refresh));
  addRoute("POST", "/auth/logout", requireAuth(logout));
  addRoute("GET", "/feed/foryou", optionalAuth(forYou));
  addRoute("GET", "/feed/following", requireAuth(following));
  addRoute("POST", "/videos/upload", requireAuth(upload));
  addRoute("GET", "/videos/:id", optionalAuth(get));
  addRoute("GET", "/videos/:id/processing-status", requireAuth(getProcessingStatus));
  addRoute("POST", "/videos/:id/like", requireAuth(like));
  addRoute("DELETE", "/videos/:id/like", requireAuth(unlike));
  addRoute("POST", "/videos/:id/comments", requireAuth(addComment));
  addRoute("GET", "/users/me", requireAuth(me));
  addRoute("GET", "/users/:id", optionalAuth(get2));
  addRoute("PATCH", "/users/:id", requireAuth(update));
  addRoute("POST", "/users/:id/follow", requireAuth(follow));
  addRoute("DELETE", "/users/:id/unfollow", requireAuth(unfollow));
  addRoute("GET", "/chat/conversations", requireAuth(getConversations));
  addRoute("GET", "/chat/conversations/:id/messages", requireAuth(getMessages));
  addRoute("POST", "/chat/messages", requireAuth(sendMessage));
  addRoute("DELETE", "/chat/messages/:id", requireAuth(deleteMessage));
  addRoute("POST", "/chat/typing/start", requireAuth(startTyping));
  addRoute("POST", "/chat/typing/stop", requireAuth(stopTyping));
  addRoute("POST", "/chat/presence", requireAuth(updatePresence));
  addRoute("GET", "/chat/presence/:userId", requireAuth(getPresence));
  addRoute("GET", "/ads/feed", optionalAuth(getAdsForFeed));
  addRoute("POST", "/ads/impression", optionalAuth(trackImpression));
  addRoute("POST", "/ads/click", optionalAuth(trackClick));
  addRoute("GET", "/ads/pricing/tiers", requireAuth(getPricingTiers));
  addRoute("GET", "/ads/pricing/recommend", requireAuth(getRecommendedPricing));
  addRoute("POST", "/advertisers/register", requireAuth(createAdvertiserAccount));
  addRoute("GET", "/advertisers/dashboard", requireAuth(getAdvertiserDashboard));
  addRoute("POST", "/advertisers/campaigns", requireAuth(createCampaign));
  addRoute("GET", "/advertisers/campaigns/:campaignId/analytics", requireAuth(getCampaignAnalytics));
  addRoute("POST", "/advertisers/campaigns/:campaignId/creatives", requireAuth(uploadCreative));
  addRoute("POST", "/live/:streamId/join", requireAuth(joinStream));
  addRoute("POST", "/live/:streamId/leave", requireAuth(leaveStream));
  addRoute("POST", "/live/:streamId/gift", requireAuth(sendStreamGift));
  addRoute("GET", "/live/:streamId/state", optionalAuth(getStreamState));
  addRoute("POST", "/live/:streamId/presence", requireAuth(updatePresence2));
  addRoute("POST", "/compliance/consent", requireAuth(recordConsent));
  addRoute("GET", "/compliance/consent/:userId", requireAuth(getConsent));
  addRoute("DELETE", "/compliance/consent/:userId", requireAuth(withdrawConsent));
  addRoute("DELETE", "/compliance/erase/:userId", requireAuth(eraseUserData));
  addRoute("POST", "/compliance/age", requireAuth(recordAgeVerification));
  addRoute("GET", "/metrics/economy/summary", requireAuth(getEconomySummary));
  addRoute("GET", "/metrics/economy/gifts/top", requireAuth(getTopGifters));
  addRoute("GET", "/metrics/perf/latency", requireAuth(getLatencySnapshot));
  addRoute("GET", "/metrics/economy/subscriptions", requireAuth(getSubscriptionSummary));
  addRoute("POST", "/metrics/perf/latency", optionalAuth(postPerfTelemetry));
  addRoute("GET", "/creator/:userId/analytics", requireAuth(getCreatorAnalytics));
  addRoute("GET", "/compliance/audit/:userId", requireAuth(auditUserCompliance));
  addRoute("POST", "/subscriptions/plans", requireAuth(createPlan));
  addRoute("GET", "/subscriptions/plans", optionalAuth(listPlans));
  addRoute("POST", "/subscriptions/subscribe", requireAuth(subscribe));
  addRoute("POST", "/subscriptions/cancel", requireAuth(cancelSubscription));
  addRoute("GET", "/subscriptions/me", requireAuth(mySubscription));
  addRoute("GET", "/subscriptions/feature", requireAuth(checkFeatureGate));
  addRoute("POST", "/payouts/request", requireAuth(requestPayout));
  addRoute("GET", "/payouts/ledger/:userId", requireAuth(getLedger));
  addRoute("POST", "/payouts/kyc", requireAuth(submitKyc));
  addRoute("POST", "/referral/code", requireAuth(createCode));
  addRoute("POST", "/referral/activate", requireAuth(activateCode));
  addRoute("GET", "/referral/stats/:code", requireAuth(getStats));
  addRoute("POST", "/webhooks/stripe", handleStripeWebhook);
  addRoute("GET", "/metrics/telemetry", requireAuth(async (_req, env) => {
    const snap = await exportTelemetry(env);
    return new Response(JSON.stringify({ success: true, data: snap }), { headers: { "Content-Type": "application/json" } });
  }));
  addRoute("POST", "/metrics/device", requireAuth(receiveDeviceMetrics));
  addRoute("GET", "/metrics/device/aggregates", requireAuth(getDeviceMetricsAggregates));
  addRoute("POST", "/auth/sync", requireAuth(syncUser));
  addRoute("GET", "/chat/ws/:roomId", requireAuth(handleChatWebSocket));
  addRoute("GET", "/chat/regions/stats", requireAuth(async (_req, env) => {
    if (!env.CHAT_ROOM) return new Response(JSON.stringify({ success: false, error: { code: "CONFIG_ERROR", message: "CHAT_ROOM binding missing" } }), { status: 500, headers: { "Content-Type": "application/json" } });
    const id = env.CHAT_ROOM.idFromName("global-chat");
    const stub = env.CHAT_ROOM.get(id);
    const res = await stub.fetch("https://do/global-chat/stats");
    return res;
  }));
}
__name(setupRoutes, "setupRoutes");

// src/index.ts
init_jwt_utils();

// src/durable/live_stream.do.ts
var LiveStream = class {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }
  static {
    __name(this, "LiveStream");
  }
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const span = startSpan("LiveStream.fetch", { path });
    try {
      const stored = await this.load();
      if (path.endsWith("/join")) {
        const userId = url.searchParams.get("userId");
        if (!userId) return this.json(false, null, "MISSING_USER", 400);
        if (!stored.viewers.includes(userId)) stored.viewers.push(userId);
        stored.presence[userId] = { lastSeen: Date.now(), status: "online" };
        stored.version++;
        await this.save(stored);
        return this.json(true, { viewerCount: stored.viewers.length, version: stored.version });
      }
      if (path.endsWith("/leave")) {
        const userId = url.searchParams.get("userId");
        if (!userId) return this.json(false, null, "MISSING_USER", 400);
        stored.viewers = stored.viewers.filter((v) => v !== userId);
        delete stored.presence[userId];
        stored.version++;
        await this.save(stored);
        return this.json(true, { viewerCount: stored.viewers.length, version: stored.version });
      }
      if (path.endsWith("/gift")) {
        const body = await request.json().catch(() => ({}));
        const giftType = body.giftType;
        if (!giftType) return this.json(false, null, "MISSING_GIFT_TYPE", 400);
        stored.gifts[giftType] = (stored.gifts[giftType] || 0) + 1;
        stored.version++;
        await this.save(stored);
        return this.json(true, { gifts: stored.gifts, version: stored.version });
      }
      if (path.endsWith("/presence")) {
        const body = await request.json().catch(() => ({}));
        const userId = body.userId;
        const status = body.status || "online";
        if (!userId) return this.json(false, null, "MISSING_USER", 400);
        stored.presence[userId] = { lastSeen: Date.now(), status };
        stored.version++;
        await this.save(stored);
        return this.json(true, { presence: stored.presence[userId], version: stored.version });
      }
      if (path.endsWith("/state")) {
        const sinceParam = url.searchParams.get("since");
        const since = sinceParam ? parseInt(sinceParam, 10) : void 0;
        if (since !== void 0 && since === stored.version) {
          return this.json(true, { diff: {}, version: stored.version });
        }
        const diff = {
          viewers: stored.viewers.length,
          gifts: stored.gifts,
          presence: Object.keys(stored.presence).length
        };
        return this.json(true, { diff, version: stored.version });
      }
      return this.json(false, null, "NOT_FOUND", 404);
    } finally {
      await endSpan(this.env, span, "livestream");
    }
  }
  async load() {
    const raw = await this.state.storage.get("state");
    if (!raw) return { viewers: [], presence: {}, gifts: {}, version: 0 };
    try {
      const parsed = JSON.parse(raw);
      if (parsed.version === void 0) parsed.version = 0;
      return parsed;
    } catch {
      return { viewers: [], presence: {}, gifts: {}, version: 0 };
    }
  }
  async save(state) {
    await this.state.storage.put("state", JSON.stringify(state));
  }
  json(success, data, errorCode, status = 200) {
    return new Response(
      JSON.stringify(success ? { success: true, data } : { success: false, error: { code: errorCode || "ERROR", message: errorCode || "error" } }),
      { status, headers: { "Content-Type": "application/json" } }
    );
  }
};

// src/do/chat-room.ts
var ChatRoom = class {
  static {
    __name(this, "ChatRoom");
  }
  connections = /* @__PURE__ */ new Set();
  regionCounts = /* @__PURE__ */ new Map();
  latencyBuckets = /* @__PURE__ */ new Map();
  latencySeries = /* @__PURE__ */ new Map();
  // time-series for predictive modeling
  bucketThresholds = [20, 50, 100, 200, 500];
  // ms boundaries
  maxSeriesLength = 300;
  // cap per region
  predictiveWindow = 30;
  // samples window for trend calculation
  p95Threshold = 150;
  // ms
  connectionHotThreshold = 0.8;
  // 80% of total
  constructor(_state, _env) {
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/stats")) {
      return this.statsResponse();
    }
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response(JSON.stringify({ success: false, error: { code: "EXPECTED_UPGRADE", message: "Expected websocket upgrade or /stats" } }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    return this.handleUpgrade(request);
  }
  handleUpgrade(request) {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    const region = request.cf?.colo || "global";
    const roomId = new URL(request.url).pathname.split("/").pop() || "default";
    const meta = { ws: server, region, roomId, joinedAt: Date.now() };
    this.connections.add(meta);
    this.regionCounts.set(region, (this.regionCounts.get(region) || 0) + 1);
    server.send(`welcome|connections=${this.connections.size}|region=${region}|room=${roomId}`);
    server.addEventListener("message", (evt) => {
      const raw = String(evt.data || "").trim();
      if (!raw) return;
      if (raw.startsWith("ping")) {
        const parts = raw.split("|");
        if (parts.length === 2) {
          const clientTs = parseInt(parts[1], 10);
          if (!isNaN(clientTs)) {
            const upstreamLatency = Date.now() - clientTs;
            this.recordLatency(region, upstreamLatency);
            try {
              server.send(`ping|${clientTs}|${upstreamLatency}`);
            } catch {
            }
            return;
          }
        }
        try {
          server.send("ping");
        } catch {
        }
        return;
      }
      const envelope = JSON.stringify({ payload: raw, ts: Date.now(), region, room: roomId, globalConnections: this.connections.size });
      for (const c of this.connections) {
        try {
          c.ws.send(envelope);
        } catch {
          this.connections.delete(c);
        }
      }
    });
    server.addEventListener("close", () => {
      this.connections.delete(meta);
      this.regionCounts.set(region, Math.max(0, (this.regionCounts.get(region) || 1) - 1));
    });
    return new Response(null, { status: 101, webSocket: client });
  }
  recordLatency(region, ms) {
    let hist = this.latencyBuckets.get(region);
    if (!hist) {
      hist = { buckets: Array(this.bucketThresholds.length + 1).fill(0), samples: 0, sum: 0, max: 0 };
      this.latencyBuckets.set(region, hist);
    }
    let idx = this.bucketThresholds.findIndex((t) => ms < t);
    if (idx === -1) idx = this.bucketThresholds.length;
    hist.buckets[idx]++;
    hist.samples++;
    hist.sum += ms;
    if (ms > hist.max) hist.max = ms;
    let series = this.latencySeries.get(region);
    if (!series) {
      series = [];
      this.latencySeries.set(region, series);
    }
    series.push({ ts: Date.now(), ms });
    if (series.length > this.maxSeriesLength) series.splice(0, series.length - this.maxSeriesLength);
  }
  computeP95(region) {
    const series = this.latencySeries.get(region);
    if (!series || series.length === 0) return 0;
    const sorted = series.map((s) => s.ms).sort((a, b) => a - b);
    const idx = Math.floor(sorted.length * 0.95);
    return sorted[idx];
  }
  buildSuggestions() {
    const suggestions = [];
    const total = this.connections.size;
    if (total === 0) return suggestions;
    for (const [region, count] of this.regionCounts.entries()) {
      const pct = count / total;
      const hist = this.latencyBuckets.get(region);
      const avg = hist && hist.samples ? hist.sum / hist.samples : 0;
      const p95 = this.computeP95(region);
      if (pct > 0.5 && avg > 100 || p95 > this.p95Threshold) {
        let target;
        for (const [r2, c2] of this.regionCounts.entries()) {
          if (r2 === region) continue;
          const p95Target = this.computeP95(r2);
          if (p95Target < 80 && c2 / total < 0.2) {
            target = r2;
            break;
          }
        }
        if (target) suggestions.push(`Shift ~20% traffic from ${region} to ${target} (avg ${avg.toFixed(1)}ms, p95 ${p95}ms).`);
        else suggestions.push(`Scale out edge capacity for ${region} (avg ${avg.toFixed(1)}ms, p95 ${p95}ms, ${Math.round(pct * 100)}% load).`);
      }
    }
    return suggestions;
  }
  predictiveHotspot(region) {
    const series = this.latencySeries.get(region);
    if (!series || series.length < this.predictiveWindow * 2) return false;
    const recent = series.slice(-this.predictiveWindow);
    const prev = series.slice(-this.predictiveWindow * 2, -this.predictiveWindow);
    const avgRecent = recent.reduce((a, b) => a + b.ms, 0) / recent.length;
    const avgPrev = prev.reduce((a, b) => a + b.ms, 0) / prev.length;
    const growth = avgRecent - avgPrev;
    const projectedP95 = this.computeP95(region) + growth;
    return growth > 15 && projectedP95 > this.p95Threshold;
  }
  regionAlerts(region, totalConnections) {
    const count = this.regionCounts.get(region) || 0;
    const pct = totalConnections ? count / totalConnections : 0;
    const p95 = this.computeP95(region);
    const hotspot = p95 > this.p95Threshold || pct > this.connectionHotThreshold;
    const predictive = this.predictiveHotspot(region);
    const reasons = [];
    if (p95 > this.p95Threshold) reasons.push(`p95 ${p95}ms > ${this.p95Threshold}ms threshold`);
    if (pct > this.connectionHotThreshold) reasons.push(`connection share ${(pct * 100).toFixed(1)}% > ${(this.connectionHotThreshold * 100).toFixed(0)}% threshold`);
    if (predictive) reasons.push("trend suggests imminent hotspot (growth & projected p95)");
    let recommendation;
    if (hotspot || predictive) {
      let candidate;
      for (const [r2] of this.regionCounts.entries()) {
        if (r2 === region) continue;
        const p95c = this.computeP95(r2);
        const pctc = totalConnections ? (this.regionCounts.get(r2) || 0) / totalConnections : 0;
        if (p95c < 80 && pctc < 0.25) {
          candidate = r2;
          break;
        }
      }
      recommendation = candidate ? `shift 15-25% traffic to ${candidate}` : "provision additional edge capacity or enable autoscale";
    }
    return { hotspot, predictive, reasons, recommendation, p95 };
  }
  async statsResponse() {
    const regions = {};
    const total = this.connections.size;
    for (const [region, count] of this.regionCounts.entries()) {
      const hist = this.latencyBuckets.get(region);
      const avg = hist && hist.samples ? hist.sum / hist.samples : 0;
      const max = hist?.max || 0;
      const buckets = hist ? hist.buckets : Array(this.bucketThresholds.length + 1).fill(0);
      const p95 = this.computeP95(region);
      const alerts = this.regionAlerts(region, total);
      const series = (this.latencySeries.get(region) || []).slice(-50);
      regions[region] = { connections: count, latency: { buckets, thresholds: this.bucketThresholds, avg, max, p95, samples: hist?.samples || 0 }, alerts, series };
    }
    const payload = { regions, totalConnections: total, suggestions: this.buildSuggestions(), generatedAt: Date.now() };
    return new Response(JSON.stringify({ success: true, data: payload }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
};

// src/index.ts
setupRoutes();
var index_default = {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    try {
      const upgradeHeader = request.headers.get("Upgrade");
      const url = new URL(request.url);
      const rawPath = url.pathname.replace(/^\/v1/, "");
      if (upgradeHeader === "websocket" && /^\/chat\/ws\//.test(rawPath)) {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response(JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "Missing auth" } }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        try {
          const token = authHeader.slice(7);
          const payload = await verifyToken(token, env);
          if (!payload || payload.type !== "access") throw new Error("Invalid token");
        } catch {
          return new Response(JSON.stringify({ success: false, error: { code: "INVALID_TOKEN", message: "Token verification failed" } }), { status: 401, headers: { "Content-Type": "application/json" } });
        }
        const parts = rawPath.split("/");
        const roomId = parts[3] || "latencyroom";
        if (roomId === "latencyroom") {
          const params = { roomId };
          return await handleChatWebSocket(request, env, ctx, params);
        }
        if (!env.CHAT_ROOM) {
          return new Response(JSON.stringify({ success: false, error: { code: "CONFIG_ERROR", message: "CHAT_ROOM namespace missing" } }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
        const id = env.CHAT_ROOM.idFromName("global-chat");
        const stub = env.CHAT_ROOM.get(id);
        return await stub.fetch(request);
      }
      const middlewareResult = await applyMiddleware(request, env, ctx);
      if (middlewareResult) return addCorsHeaders(middlewareResult, env);
      const path = rawPath;
      const method = request.method;
      const response = await route(path, method, request, env, ctx);
      if (response.status === 101 && response.webSocket) {
        const duration2 = Date.now() - startTime;
        try {
          await recordLatencySample(env, path, duration2);
        } catch {
        }
        return response;
      }
      const duration = Date.now() - startTime;
      const newHeaders = new Headers(response.headers);
      newHeaders.set("X-Response-Time", `${duration}ms`);
      const newResponse = new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
      try {
        await recordLatencySample(env, path, duration);
      } catch {
      }
      if (env.ANALYTICS) {
        try {
          env.ANALYTICS.writeDataPoint({
            blobs: [path, method, response.status.toString()],
            doubles: [duration],
            indexes: [env.ENVIRONMENT]
          });
        } catch {
        }
      }
      return addCorsHeaders(newResponse, env);
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred"
          }
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  }
};
export {
  ChatRoom,
  LiveStream,
  index_default as default
};
//# sourceMappingURL=index.js.map

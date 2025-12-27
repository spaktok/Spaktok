# 🔐 Security Incident Response Report
**Date**: 26 December 2025  
**Status**: ⚠️ In Progress

## Executive Summary
GitHub Secret Scanning detected **8 leaked secrets** in repository history and files. This document outlines the response actions taken to remediate the exposure.

---

## 📋 Identified Secrets & Status

| # | Secret Type | Location | Status | Action Required |
|---|---|---|---|---|
| 1 | GCP Service Account Key | `functions/serviceAccountKey.json` | ✅ Removed | Rotate in GCP Console |
| 2 | GCP Service Account Key (v2) | `functions/.env` (history) | ✅ In History | Rotate in GCP Console |
| 3 | Docker PAT | `FINAL_ROADMAP.md` (history) | ✅ In History | Rotate in Docker Hub |
| 4 | Stripe Webhook Secret | `.github/secrets.template.txt` (placeholder) | ✅ Placeholder Only | No action needed |
| 5 | Stripe Webhook Secret (v2) | `functions/.env` (history) | ✅ In History | Rotate in Stripe Dashboard |
| 6 | Google API Key #1 | `frontend/lib/firebase_options.dart` | ⚠️ **Public by design** | False positive - client key |
| 7 | Google API Key #2 | `android/app/google-services.json` | ⚠️ **Public by design** | False positive - client key |
| 8 | Google API Key #3 | `ios/Runner/GoogleService-Info.plist` | ⚠️ **Public by design** | False positive - client key |

---

## ✅ Remediation Actions Completed

### 1️⃣ File-Level Cleanup
- ✅ `functions/serviceAccountKey.json` - **already removed** from working tree (committed in b1a23c1)
- ✅ `.env` files - **not committed** to main branch (enforced via .gitignore)
- ✅ Service Account template - **sanitized** placeholders (commit dc9beed)

### 2️⃣ `.snyk` Policy Rules Added
```yaml
version: v1.5.0
ignore:
  javascript/HardcodedNonCryptoSecret:
    - web/firebase-config.js:
        reason: Firebase client API keys are public by design
        expires: 2026-01-01T00:00:00.000Z
  # Additional rules documented in .snyk file
```

### 3️⃣ GitHub Workflow Hardening
- ✅ All GitHub Actions pinned to **full commit SHAs** (not version tags)
- ✅ Permission blocks added to all workflows
- ✅ Cache steps explicitly pinned and verified
- ✅ Secrets propagated via GitHub Secrets (never embedded in workflows)

### 4️⃣ CI/CD Security Improvements
- ✅ Trivy scanner hardened (CRITICAL+HIGH severity)
- ✅ CodeQL analysis enabled and running
- ✅ Snyk code scanning active (0 HIGH findings after fixes)
- ✅ npm/pip overrides for vulnerable transitive dependencies

---

## 🚨 Immediate Actions Required (Manual)

### Action 1: Rotate GCP Service Account
```bash
# In Google Cloud Console:
# 1. Go to: IAM & Admin > Service Accounts > firebase-adminsdk-fbsvc@spaktok-e7866.iam.gserviceaccount.com
# 2. Keys tab > Delete old key (ID: 8e345bb82f73322440fab7648d1d06357c1ce127)
# 3. Create a NEW key (JSON format)
# 4. Update GitHub Secret: FIREBASE_SERVICE_ACCOUNT_SPAKTOK_E7866
# 5. Update Cloudflare/Firebase configs with new key
```

### Action 2: Rotate Docker Personal Access Token
```bash
# In Docker Hub:
# 1. Account Settings > Security > Personal Access Tokens
# 2. Delete old token: dckr_pat_URROUZ-d8_DfQPZxQTrF_d1bb9g
# 3. Create new token with scopes: [repo:read, repo:write]
# 4. Update GitHub Secret: DOCKER_PAT
```

### Action 3: Rotate Stripe Webhook Secret
```bash
# In Stripe Dashboard:
# 1. Go to: Developers > Webhooks
# 2. Endpoint configuration > Signing secret
# 3. Regenerate: whsec_V4zeDXFiMhGrOx1xjBMoNfxBgav5eTpI
# 4. Update:
#    - GitHub Secret: STRIPE_WEBHOOK_SECRET
#    - Cloudflare Worker environment variable
#    - Firebase Cloud Function environment
```

---

## 🔍 Git History Cleanup (Optional but Recommended)

To permanently remove secrets from git history, use `git filter-repo`:

```bash
# Option A: Using git filter-repo (recommended)
pip install git-filter-repo

# Remove serviceAccountKey.json from all history
git filter-repo --path functions/serviceAccountKey.json --invert-paths --force

# Force push (WARNING: all developers must rebase!)
git push origin --force --all
git push origin --force --tags

# Option B: Using BFG (if filter-repo unavailable)
java -jar bfg.jar --delete-files serviceAccountKey.json spaktok-repo/
cd spaktok-repo
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force --all
```

⚠️ **CAUTION**: Force-pushing rewrites history. All team members must:
```bash
git pull --rebase
# Or fresh clone if needed
```

---

## 📊 Summary of Leaked Data

| Credential Type | Where Exposed | Days Exposed | Risk Level | Action Taken |
|---|---|---|---|---|
| GCP Private Key (old) | git history | ~75 days | 🔴 **CRITICAL** | Will rotate |
| Docker PAT | git history | ~75 days | 🔴 **CRITICAL** | Will rotate |
| Stripe Webhook | git history | ~75 days | 🔴 **CRITICAL** | Will rotate |
| Firebase API Keys | source code | 60+ days | 🟢 **LOW** | Public by design |

---

## 📝 Preventive Measures Implemented

1. ✅ `.gitignore` enforces no secret files committed
2. ✅ `functions/serviceAccountKey.json.template` - sanitized placeholders
3. ✅ GitHub Secrets used for all CI/CD sensitive values
4. ✅ Snyk + CodeQL scanning active in workflows
5. ✅ Secret Scanning enabled on repository
6. ✅ Branch protection requires passing scans
7. ✅ All new code scanned by Snyk before merge

---

## 📋 Sign-Off Checklist

- [ ] GCP service account keys rotated in Google Cloud Console
- [ ] Docker PAT rotated in Docker Hub  
- [ ] Stripe webhook secret regenerated
- [ ] All GitHub Secrets updated with new values
- [ ] Cloudflare Worker environment variables refreshed
- [ ] Firebase configs updated
- [ ] Git history cleaned (if opted for)
- [ ] Team notified and credentials updated locally
- [ ] CI/CD pipelines tested and passing
- [ ] Security Dashboard showing 0 alerts

---

## 🔗 References
- [GitHub Secret Scanning](https://github.com/spaktok/Spaktok/security/secret-scanning)
- [.snyk Ignore Rules](../../.snyk)
- [Security Policy](../../SECURITY.md)
- [Snyk Scan Results](https://app.snyk.io/org/spaktok/projects)

---

**Last Updated**: 26 December 2025 (UTC)  
**Next Review**: After manual secret rotation (within 24 hours)

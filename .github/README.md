# 🔐 إعداد أسرار GitHub بسرعة

## طريقتان لإضافة الأسرار:

### ⚡ الطريقة 1: سكريبت تفاعلي (الأسهل)

```powershell
# تأكد من تثبيت GitHub CLI أولاً
winget install --id GitHub.cli

# سجل دخول
gh auth login

# قم بتشغيل السكريبت
cd .github
.\setup-secrets.ps1
```

السكريبت سيرشدك خطوة بخطوة لإضافة كل سر.

---

### 📋 الطريقة 2: يدوياً من GitHub

1. اذهب إلى مستودع GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. **New repository secret**
4. استخدم القائمة أدناه

---

## 📝 قائمة الأسرار المطلوبة

### ✅ أساسية (يجب إضافتها):

| Secret | الوصف | كيفية الحصول عليه |
|--------|-------|-------------------|
| `AGORA_APP_ID` | معرف Agora | [console.agora.io](https://console.agora.io/) → Project |
| `AGORA_APP_CERT` | شهادة Agora | Agora Console → Primary Certificate |
| `AGORA_CHAT_APP_KEY` | مفتاح Chat | Agora Console → Products → Chat |
| `FIREBASE_TOKEN` | توكن Firebase | `firebase login:ci` |
| `FIREBASE_PROJECT_ID` | معرف المشروع | `spaktok-e7866` |
| `FIREBASE_SERVICE_ACCOUNT_SPAKTOK_F7866` | JSON للخدمة | Firebase Console → Service Accounts |
| `DOCKER_USER` | اسم مستخدم Docker | اسمك في hub.docker.com |
| `DOCKER_PAT` | توكن Docker | Docker Hub → Security → New Token |
| `STRIPE_PUBLISHABLE_KEY` | مفتاح Stripe | dashboard.stripe.com → API keys |
| `STRIPE_SECRET_KEY` | سر Stripe | نفس المكان → Secret key |

### 🔹 إضافية (موصى بها):

| Secret | الوصف |
|--------|-------|
| `STRIPE_WEBHOOK_SECRET` | سر Webhook |
| `CLOUDFLARE_API_TOKEN` | توكن Workers |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | مفتاح R2 |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | سر R2 |
| `CLOUDFLARE_STREAM_API_TOKEN` | توكن Stream |

---

## 📚 ملفات مساعدة:

- 📘 **[SECRETS_SETUP_GUIDE.md](SECRETS_SETUP_GUIDE.md)** - دليل شامل مفصل
- 📄 **[secrets.template.txt](secrets.template.txt)** - قالب للنسخ
- ⚡ **[setup-secrets.ps1](setup-secrets.ps1)** - سكريبت تفاعلي

---

## ✅ بعد الإضافة:

```bash
# تحقق من الأسرار
gh secret list

# اختبر CI/CD
git add .
git commit -m "test: verify secrets"
git push
```

راقب **Actions** tab - يجب أن تمر جميع الـ Jobs ✅

---

**تحتاج مساعدة؟** راجع [SECRETS_SETUP_GUIDE.md](SECRETS_SETUP_GUIDE.md)

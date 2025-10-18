#!/usr/bin/env bash
set -Eeuo pipefail

echo "==> Spaktok auto-fix started"

# 0) تأكد أننا داخل مستودع Git
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
  echo "Error: هذا ليس مستودع Git. ادخل مجلد Spaktok الذي فيه .git ثم شغّل السكربت."
  exit 1
}

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# 1) تأكيد وجود مشروع Flutter تحت frontend/ أو نقله
if [[ ! -f "frontend/pubspec.yaml" ]]; then
  echo "-> pubspec.yaml غير موجود داخل frontend/، أبحث عنه لنقله..."
  FOUND_PUBSPEC="$(git ls-files -z | tr '\0' '\n' | grep -m1 '^.*pubspec\.yaml$' || true)"
  if [[ -n "$FOUND_PUBSPEC" ]]; then
    SRC_DIR="$(dirname "$FOUND_PUBSPEC")"
    if [[ "$SRC_DIR" != "frontend" ]]; then
      echo "-> أنقل محتويات $SRC_DIR إلى frontend/ ..."
      mkdir -p frontend
      rsync -a --delete --exclude='.git' "$SRC_DIR"/ frontend/
      if [[ -d "$SRC_DIR" && "$SRC_DIR" != "." ]]; then
        git rm -r --cached "$SRC_DIR" >/dev/null 2>&1 || true
        rm -rf "$SRC_DIR"
      fi
    fi
  else
    echo "-> لم أعثر على pubspec.yaml؛ سأنشئ مشروع Flutter Web افتراضي داخل frontend/ ..."
    mkdir -p frontend
    ( cd frontend && flutter create . --platforms=web )
  fi
fi

# 2) firebase.json داخل frontend/ وبإعداد صحيح للـ SPA
mkdir -p frontend
if [[ -f "firebase.json" && ! -f "frontend/firebase.json" ]]; then
  echo "-> أنقل firebase.json من الجذر إلى frontend/ ..."
  mv firebase.json frontend/firebase.json
fi

cat > frontend/firebase.json <<'JSON'
{
  "hosting": {
    "public": "build/web",
    "ignore": [
      "firebase.json",
      "/.*",
      "/node_modules/"
    ],
    "rewrites": [
      { "source": "", "destination": "/index.html" }
    ]
  }
}
JSON
echo "-> كتب/حدث frontend/firebase.json"

# 3) تعطيل أي Workflows قديمة من Firebase CLI لتفادي التضارب
mkdir -p .github/workflows
for wf in ".github/workflows/firebase-hosting-merge.yml" ".github/workflows/firebase-hosting-pull-request.yml"; do
  if [[ -f "$wf" ]]; then
    mv "$wf" "$wf.disabled"
    echo "-> عطّلت $wf (أُعيدت تسميته إلى .disabled)"
  fi
done

# 4) إنشاء/تحديث deploy.yml ليبني من frontend/ ويلغي البروكسي على الـ runner
cat > .github/workflows/deploy.yml <<'YAML'
name: Deploy Flutter Web to Firebase Hosting

on:
  push:
    branches:
      - main

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      # إلغاء أي Proxy على بيئة الـ runner (تحسباً)
      - name: Clear proxies on runner
        shell: bash
        run: |
          git config --global --unset http.proxy || true
          git config --global --unset https.proxy || true
          unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY no_proxy NO_PROXY || true
          echo "Proxies cleared on runner."

      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.24.0'

      - name: Install dependencies
        working-directory: ./frontend
        run: flutter pub get

      - name: Build Flutter Web
        working-directory: ./frontend
        run: flutter build web --release

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT_SPAKTOK_E7866 }}'
          channelId: live
          projectId: spaktok-e7866
YAML
echo "-> كتب/حدث .github/workflows/deploy.yml"

# 5) إلغاء أي Proxy محلي (WSL) في إعدادات git
echo "-> إلغاء إعدادات البروكسي محلياً (git config --global)"
git config --global --unset http.proxy || true
git config --global --unset https.proxy || true

# 6) تأكيد وجود index.html داخل frontend/public (مهم لتصفح محلي/مبدئي)
if [[ ! -f "frontend/public/index.html" ]]; then
  mkdir -p frontend/public
  cat > frontend/public/index.html <<'HTML'
<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Spaktok</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body>
    <p>Spaktok is deploying... (Flutter web build will replace this)</p>
  </body>
</html>
HTML
  echo "-> أنشأت frontend/public/index.html مؤقتاً"
fi

# 7) إضافة سكربت نشر محلي (اختياري) لراحتك
cat > frontend/deploy_spaktok.sh <<'BASH'
#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
flutter pub get
flutter build web --release
firebase deploy --only hosting
BASH
chmod +x frontend/deploy_spaktok.sh

# 8) Git add/commit/push
echo "-> git add/commit/push على main"
git add -A
if ! git diff --cached --quiet; then
  git commit -m "Auto-fix: normalize frontend layout, workflow, firebase.json, and clear proxies"
else
  echo "-> لا تغييرات للالتزام."
fi
git pull --rebase origin main || true
git push origin main

echo "==> Done. ادخل صفحة Actions على GitHub وتابع التشغيل."

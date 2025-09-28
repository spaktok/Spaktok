#!/usr/bin/env bash
set -Eeuo pipefail
cd "$(dirname "$0")"
flutter pub get
flutter build web --release
firebase deploy --only hosting

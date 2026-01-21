# Spaktok – Native Android (Kotlin/Compose)

Dieser Modul enthält die native Android-App (`com.spaktok.android`) mit folgenden Kernfunktionen:

- Kamera (CameraX): Vorschau, Videoaufnahme (Recorder/VideoCapture) und Upload
- Live (Agora + WebSocket): Token-Erneuerung, Reconnect mit Jitter, Mute/Status-Overlays
- Reels (Media3 + Paging3): Feed-Wiedergabe mit ExoPlayer
- Discover (Paging): Explore & Search

## Anforderungen

- Android Studio (aktuell)
- Gradle Wrapper im Projekt
- JDK 17 (empfohlen)

## Build

Im Projektordner `apps/native_android/android` ausführen:

```
# Debug-Build
gradlew.bat assembleDebug

# macOS/Linux
./gradlew assembleDebug
```

Das Artefakt liegt anschließend unter `app/build/outputs/apk/debug/`.

## Kamera – Aufnahme & Upload

- Vorschau: `features/camera/ui/CameraScreen.kt` (Preview via `PreviewView`)
- Logik: `features/camera/CameraViewModel.kt` (Bind, Start/Stop Recording, Upload)
- Upload: `data/repo/MediaRepository.kt`
	- Chunk-Upload: `ApiEndpoints.VIDEO_CHUNK`
	- Finalisierung: `ApiEndpoints.VIDEO_FINALIZE`

Stelle sicher, dass `ApiConfig` korrekt auf die Cloudflare-Workers-Umgebung zeigt.

### Berechtigungen

- Kamera: `android.permission.CAMERA`
- Audio (für Video mit Ton): `android.permission.RECORD_AUDIO`
- (optional) Schreiben/Lesen, falls lokale Dateiablage genutzt wird

Die Runtime-Permissions werden auf dem `LiveScreen` bereits gehandhabt; für Kamera ggf. ergänzen.

## Troubleshooting

- Kein Bild in der Vorschau: Prüfe die Bindung von `Preview` und den LifecycleOwner (`LocalLifecycleOwner.current`).
- Upload schlägt fehl: Kontrolliere die Endpunkte (`VIDEO_CHUNK`/`VIDEO_FINALIZE`) und Netzwerk-Logs.
- Build-Probleme mit CameraX: Verwende den `Preview.Builder()` und `QualitySelector.from(Quality.FHD)`.

## Tests

Zurzeit existieren keine Instrumentation- oder UI-Tests für die Kamera. Manuelles Testen auf einem physischen Gerät wird empfohlen.

## Sicherheit

Snyk-Scans sind in CI/CD empfohlen. Lokal kann ein Container-Scan der Backend-Images erfolgen, sofern Docker installiert ist.

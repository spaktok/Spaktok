# 🚀 Missing Features Implementation Plan

**Date:** 2025-11-15  
**Status:** Ready for Implementation

---

## 1️⃣ World AR Tracking (ARCore/ARKit)

### Current Status
- ❌ Not implemented
- ✅ Design complete in `MEDIA_PROCESSING_ARCHITECTURE.md`
- ⚠️ Face tracking implemented via ML Kit
- ⚠️ 2D filters working

### Implementation Plan

#### Step 1: Add Dependencies
```yaml
# pubspec.yaml
dependencies:
  arcore_flutter_plugin: ^0.1.0  # Android
  ar_flutter_plugin: ^0.7.3      # iOS + Android unified
```

#### Step 2: Create AR Service
**File:** `lib/services/world_ar_service.dart`

```dart
import 'package:ar_flutter_plugin/ar_flutter_plugin.dart';
import 'package:ar_flutter_plugin/models/ar_node.dart';

class WorldARService {
  ARSessionManager? arSessionManager;
  ARObjectManager? arObjectManager;
  
  // Surface detection
  Future<void> detectSurfaces() async { }
  
  // Place 3D object
  Future<void> placeObject(String modelPath, Vector3 position) async { }
  
  // Marker-based AR
  Future<void> trackMarker(String imageTarget) async { }
}
```

#### Step 3: Update AR Lens Service
**File:** `lib/services/advanced_ar_lenses_service.dart`

Add world tracking support:
```dart
enum ARLensType {
  faceTracking,
  worldTracking,  // ✅ Already defined
  imageTracking,  // ✅ Already defined
  bodyTracking,
  handTracking,
}

// Add methods:
Future<void> applyWorldARLens(String lensId) async {
  // Initialize ARCore/ARKit
  // Load 3D models
  // Enable surface detection
}
```

#### Step 4: Create World AR Screen
**File:** `lib/screens/world_ar_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:ar_flutter_plugin/ar_flutter_plugin.dart';

class WorldARScreen extends StatefulWidget {
  @override
  State<WorldARScreen> createState() => _WorldARScreenState();
}

class _WorldARScreenState extends State<WorldARScreen> {
  ARSessionManager? arSessionManager;
  
  @override
  Widget build(BuildContext context) {
    return ARView(
      onARViewCreated: onARViewCreated,
      planeDetectionConfig: PlaneDetectionConfig.horizontalAndVertical,
    );
  }
  
  void onARViewCreated(ARSessionManager manager, ARObjectManager objects) {
    arSessionManager = manager;
    // Initialize AR
  }
}
```

#### Resources
- ARCore: https://developers.google.com/ar
- ARKit: https://developer.apple.com/augmented-reality/
- Plugin docs: https://pub.dev/packages/ar_flutter_plugin

**Estimated Time:** 2-3 days  
**Priority:** 🟡 Medium

---

## 2️⃣ Auto-Captions (Speech-to-Text)

### Current Status
- ❌ Not implemented
- ✅ Design mentioned in `SHORT_VIDEOS_SYSTEM_DESIGN.md`
- ✅ Multi-language support ready

### Implementation Plan

#### Step 1: Add Dependencies
```yaml
# pubspec.yaml
dependencies:
  speech_to_text: ^7.0.0          # On-device STT
  # OR
  google_speech: ^2.3.0            # Cloud STT (better accuracy)
```

#### Step 2: Create Captions Service
**File:** `lib/services/auto_captions_service.dart`

```dart
import 'package:speech_to_text/speech_to_text.dart';

class AutoCaptionsService {
  final SpeechToText _speech = SpeechToText();
  
  Future<List<Caption>> generateCaptions(String videoPath) async {
    await _speech.initialize();
    
    // Extract audio from video
    final audioPath = await _extractAudio(videoPath);
    
    // Transcribe
    final captions = <Caption>[];
    await _speech.listen(
      onResult: (result) {
        captions.add(Caption(
          text: result.recognizedWords,
          startTime: /* timestamp */,
          endTime: /* timestamp */,
        ));
      },
    );
    
    return captions;
  }
  
  Future<String> _extractAudio(String videoPath) async {
    // Use ffmpeg_kit_flutter_min_gpl (already installed!)
    // Extract audio: ffmpeg -i video.mp4 -vn -acodec copy audio.aac
  }
}
```

#### Step 3: Update Video Service
**File:** `lib/services/short_video_service.dart`

Add caption generation:
```dart
Future<String> uploadVideo({
  // ... existing params
  bool generateCaptions = false,
}) async {
  // ... existing upload logic
  
  if (generateCaptions) {
    final captionsService = AutoCaptionsService();
    final captions = await captionsService.generateCaptions(videoFile.path);
    
    videoData['captions'] = captions.map((c) => c.toJson()).toList();
  }
  
  // ... rest of upload
}
```

#### Step 4: Cloud Function (Better Accuracy)
**File:** `functions/src/captions.js`

```javascript
const functions = require('firebase-functions');
const speech = require('@google-cloud/speech');

exports.generateCaptions = functions.https.onCall(async (data, context) => {
  const client = new speech.SpeechClient();
  const videoUrl = data.videoUrl;
  
  // Extract audio
  const audioBuffer = await extractAudio(videoUrl);
  
  // Transcribe
  const [response] = await client.recognize({
    audio: { content: audioBuffer.toString('base64') },
    config: {
      encoding: 'LINEAR16',
      sampleRateHertz: 16000,
      languageCode: data.language || 'en-US',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: true,
    },
  });
  
  const captions = response.results.map(result => ({
    text: result.alternatives[0].transcript,
    startTime: result.alternatives[0].words[0].startTime.seconds,
    endTime: result.alternatives[0].words.slice(-1)[0].endTime.seconds,
  }));
  
  return { captions };
});
```

**Install dependency:**
```bash
cd functions
npm install @google-cloud/speech
```

#### Resources
- Google Cloud Speech-to-Text: https://cloud.google.com/speech-to-text
- Flutter speech_to_text: https://pub.dev/packages/speech_to_text
- FFmpeg audio extraction: https://ffmpeg.org/

**Estimated Time:** 1-2 days  
**Priority:** 🔴 High

---

## 3️⃣ Duet & Stitch (Video Collaboration)

### Current Status
- ⚠️ Design complete in `SHORT_VIDEOS_SYSTEM_DESIGN.md`
- ❌ No implementation
- ✅ FFmpeg installed (`ffmpeg_kit_flutter_min_gpl`)

### Implementation Plan

#### Step 1: Create Duet Service
**File:** `lib/services/duet_service.dart`

```dart
import 'package:ffmpeg_kit_flutter_min_gpl/ffmpeg_kit.dart';

class DuetService {
  /// Create duet: side-by-side video
  Future<String> createDuet({
    required String originalVideoPath,
    required String duetVideoPath,
    required String outputPath,
  }) async {
    // FFmpeg command: side-by-side layout
    final command = 
      '-i $originalVideoPath '
      '-i $duetVideoPath '
      '-filter_complex "[0:v]scale=640:1280[left];[1:v]scale=640:1280[right];[left][right]hstack=inputs=2" '
      '-c:v libx264 -preset ultrafast '
      '$outputPath';
    
    await FFmpegKit.execute(command);
    return outputPath;
  }
  
  /// Create stitch: append clip to video
  Future<String> createStitch({
    required String originalVideoPath,
    required String stitchVideoPath,
    required double clipStartTime,
    required double clipDuration,
    required String outputPath,
  }) async {
    // Step 1: Extract clip from original
    final clipPath = '${outputPath}_clip.mp4';
    await FFmpegKit.execute(
      '-i $originalVideoPath '
      '-ss $clipStartTime '
      '-t $clipDuration '
      '-c copy '
      '$clipPath'
    );
    
    // Step 2: Concatenate
    await FFmpegKit.execute(
      '-i $clipPath '
      '-i $stitchVideoPath '
      '-filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[outv][outa]" '
      '-map "[outv]" -map "[outa]" '
      '$outputPath'
    );
    
    return outputPath;
  }
}
```

#### Step 2: Update Short Video Service
**File:** `lib/services/short_video_service.dart`

Add duet/stitch methods:
```dart
Future<String> uploadDuet({
  required String userId,
  required File duetVideoFile,
  required String originalVideoId,
  // ... other params
}) async {
  // Get original video
  final originalDoc = await _firestore.collection('videos').doc(originalVideoId).get();
  final originalVideoUrl = originalDoc.data()!['videoUrl'];
  
  // Download original
  final originalPath = await _downloadVideo(originalVideoUrl);
  
  // Create duet
  final duetService = DuetService();
  final outputPath = await duetService.createDuet(
    originalVideoPath: originalPath,
    duetVideoPath: duetVideoFile.path,
    outputPath: '/tmp/duet_${DateTime.now().millisecondsSinceEpoch}.mp4',
  );
  
  // Upload duet video
  return await uploadVideo(
    userId: userId,
    videoFile: File(outputPath),
    // ... other params
    isDuet: true,
    originalVideoId: originalVideoId,
  );
}
```

#### Step 3: Update Video Model
**File:** `SHORT_VIDEOS_SYSTEM_DESIGN.md` → Implement in Firestore

Add fields:
```javascript
{
  "isDuet": boolean,
  "isStitch": boolean,
  "originalVideoId": string,
  "originalUserId": string,
  "allowDuet": boolean,  // ✅ Already in design
  "allowStitch": boolean, // ✅ Already in design
}
```

#### Step 4: Create Duet/Stitch UI
**File:** `lib/screens/duet_stitch_screen.dart`

```dart
class DuetStitchScreen extends StatefulWidget {
  final String videoId;
  final String type; // 'duet' or 'stitch'
  
  @override
  State<DuetStitchScreen> createState() => _DuetStitchScreenState();
}

class _DuetStitchScreenState extends State<DuetStitchScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Original video preview
          VideoPlayer(/* ... */),
          
          // Camera overlay for duet
          if (widget.type == 'duet')
            CameraPreview(/* ... */),
          
          // Record button
          RecordButton(onRecordComplete: _handleRecordComplete),
        ],
      ),
    );
  }
  
  void _handleRecordComplete(File videoFile) async {
    final duetService = DuetService();
    // Create duet/stitch
    // Upload
  }
}
```

#### Resources
- FFmpeg filters: https://ffmpeg.org/ffmpeg-filters.html
- hstack (side-by-side): https://ffmpeg.org/ffmpeg-filters.html#hstack
- concat (stitching): https://ffmpeg.org/ffmpeg-filters.html#concat

**Estimated Time:** 2-3 days  
**Priority:** 🔴 High

---

## 4️⃣ Advanced AI Moderation

### Current Status
- ✅ Design complete in `REPORTING_PENALTY_SYSTEM_DESIGN.md`
- ⚠️ Basic manual moderation implemented
- ❌ No AI/automated moderation

### Implementation Plan

#### Step 1: Enable Cloud Vision API
```bash
gcloud services enable vision.googleapis.com
```

#### Step 2: Create Moderation Function
**File:** `functions/src/moderation.js`

```javascript
const functions = require('firebase-functions');
const vision = require('@google-cloud/vision');
const admin = require('firebase-admin');

const client = new vision.ImageAnnotatorClient();

exports.moderateVideo = functions.firestore
  .document('videos/{videoId}')
  .onCreate(async (snap, context) => {
    const videoData = snap.data();
    const thumbnailUrl = videoData.thumbnailUrl;
    
    // 1. Analyze thumbnail
    const [result] = await client.safeSearchDetection(thumbnailUrl);
    const safeSearch = result.safeSearchAnnotation;
    
    let violationScore = 0;
    if (safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY') violationScore += 3;
    if (safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY') violationScore += 2;
    if (safeSearch.racy === 'VERY_LIKELY') violationScore += 1;
    
    // 2. Scan caption/description
    const captionFlags = await scanText(videoData.description);
    if (captionFlags.length > 0) violationScore += 2;
    
    // 3. Determine action
    let moderationStatus = 'approved';
    let action = 'none';
    
    if (violationScore >= 3) {
      moderationStatus = 'removed';
      action = 'auto_removed';
    } else if (violationScore >= 1) {
      moderationStatus = 'flagged';
      action = 'manual_review';
    }
    
    // 4. Update video
    await snap.ref.update({
      moderationStatus,
      moderationAction: action,
      moderationScore: violationScore,
      moderationTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // 5. Notify user if removed
    if (action === 'auto_removed') {
      await notifyUserContentRemoved(videoData.userId, context.params.videoId);
    }
    
    return { status: moderationStatus, score: violationScore };
  });

async function scanText(text) {
  const blockedWords = ['spam', 'scam', /* ... */];
  const flags = [];
  
  const lowerText = text.toLowerCase();
  for (const word of blockedWords) {
    if (lowerText.includes(word)) {
      flags.push(word);
    }
  }
  
  return flags;
}
```

**Install dependency:**
```bash
cd functions
npm install @google-cloud/vision
```

#### Step 3: Add Moderation Fields to Firestore
Update video documents:
```javascript
{
  "moderationStatus": "pending" | "approved" | "flagged" | "removed",
  "moderationAction": "none" | "auto_approved" | "manual_review" | "auto_removed",
  "moderationScore": number,
  "moderationFlags": array<string>,
  "moderationTimestamp": timestamp,
}
```

#### Step 4: Create Admin Review UI
**File:** `lib/screens/admin_moderation_screen.dart`

```dart
class AdminModerationScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
        .collection('videos')
        .where('moderationStatus', isEqualTo: 'flagged')
        .snapshots(),
      builder: (context, snapshot) {
        // Display flagged videos
        // Approve/Remove buttons
      },
    );
  }
}
```

#### Resources
- Cloud Vision API: https://cloud.google.com/vision
- SafeSearch detection: https://cloud.google.com/vision/docs/detecting-safe-search
- Natural Language API: https://cloud.google.com/natural-language

**Estimated Time:** 2-3 days  
**Priority:** 🔴 High

---

## 5️⃣ Screenshot Detection

### Current Status
- ✅ Package installed: `flutter_screenshot_detect: ^0.1.7`
- ❌ Not implemented
- ✅ Design mentioned in `ENHANCED_CHAT_SYSTEM_DESIGN.md`

### Implementation Plan

#### Step 1: Create Screenshot Service
**File:** `lib/services/screenshot_detection_service.dart`

```dart
import 'package:flutter_screenshot_detect/flutter_screenshot_detect.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class ScreenshotDetectionService {
  final ScreenshotDetect _detector = ScreenshotDetect();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  void initialize(String contentType, String contentId, String ownerId) {
    _detector.initialize();
    
    _detector.screenshotStream.listen((screenshotTaken) {
      if (screenshotTaken) {
        _handleScreenshot(contentType, contentId, ownerId);
      }
    });
  }
  
  Future<void> _handleScreenshot(
    String contentType,
    String contentId,
    String ownerId,
  ) async {
    // Record screenshot event
    await _firestore.collection('screenshots').add({
      'contentType': contentType, // 'story', 'message', etc.
      'contentId': contentId,
      'ownerId': ownerId,
      'screenshotBy': FirebaseAuth.instance.currentUser?.uid,
      'timestamp': FieldValue.serverTimestamp(),
    });
    
    // Notify owner
    await _firestore.collection('notifications').add({
      'userId': ownerId,
      'type': 'screenshot',
      'contentType': contentType,
      'contentId': contentId,
      'message': 'Someone took a screenshot of your $contentType',
      'timestamp': FieldValue.serverTimestamp(),
    });
  }
  
  void dispose() {
    _detector.dispose();
  }
}
```

#### Step 2: Integrate into Story Viewer
**File:** `lib/screens/story_screen.dart`

Add screenshot detection:
```dart
class _StoryViewerState extends State<StoryViewer> {
  late ScreenshotDetectionService _screenshotService;
  
  @override
  void initState() {
    super.initState();
    
    // Initialize screenshot detection
    if (widget.stories.isNotEmpty) {
      _screenshotService = ScreenshotDetectionService();
      _screenshotService.initialize(
        'story',
        widget.stories[0].id,
        widget.stories[0].userId,
      );
    }
  }
  
  @override
  void dispose() {
    _screenshotService.dispose();
    super.dispose();
  }
}
```

#### Step 3: Integrate into Chat
**File:** `lib/screens/chat_screen.dart`

Add for ephemeral messages:
```dart
// When viewing ephemeral message
if (message.isEphemeral) {
  _screenshotService.initialize('message', message.id, message.senderId);
}
```

#### Step 4: Display Screenshot Notifications
**File:** `lib/screens/story_screen.dart` or dedicated analytics

Show who took screenshots:
```dart
Stream<List<Map<String, dynamic>>> getScreenshots(String storyId) {
  return _firestore
    .collection('screenshots')
    .where('contentId', isEqualTo: storyId)
    .orderBy('timestamp', descending: true)
    .snapshots()
    .map((snap) => snap.docs.map((doc) => doc.data()).toList());
}
```

#### Resources
- Package: https://pub.dev/packages/flutter_screenshot_detect
- iOS implementation: UIApplicationUserDidTakeScreenshotNotification
- Android: FileObserver for screenshot directory

**Estimated Time:** 1 day  
**Priority:** 🔴 High

---

## 📋 Implementation Summary

| Feature | Priority | Time | Dependencies | Status |
|---------|----------|------|--------------|--------|
| **World AR Tracking** | 🟡 Medium | 2-3 days | `ar_flutter_plugin` | Ready |
| **Auto-Captions** | 🔴 High | 1-2 days | `speech_to_text`, Cloud STT | Ready |
| **Duet/Stitch** | 🔴 High | 2-3 days | ✅ FFmpeg installed | Ready |
| **AI Moderation** | 🔴 High | 2-3 days | Cloud Vision API | Ready |
| **Screenshot Detection** | 🔴 High | 1 day | ✅ Package installed | Ready |

**Total Estimated Time:** 8-13 days for all features

---

## 🎯 Recommended Implementation Order

1. **Screenshot Detection** (1 day)
   - Easiest, package already installed
   - High user value (privacy)
   
2. **Auto-Captions** (1-2 days)
   - High engagement impact
   - Accessibility requirement
   
3. **Duet/Stitch** (2-3 days)
   - Core viral feature
   - FFmpeg already installed
   
4. **AI Moderation** (2-3 days)
   - Content safety critical
   - Reduces manual moderation load
   
5. **World AR Tracking** (2-3 days)
   - Enhancement feature
   - Can be phased rollout

---

## 📦 Required Dependencies (Not Yet Installed)

```yaml
# pubspec.yaml
dependencies:
  # World AR
  ar_flutter_plugin: ^0.7.3
  
  # Auto-Captions
  speech_to_text: ^7.0.0
  
  # Screenshot Detection - ✅ ALREADY INSTALLED
  # flutter_screenshot_detect: ^0.1.7
```

```bash
# Cloud Functions
cd functions
npm install @google-cloud/vision @google-cloud/speech
```

---

## 🔧 Configuration Needed

### Enable Google Cloud APIs
```bash
# Vision API (for moderation)
gcloud services enable vision.googleapis.com

# Speech-to-Text API (for captions)
gcloud services enable speech.googleapis.com

# Natural Language API (optional, for text moderation)
gcloud services enable language.googleapis.com
```

### Update Service Account Permissions
Ensure Firebase service account has:
- `Cloud Vision API User`
- `Cloud Speech-to-Text User`
- `Cloud Natural Language User`

---

## ✅ Next Actions

1. **Review this plan** with team
2. **Prioritize features** based on business needs
3. **Install dependencies** listed above
4. **Enable Cloud APIs** and configure permissions
5. **Start implementation** in recommended order
6. **Test each feature** thoroughly before moving to next
7. **Update `FEATURES_STATUS.md`** as features are completed

---

**Document:** `MISSING_FEATURES_PLAN.md`  
**Author:** Spaktok Development Team  
**Date:** 2025-11-15

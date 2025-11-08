# 🎥 Advanced Media Processing Pipeline - Spaktok

**Date:** November 8, 2025  
**Status:** Architecture & Design Complete

---

## 📋 Overview

Comprehensive media processing system for stories with AI-powered filters, effects, and real-time processing capabilities to support 1B users.

---

## 🏗️ Architecture

### High-Level Flow

```
User Upload → Cloud Storage → Processing Pipeline → CDN → Client
     ↓
Metadata → Firestore → Real-time sync → Feed
```

### Components

#### 1. **Upload Service** (Client-side)
- **Flutter Camera Integration**
  - Capture photos/videos with `camera` package
  - Apply real-time filters using `google_mlkit_face_detection`
  - AR masks and effects using device GPU

#### 2. **Cloud Storage** (Firebase Storage)
- Raw media uploaded to Firebase Storage
- Organized by user ID and timestamp
- Automatic cleanup of expired stories (24h)

#### 3. **Processing Pipeline** (Cloud Functions + FFmpeg)
- Triggered on storage upload
- Video transcoding with `ffmpeg_kit_flutter`
- Multiple quality variants (360p, 720p, 1080p)
- Thumbnail generation
- Face detection and blur for privacy

#### 4. **Filter Engine**
- **Client-side filters** (real-time, low latency)
  - Basic color adjustments
  - Face filters using ML Kit
  - AR effects using device GPU
  
- **Server-side filters** (high-quality, post-processing)
  - Advanced AI filters
  - Style transfer
  - Background replacement
  - Object detection and tracking

#### 5. **CDN Distribution** (Firebase Hosting + Cloud CDN)
- Processed media served via CDN
- Edge caching for global low latency
- Adaptive bitrate streaming for videos

---

## 🎨 Filter Categories

### 1. Face Filters (ML Kit + Custom)
- **Beauty filters**: Smooth skin, brighten eyes, whiten teeth
- **AR masks**: Animal faces, accessories, makeup
- **Face morphing**: Age progression, gender swap, face swap
- **Emotion filters**: Happy, sad, surprise effects

### 2. Color & Light Filters
- **Vintage**: Sepia, black & white, retro film
- **Cinematic**: Color grading presets
- **HDR**: Dynamic range enhancement
- **Light leaks**: Artistic light effects

### 3. AI-Powered Filters
- **Style transfer**: Apply artistic styles (Van Gogh, Picasso, etc.)
- **Background replacement**: Green screen effect, custom backgrounds
- **Object detection**: Automatic tagging and effects
- **Motion tracking**: Effects that follow moving objects

### 4. AR Effects
- **3D objects**: Add 3D models to scenes
- **Environment effects**: Weather, particles, animations
- **Hand tracking**: Gesture-based effects
- **Body segmentation**: Full-body effects

---

## 💻 Implementation

### Client-Side Processing (Flutter)

#### Real-time Face Detection

```dart
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:camera/camera.dart';

class FaceFilterService {
  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      enableContours: true,
      enableLandmarks: true,
      enableClassification: true,
      enableTracking: true,
    ),
  );

  Future<List<Face>> detectFaces(CameraImage image) async {
    final inputImage = InputImage.fromBytes(
      bytes: image.planes[0].bytes,
      metadata: InputImageMetadata(
        size: Size(image.width.toDouble(), image.height.toDouble()),
        rotation: InputImageRotation.rotation0deg,
        format: InputImageFormat.nv21,
        bytesPerRow: image.planes[0].bytesPerRow,
      ),
    );

    return await _faceDetector.processImage(inputImage);
  }

  void applyBeautyFilter(Face face, Canvas canvas) {
    // Smooth skin algorithm
    // Brighten eyes based on landmarks
    // Apply makeup effects
  }
}
```

#### Video Processing with FFmpeg

```dart
import 'package:ffmpeg_kit_flutter/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter/return_code.dart';

class VideoProcessingService {
  /// Apply filter to video
  Future<String> applyFilter(String inputPath, String filterName) async {
    final outputPath = '${inputPath}_filtered.mp4';
    
    // FFmpeg filter command
    final command = '-i $inputPath -vf "$filterName" -c:v libx264 -preset fast $outputPath';
    
    final session = await FFmpegKit.execute(command);
    final returnCode = await session.getReturnCode();
    
    if (ReturnCode.isSuccess(returnCode)) {
      return outputPath;
    } else {
      throw Exception('Filter application failed');
    }
  }

  /// Generate multiple quality versions
  Future<Map<String, String>> generateVariants(String inputPath) async {
    final variants = <String, String>{};
    
    // 360p
    variants['360p'] = await _transcode(inputPath, '640:360', '500k');
    
    // 720p
    variants['720p'] = await _transcode(inputPath, '1280:720', '2000k');
    
    // 1080p
    variants['1080p'] = await _transcode(inputPath, '1920:1080', '5000k');
    
    return variants;
  }

  Future<String> _transcode(String input, String resolution, String bitrate) async {
    final output = '${input}_$resolution.mp4';
    final command = '-i $input -vf scale=$resolution -b:v $bitrate -c:v libx264 -preset fast $output';
    await FFmpegKit.execute(command);
    return output;
  }
}
```

### Server-Side Processing (Cloud Functions)

#### Story Processing Function

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const ffmpeg = require('fluent-ffmpeg');
const vision = require('@google-cloud/vision');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Trigger on story upload
exports.processStoryMedia = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const contentType = object.contentType;
  
  // Only process story uploads
  if (!filePath.startsWith('stories/')) return null;
  
  const bucket = admin.storage().bucket();
  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  
  // Download file
  await bucket.file(filePath).download({ destination: tempFilePath });
  
  const tasks = [];
  
  if (contentType.startsWith('video/')) {
    // Video processing
    tasks.push(generateThumbnail(tempFilePath, filePath));
    tasks.push(transcodeVideo(tempFilePath, filePath));
    tasks.push(extractMetadata(tempFilePath, filePath));
  } else if (contentType.startsWith('image/')) {
    // Image processing
    tasks.push(detectFaces(tempFilePath, filePath));
    tasks.push(generateThumbnail(tempFilePath, filePath));
  }
  
  await Promise.all(tasks);
  
  // Cleanup
  fs.unlinkSync(tempFilePath);
  
  return null;
});

async function generateThumbnail(inputPath, storagePath) {
  const thumbnailPath = inputPath + '_thumb.jpg';
  
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        count: 1,
        filename: path.basename(thumbnailPath),
        folder: path.dirname(thumbnailPath),
        size: '320x?'
      })
      .on('end', async () => {
        // Upload thumbnail
        const bucket = admin.storage().bucket();
        await bucket.upload(thumbnailPath, {
          destination: storagePath.replace(/\.[^/.]+$/, '_thumb.jpg')
        });
        resolve();
      })
      .on('error', reject);
  });
}

async function detectFaces(imagePath, storagePath) {
  const client = new vision.ImageAnnotatorClient();
  const [result] = await client.faceDetection(imagePath);
  const faces = result.faceAnnotations;
  
  // Store face detection results in Firestore
  const storyId = path.basename(storagePath, path.extname(storagePath));
  await admin.firestore().collection('stories').doc(storyId).set({
    faceCount: faces.length,
    faces: faces.map(f => ({
      joy: f.joyLikelihood,
      sorrow: f.sorrowLikelihood,
      anger: f.angerLikelihood,
      surprise: f.surpriseLikelihood,
    }))
  }, { merge: true });
}
```

---

## 🚀 Advanced Features

### 1. AI Style Transfer

Use TensorFlow Lite models for real-time style transfer:

```dart
import 'package:tflite_flutter/tflite_flutter.dart';

class StyleTransferService {
  Interpreter? _interpreter;
  
  Future<void> loadModel(String styleName) async {
    _interpreter = await Interpreter.fromAsset('models/style_$styleName.tflite');
  }
  
  Future<Uint8List> applyStyle(Uint8List imageBytes) async {
    // Preprocess image
    final input = _preprocessImage(imageBytes);
    
    // Run inference
    final output = List.filled(256 * 256 * 3, 0).reshape([1, 256, 256, 3]);
    _interpreter!.run(input, output);
    
    // Postprocess output
    return _postprocessOutput(output);
  }
}
```

### 2. Background Replacement

```dart
import 'package:google_mlkit_segmentation/google_mlkit_segmentation.dart';

class BackgroundReplacementService {
  final Segmenter _segmenter = Segmenter(mode: SegmentationMode.stream);
  
  Future<Uint8List> replaceBackground(
    Uint8List originalImage,
    Uint8List newBackground,
  ) async {
    // Segment person from background
    final mask = await _segmenter.processImage(InputImage.fromBytes(
      bytes: originalImage,
      metadata: /* metadata */,
    ));
    
    // Composite person onto new background
    return _compositeImages(originalImage, newBackground, mask);
  }
}
```

### 3. Motion Tracking

```dart
class MotionTrackingService {
  List<Offset> _trackedPoints = [];
  
  void trackMotion(List<Face> faces) {
    if (faces.isNotEmpty) {
      final face = faces.first;
      final center = Offset(
        face.boundingBox.center.dx,
        face.boundingBox.center.dy,
      );
      _trackedPoints.add(center);
      
      // Keep last 30 frames
      if (_trackedPoints.length > 30) {
        _trackedPoints.removeAt(0);
      }
    }
  }
  
  void drawMotionTrail(Canvas canvas, Paint paint) {
    for (int i = 0; i < _trackedPoints.length - 1; i++) {
      canvas.drawLine(_trackedPoints[i], _trackedPoints[i + 1], paint);
    }
  }
}
```

---

## 📊 Performance Optimization

### Client-Side
- **GPU acceleration**: Use Metal (iOS) and Vulkan (Android) for filters
- **Frame rate limiting**: Process every N frames to save battery
- **Lazy loading**: Load filter assets on demand
- **Caching**: Cache processed frames for replay

### Server-Side
- **Parallel processing**: Use Cloud Functions max instances
- **Queue system**: Use Cloud Tasks for batch processing
- **CDN caching**: Cache processed media at edge locations
- **Lazy transcoding**: Generate quality variants on first request

---

## 🔒 Privacy & Safety

### Content Moderation
- **Face blur**: Automatic blur for minors
- **Explicit content detection**: Block inappropriate media
- **Text extraction**: OCR for text moderation
- **Logo detection**: Prevent brand infringement

### User Controls
- **Filter disable**: Allow users to turn off filters
- **Save original**: Keep unfiltered version
- **Privacy zones**: Blur backgrounds automatically
- **Location masking**: Remove GPS metadata

---

## 💰 Cost Estimation

### Processing Costs (per 1000 users/day)
- **Cloud Functions**: $5-10 (video transcoding)
- **Cloud Storage**: $2-5 (raw + processed media)
- **CDN bandwidth**: $10-20 (media delivery)
- **Vision API**: $1-3 (face detection, content moderation)
- **Total**: ~$20-40 per 1000 active users/day

### Optimization Strategies
- Client-side processing for basic filters (free)
- Batch process non-urgent tasks (cheaper)
- Aggressive CDN caching (reduce egress)
- Cleanup old stories after 24h (reduce storage)

---

## 🎯 Roadmap

### Phase 1 (Implemented)
- ✅ Basic camera integration
- ✅ Face detection with ML Kit
- ✅ Simple color filters
- ✅ Video recording

### Phase 2 (Next)
- [ ] AR face masks and effects
- [ ] Video transcoding pipeline
- [ ] CDN distribution
- [ ] Thumbnail generation

### Phase 3 (Future)
- [ ] AI style transfer
- [ ] Background replacement
- [ ] Motion tracking effects
- [ ] 3D object placement

---

**Status:** Architecture complete, ready for implementation  
**Priority:** High - Core feature for TikTok/Snapchat parity

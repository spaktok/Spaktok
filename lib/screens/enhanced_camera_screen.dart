import 'dart:async';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:io';

// ... (same EnhancedCameraScreen stateful widget as before)

class _EnhancedCameraScreenState extends State<EnhancedCameraScreen> with WidgetsBindingObserver {
    // ... (same state variables and initialization logic)

    @override
    Widget build(BuildContext context) {
        // ... (same build method with permission handling)
        return Scaffold(
            body: Stack(
                fit: StackFit.expand,
                children: [
                    CameraPreview(_cameraController!),
                    CustomPaint(painter: FacePainter(faces: _faces, imageSize: _cameraController!.value.previewSize ?? Size.zero)),
                    // ... (controls)
                ]
            )
        );
    }
}

class FacePainter extends CustomPainter {
  final List<Face> faces;
  final Size imageSize;

  FacePainter({required this.faces, required this.imageSize});

  @override
  void paint(Canvas canvas, Size size) {
    if (imageSize.isEmpty) return;

    final paint = Paint()..style = PaintingStyle.stroke..strokeWidth = 2.0..color = Colors.red;
    final heartPaint = Paint()..color = Colors.red..style = PaintingStyle.fill;

    for (final face in faces) {
      final rect = _scaleRect(face.boundingBox, imageSize, size);
      canvas.drawRect(rect, paint);

      // Gesture Recognition: Check for smile
      if ((face.smilingProbability ?? 0) > 0.75) {
        // Draw hearts when smiling
        final leftCheek = face.landmarks[FaceLandmarkType.leftCheek];
        final rightCheek = face.landmarks[FaceLandmarkType.rightCheek];
        if (leftCheek != null && rightCheek != null) {
          final leftPos = _scalePoint(leftCheek.position, imageSize, size);
          final rightPos = _scalePoint(rightCheek.position, imageSize, size);
          canvas.drawCircle(leftPos.translate(0, -20), 15, heartPaint);
          canvas.drawCircle(rightPos.translate(0, -20), 15, heartPaint);
        }
      }
      
       // Gesture Recognition: Check for wink
      if ((face.leftEyeOpenProbability ?? 1.0) < 0.3 && (face.rightEyeOpenProbability ?? 1.0) > 0.7) {
            final rightEye = face.landmarks[FaceLandmarkType.rightEye];
            if(rightEye != null){
                final eyePos = _scalePoint(rightEye.position, imageSize, size);
                final starPath = _createStarPath(eyePos.dx, eyePos.dy, 15);
                canvas.drawPath(starPath, Paint()..color = Colors.yellow);
            }
      }
    }
  }
  
  Path _createStarPath(double x, double y, double radius) {
      final path = Path();
      const points = 5;
      const angle = 2 * 3.1415926535 / points;
      path.moveTo(x + radius, y);
      for (int i = 1; i < points * 2; i++) {
        final r = i.isEven ? radius : radius / 2;
        final currX = x + r * Math.cos(i * angle / 2);
        final currY = y + r * Math.sin(i * angle / 2);
        path.lineTo(currX, currY);
      }
      path.close();
      return path;
  }

  @override
  bool shouldRepaint(FacePainter oldDelegate) => true; // Repaint always for dynamic filters

  Rect _scaleRect(Rect rect, Size imageSize, Size widgetSize) { 
    // This needs to account for the camera feed's aspect ratio and orientation
    final double scaleX = widgetSize.width / imageSize.height;
    final double scaleY = widgetSize.height / imageSize.width;
    return Rect.fromLTRB(
      widgetSize.width - rect.left * scaleX, // Flip horizontally
      rect.top * scaleY,
      widgetSize.width - rect.right * scaleX, // Flip horizontally
      rect.bottom * scaleY,
    );
  }
  
  Offset _scalePoint(Point<int> point, Size imageSize, Size widgetSize) {
    final double scaleX = widgetSize.width / imageSize.height;
    final double scaleY = widgetSize.height / imageSize.width;
    return Offset(widgetSize.width - point.x.toDouble() * scaleX, point.y.toDouble() * scaleY);
  }
}

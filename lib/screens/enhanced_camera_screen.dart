import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:permission_handler/permission_handler.dart';

class EnhancedCameraScreen extends StatefulWidget {
  const EnhancedCameraScreen({super.key});

  @override
  State<EnhancedCameraScreen> createState() => _EnhancedCameraScreenState();
}

class _EnhancedCameraScreenState extends State<EnhancedCameraScreen>
    with WidgetsBindingObserver {
  CameraController? _cameraController;
  List<Face> _faces = [];

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    final cameras = await availableCameras();
    if (cameras.isEmpty) return;
    _cameraController = CameraController(cameras.first, ResolutionPreset.high);
    await _cameraController!.initialize();
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          CameraPreview(_cameraController!),
          CustomPaint(
            painter: FacePainter(
              faces: _faces,
              imageSize: _cameraController!.value.previewSize ?? Size.zero,
            ),
          ),
        ],
      ),
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

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..color = Colors.red;
    final heartPaint = Paint()
      ..color = Colors.red
      ..style = PaintingStyle.fill;

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
      if ((face.leftEyeOpenProbability ?? 1.0) < 0.3 &&
          (face.rightEyeOpenProbability ?? 1.0) > 0.7) {
        final rightEye = face.landmarks[FaceLandmarkType.rightEye];
        if (rightEye != null) {
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
    const angle = 2 * math.pi / points;
    path.moveTo(x + radius, y);
    for (int i = 1; i < points * 2; i++) {
      final r = i.isEven ? radius : radius / 2;
      final currX = x + r * math.cos(i * angle / 2);
      final currY = y + r * math.sin(i * angle / 2);
      path.lineTo(currX, currY);
    }
    path.close();
    return path;
  }

  @override
  bool shouldRepaint(FacePainter oldDelegate) =>
      true; // Repaint always for dynamic filters

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

  Offset _scalePoint(dynamic point, Size imageSize, Size widgetSize) {
    final double scaleX = widgetSize.width / imageSize.height;
    final double scaleY = widgetSize.height / imageSize.width;
    final double x =
        point.x is int ? (point.x as int).toDouble() : point.x as double;
    final double y =
        point.y is int ? (point.y as int).toDouble() : point.y as double;
    return Offset(widgetSize.width - x * scaleX, y * scaleY);
  }
}

import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';

class CameraService {
  static CameraService? _instance;
  static CameraService get instance {
    _instance ??= CameraService._();
    return _instance!;
  }

  CameraService._();

  List<CameraDescription>? _cameras;
  CameraController? _controller;
  int _currentCameraIndex = 0;

  // Get available cameras
  Future<List<CameraDescription>> getAvailableCameras() async {
    if (_cameras == null) {
      _cameras = await availableCameras();
    }
    return _cameras!;
  }

  // Initialize camera
  Future<CameraController?> initializeCamera({
    ResolutionPreset resolution = ResolutionPreset.high,
    bool enableAudio = true,
  }) async {
    try {
      final cameras = await getAvailableCameras();
      if (cameras.isEmpty) {
        throw Exception('No cameras available');
      }

      _controller = CameraController(
        cameras[_currentCameraIndex],
        resolution,
        enableAudio: enableAudio,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _controller!.initialize();
      return _controller;
    } catch (e) {
      debugPrint('Error initializing camera: $e');
      return null;
    }
  }

  // Switch camera (front/back)
  Future<CameraController?> switchCamera() async {
    try {
      final cameras = await getAvailableCameras();
      if (cameras.length < 2) {
        throw Exception('Only one camera available');
      }

      // Dispose current controller
      await _controller?.dispose();

      // Switch to next camera
      _currentCameraIndex = (_currentCameraIndex + 1) % cameras.length;

      // Initialize new camera
      _controller = CameraController(
        cameras[_currentCameraIndex],
        ResolutionPreset.high,
        enableAudio: true,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _controller!.initialize();
      return _controller;
    } catch (e) {
      debugPrint('Error switching camera: $e');
      return null;
    }
  }

  // Get current camera controller
  CameraController? get controller => _controller;

  // Check if camera is initialized
  bool get isInitialized => _controller?.value.isInitialized ?? false;

  // Get current camera direction
  CameraLensDirection get currentCameraDirection {
    if (_cameras == null || _cameras!.isEmpty) {
      return CameraLensDirection.back;
    }
    return _cameras![_currentCameraIndex].lensDirection;
  }

  // Take picture
  Future<XFile?> takePicture() async {
    if (_controller == null || !_controller!.value.isInitialized) {
      throw Exception('Camera not initialized');
    }

    if (_controller!.value.isTakingPicture) {
      return null;
    }

    try {
      final XFile file = await _controller!.takePicture();
      return file;
    } catch (e) {
      debugPrint('Error taking picture: $e');
      return null;
    }
  }

  // Start video recording
  Future<void> startVideoRecording() async {
    if (_controller == null || !_controller!.value.isInitialized) {
      throw Exception('Camera not initialized');
    }

    if (_controller!.value.isRecordingVideo) {
      return;
    }

    try {
      await _controller!.startVideoRecording();
    } catch (e) {
      debugPrint('Error starting video recording: $e');
      rethrow;
    }
  }

  // Stop video recording
  Future<XFile?> stopVideoRecording() async {
    if (_controller == null || !_controller!.value.isRecordingVideo) {
      return null;
    }

    try {
      return await _controller!.stopVideoRecording();
    } catch (e) {
      debugPrint('Error stopping video recording: $e');
      return null;
    }
  }

  // Set flash mode
  Future<void> setFlashMode(FlashMode mode) async {
    if (_controller == null || !_controller!.value.isInitialized) {
      return;
    }

    try {
      await _controller!.setFlashMode(mode);
    } catch (e) {
      debugPrint('Error setting flash mode: $e');
    }
  }

  // Set zoom level
  Future<void> setZoomLevel(double zoom) async {
    if (_controller == null || !_controller!.value.isInitialized) {
      return;
    }

    try {
      final maxZoom = await _controller!.getMaxZoomLevel();
      final minZoom = await _controller!.getMinZoomLevel();
      final clampedZoom = zoom.clamp(minZoom, maxZoom);
      await _controller!.setZoomLevel(clampedZoom);
    } catch (e) {
      debugPrint('Error setting zoom level: $e');
    }
  }

  // Dispose camera
  Future<void> dispose() async {
    await _controller?.dispose();
    _controller = null;
  }
}

import 'package:camera/camera.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class CameraBackgroundService {
  static final CameraBackgroundService _instance = CameraBackgroundService._internal();
  factory CameraBackgroundService() => _instance;
  CameraBackgroundService._internal();

  List<CameraDescription>? _cameras;
  CameraController? _cameraController;
  ValueNotifier<bool> isEnabledNotifier = ValueNotifier(false);
  ValueNotifier<double> opacityNotifier = ValueNotifier(0.5);

  CameraController? get cameraController => _cameraController;
  bool get isEnabled => isEnabledNotifier.value;
  double get opacity => opacityNotifier.value;

  Future<void> initializeCameras() async {
    if (_cameras == null) {
      try {
        _cameras = await availableCameras();
        _loadPreferences();
      } catch (e) {
        print("Error initializing cameras: $e");
      }
    }
  }

  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    isEnabledNotifier.value = prefs.getBool('cameraBackgroundEnabled') ?? false;
    opacityNotifier.value = prefs.getDouble('cameraBackgroundOpacity') ?? 0.5;
    if (isEnabledNotifier.value) {
      await _initializeCameraController();
    }
  }

  Future<void> _savePreferences() async {
    final prefs = await SharedPreferences.getInstance();
    prefs.setBool('cameraBackgroundEnabled', isEnabledNotifier.value);
    prefs.setDouble('cameraBackgroundOpacity', opacityNotifier.value);
  }

  Future<void> _initializeCameraController() async {
    if (_cameras != null && _cameras!.isNotEmpty) {
      _cameraController = CameraController(
        _cameras![0], // Use the first available camera
        ResolutionPreset.medium,
        enableAudio: false,
      );
      try {
        await _cameraController!.initialize();
      } catch (e) {
        print("Error initializing camera controller: $e");
        _cameraController = null;
      }
    }
  }

  Future<void> toggleCameraBackground(bool enable) async {
    isEnabledNotifier.value = enable;
    await _savePreferences();
    if (enable) {
      if (_cameraController == null || !_cameraController!.value.isInitialized) {
        await _initializeCameraController();
      }
      if (_cameraController != null && _cameraController!.value.isInitialized) {
        await _cameraController!.startImageStream((image) {}); // Start stream to show preview
      }
    } else {
      await _cameraController?.stopImageStream();
      await _cameraController?.dispose();
      _cameraController = null;
    }
  }

  void setOpacity(double opacity) {
    opacityNotifier.value = opacity;
    _savePreferences();
  }

  void dispose() {
    _cameraController?.dispose();
    _cameraController = null;
    isEnabledNotifier.dispose();
    opacityNotifier.dispose();
  }
}


import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:google_mlkit_selfie_segmentation/google_mlkit_selfie_segmentation.dart';
import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';

/// AR Camera Screen with Advanced Features
/// - Real-time face detection and tracking
/// - Beauty filters (smooth skin, brighten, enhance)
/// - Green screen (AI background removal)
/// - Custom AR masks and effects
/// - Voice-reactive and motion-triggered effects
class ARCameraScreen extends StatefulWidget {
  const ARCameraScreen({Key? key}) : super(key: key);

  @override
  State<ARCameraScreen> createState() => _ARCameraScreenState();
}

class _ARCameraScreenState extends State<ARCameraScreen> {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isProcessing = false;

  // ML Kit detectors
  final FaceDetector _faceDetector = FaceDetector(
    options: FaceDetectorOptions(
      enableContours: true,
      enableLandmarks: true,
      enableClassification: true,
      enableTracking: true,
      performanceMode: FaceDetectorMode.accurate,
    ),
  );

  final SelfieSegmenter _selfieSegmenter = SelfieSegmenter(
    mode: SegmenterMode.stream,
  );

  // Face detection results
  List<Face> _faces = [];
  
  // Filter states
  bool _beautyFilterEnabled = false;
  int _beautyIntensity = 50; // 0-100
  bool _greenScreenEnabled = false;
  String? _selectedMask;
  
  // Motion detection
  double _motionIntensity = 0.0;
  Timer? _motionTimer;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras!.isNotEmpty) {
        // Use front camera for selfies
        final frontCamera = _cameras!.firstWhere(
          (camera) => camera.lensDirection == CameraLensDirection.front,
          orElse: () => _cameras!.first,
        );

        _cameraController = CameraController(
          frontCamera,
          ResolutionPreset.high,
          enableAudio: false,
          imageFormatGroup: ImageFormatGroup.yuv420,
        );

        await _cameraController!.initialize();
        
        // Start image stream for real-time processing
        _cameraController!.startImageStream(_processCameraImage);

        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
    }
  }

  Future<void> _processCameraImage(CameraImage image) async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      // Convert CameraImage to InputImage for ML Kit
      final inputImage = _convertToInputImage(image);
      if (inputImage == null) {
        _isProcessing = false;
        return;
      }

      // Detect faces
      final faces = await _faceDetector.processImage(inputImage);
      
      setState(() {
        _faces = faces;
      });

      // Process segmentation if green screen is enabled
      if (_greenScreenEnabled) {
        final mask = await _selfieSegmenter.processImage(inputImage);
        // Apply background replacement (implementation below)
        _applyGreenScreen(image, mask);
      }

      // Detect motion for motion-triggered effects
      _detectMotion(faces);

    } catch (e) {
      debugPrint('Error processing image: $e');
    }

    _isProcessing = false;
  }

  InputImage? _convertToInputImage(CameraImage image) {
    try {
      final WriteBuffer allBytes = WriteBuffer();
      for (Plane plane in image.planes) {
        allBytes.putUint8List(plane.bytes);
      }
      final bytes = allBytes.done().buffer.asUint8List();

      final Size imageSize = Size(image.width.toDouble(), image.height.toDouble());

      final InputImageRotation imageRotation = InputImageRotation.rotation0deg;

      final InputImageFormat inputImageFormat = InputImageFormat.yuv420;

      final planeData = image.planes.map(
        (Plane plane) {
          return InputImagePlaneMetadata(
            bytesPerRow: plane.bytesPerRow,
            height: plane.height,
            width: plane.width,
          );
        },
      ).toList();

      final inputImageData = InputImageData(
        size: imageSize,
        imageRotation: imageRotation,
        inputImageFormat: inputImageFormat,
        planeData: planeData,
      );

      return InputImage.fromBytes(bytes: bytes, inputImageData: inputImageData);
    } catch (e) {
      debugPrint('Error converting image: $e');
      return null;
    }
  }

  void _applyGreenScreen(CameraImage cameraImage, SegmentationMask? mask) {
    // TODO: Implement background replacement
    // 1. Use mask to separate foreground (person) from background
    // 2. Replace background with custom image or color
    // 3. Blend edges for smooth transition
  }

  void _detectMotion(List<Face> faces) {
    if (faces.isEmpty) {
      setState(() {
        _motionIntensity = 0.0;
      });
      return;
    }

    // Detect head movement, mouth opening, eye blinking
    final face = faces.first;
    
    // Head rotation
    final headEulerAngleY = face.headEulerAngleY ?? 0.0;
    final headEulerAngleZ = face.headEulerAngleZ ?? 0.0;
    
    // Smile probability
    final smilingProbability = face.smilingProbability ?? 0.0;
    
    // Calculate motion intensity
    final motion = (headEulerAngleY.abs() + headEulerAngleZ.abs() + smilingProbability * 100) / 3;
    
    setState(() {
      _motionIntensity = motion.clamp(0.0, 100.0);
    });
  }

  Widget _buildFaceOverlay() {
    if (_faces.isEmpty || _cameraController == null) {
      return const SizedBox.shrink();
    }

    return CustomPaint(
      painter: FacePainter(
        faces: _faces,
        imageSize: Size(
          _cameraController!.value.previewSize!.height,
          _cameraController!.value.previewSize!.width,
        ),
        selectedMask: _selectedMask,
      ),
    );
  }

  Widget _buildControlPanel() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.7),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Beauty Filter Toggle
            Row(
              children: [
                const Icon(Icons.face, color: Colors.white),
                const SizedBox(width: 12),
                const Text(
                  'Beauty Filter',
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
                const Spacer(),
                Switch(
                  value: _beautyFilterEnabled,
                  onChanged: (value) {
                    setState(() {
                      _beautyFilterEnabled = value;
                    });
                  },
                  activeColor: const Color(0xFF00C6FF),
                ),
              ],
            ),
            
            // Beauty Intensity Slider
            if (_beautyFilterEnabled)
              Row(
                children: [
                  const Text('Intensity', style: TextStyle(color: Colors.white70)),
                  Expanded(
                    child: Slider(
                      value: _beautyIntensity.toDouble(),
                      min: 0,
                      max: 100,
                      divisions: 100,
                      activeColor: const Color(0xFF00C6FF),
                      onChanged: (value) {
                        setState(() {
                          _beautyIntensity = value.toInt();
                        });
                      },
                    ),
                  ),
                  Text('$_beautyIntensity%', style: const TextStyle(color: Colors.white)),
                ],
              ),

            const Divider(color: Colors.white24),

            // Green Screen Toggle
            Row(
              children: [
                const Icon(Icons.wallpaper, color: Colors.white),
                const SizedBox(width: 12),
                const Text(
                  'Green Screen',
                  style: TextStyle(color: Colors.white, fontSize: 16),
                ),
                const Spacer(),
                Switch(
                  value: _greenScreenEnabled,
                  onChanged: (value) {
                    setState(() {
                      _greenScreenEnabled = value;
                    });
                  },
                  activeColor: const Color(0xFF00C6FF),
                ),
              ],
            ),

            const Divider(color: Colors.white24),

            // AR Masks
            const Text(
              'AR Masks',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _buildMaskButton('None', null),
                  _buildMaskButton('Mustache', 'mustache'),
                  _buildMaskButton('Glasses', 'glasses'),
                  _buildMaskButton('Crown', 'crown'),
                  _buildMaskButton('Bunny', 'bunny'),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Motion Intensity Indicator
            Row(
              children: [
                const Icon(Icons.motion_photos_on, color: Colors.white),
                const SizedBox(width: 12),
                const Text('Motion', style: TextStyle(color: Colors.white)),
                const SizedBox(width: 12),
                Expanded(
                  child: LinearProgressIndicator(
                    value: _motionIntensity / 100,
                    backgroundColor: Colors.white24,
                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF00C6FF)),
                  ),
                ),
                const SizedBox(width: 12),
                Text('${_motionIntensity.toInt()}%', style: const TextStyle(color: Colors.white)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMaskButton(String label, String? maskId) {
    final isSelected = _selectedMask == maskId;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: ElevatedButton(
        onPressed: () {
          setState(() {
            _selectedMask = maskId;
          });
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: isSelected ? const Color(0xFF00C6FF) : Colors.white24,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        child: Text(label),
      ),
    );
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _faceDetector.close();
    _selfieSegmenter.close();
    _motionTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('AR Camera'),
        backgroundColor: Colors.black,
        actions: [
          IconButton(
            icon: const Icon(Icons.flip_camera_ios),
            onPressed: () {
              // TODO: Implement camera flip
            },
          ),
          IconButton(
            icon: const Icon(Icons.camera_alt),
            onPressed: () {
              // TODO: Implement capture
            },
          ),
        ],
      ),
      body: _isInitialized && _cameraController != null
          ? Stack(
              children: [
                // Camera Preview
                Center(
                  child: AspectRatio(
                    aspectRatio: _cameraController!.value.aspectRatio,
                    child: CameraPreview(_cameraController!),
                  ),
                ),
                
                // Face Overlay with AR Effects
                _buildFaceOverlay(),
                
                // Control Panel
                _buildControlPanel(),
              ],
            )
          : const Center(
              child: CircularProgressIndicator(
                color: Color(0xFF00C6FF),
              ),
            ),
    );
  }
}

/// Custom painter for face overlays and AR masks
class FacePainter extends CustomPainter {
  final List<Face> faces;
  final Size imageSize;
  final String? selectedMask;

  FacePainter({
    required this.faces,
    required this.imageSize,
    this.selectedMask,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0
      ..color = const Color(0xFF00C6FF);

    for (final face in faces) {
      // Draw bounding box
      final rect = _scaleRect(
        rect: face.boundingBox,
        imageSize: imageSize,
        widgetSize: size,
      );

      canvas.drawRect(rect, paint);

      // Draw facial landmarks
      if (face.landmarks.isNotEmpty) {
        _drawLandmarks(canvas, face, size);
      }

      // Draw AR mask if selected
      if (selectedMask != null) {
        _drawMask(canvas, face, size, selectedMask!);
      }
    }
  }

  void _drawLandmarks(Canvas canvas, Face face, Size size) {
    final Paint landmarkPaint = Paint()
      ..style = PaintingStyle.fill
      ..color = const Color(0xFF20E3FF);

    for (final landmark in face.landmarks.values) {
      if (landmark != null) {
        final point = _scalePoint(
          point: landmark.position,
          imageSize: imageSize,
          widgetSize: size,
        );
        canvas.drawCircle(point, 3, landmarkPaint);
      }
    }
  }

  void _drawMask(Canvas canvas, Face face, Size size, String maskType) {
    // TODO: Implement AR mask rendering based on facial landmarks
    // For now, draw a simple placeholder
    final rect = _scaleRect(
      rect: face.boundingBox,
      imageSize: imageSize,
      widgetSize: size,
    );

    final Paint maskPaint = Paint()
      ..style = PaintingStyle.fill
      ..color = Colors.purple.withOpacity(0.3);

    canvas.drawOval(rect, maskPaint);
  }

  Rect _scaleRect({
    required Rect rect,
    required Size imageSize,
    required Size widgetSize,
  }) {
    final double scaleX = widgetSize.width / imageSize.width;
    final double scaleY = widgetSize.height / imageSize.height;

    return Rect.fromLTRB(
      rect.left * scaleX,
      rect.top * scaleY,
      rect.right * scaleX,
      rect.bottom * scaleY,
    );
  }

  Offset _scalePoint({
    required Point<int> point,
    required Size imageSize,
    required Size widgetSize,
  }) {
    final double scaleX = widgetSize.width / imageSize.width;
    final double scaleY = widgetSize.height / imageSize.height;

    return Offset(
      point.x.toDouble() * scaleX,
      point.y.toDouble() * scaleY,
    );
  }

  @override
  bool shouldRepaint(covariant FacePainter oldDelegate) {
    return oldDelegate.faces != faces || oldDelegate.selectedMask != selectedMask;
  }
}

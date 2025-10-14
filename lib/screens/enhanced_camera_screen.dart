import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:spaktok/screens/filters_screen.dart';


class EnhancedCameraScreen extends StatefulWidget {
  const EnhancedCameraScreen({Key? key}) : super(key: key);

  @override
  State<EnhancedCameraScreen> createState() => _EnhancedCameraScreenState();
}

class _EnhancedCameraScreenState extends State<EnhancedCameraScreen> with TickerProviderStateMixin {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isCameraInitialized = false;
  bool _isRecording = false;
  bool _isFlashOn = false;
  int _selectedCameraIndex = 0;
  String _selectedMode = 'Photo';
  double _currentZoom = 1.0;
  double _minZoom = 1.0;
  double _maxZoom = 8.0;
  
  late AnimationController _recordingAnimationController;
  late Animation<double> _recordingAnimation;

  final List<String> _modes = ['Photo', 'Video', 'Live', 'Story'];
  final List<Map<String, dynamic>> _quickFilters = [
    {'name': 'None', 'icon': Icons.block, 'color': Colors.grey},
    {'name': 'Beauty', 'icon': Icons.face, 'color': Colors.pink},
    {'name': 'Vintage', 'icon': Icons.camera_alt, 'color': Colors.brown},
    {'name': 'Cool', 'icon': Icons.ac_unit, 'color': Colors.blue},
    {'name': 'Warm', 'icon': Icons.wb_sunny, 'color': Colors.orange},
  ];

  @override
  void initState() {
    super.initState();
    _initializeCamera();
    _recordingAnimationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    )..repeat(reverse: true);
    _recordingAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _recordingAnimationController, curve: Curves.easeInOut),
    );
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras != null && _cameras!.isNotEmpty) {
        _cameraController = CameraController(
          _cameras![_selectedCameraIndex],
          ResolutionPreset.high,
          enableAudio: true,
        );
        
        await _cameraController!.initialize();
        _minZoom = await _cameraController!.getMinZoomLevel();
        _maxZoom = await _cameraController!.getMaxZoomLevel();
        
        if (mounted) {
          setState(() {
            _isCameraInitialized = true;
          });
        }
      }
    } catch (e) {
      print('Error initializing camera: $e');
    }
  }

  Future<void> _switchCamera() async {
    if (_cameras == null || _cameras!.length < 2) return;
    
    setState(() {
      _selectedCameraIndex = (_selectedCameraIndex + 1) % _cameras!.length;
      _isCameraInitialized = false;
    });
    
    await _cameraController?.dispose();
    await _initializeCamera();
  }

  Future<void> _toggleFlash() async {
    if (_cameraController == null) return;
    
    try {
      setState(() {
        _isFlashOn = !_isFlashOn;
      });
      
      await _cameraController!.setFlashMode(
        _isFlashOn ? FlashMode.torch : FlashMode.off,
      );
    } catch (e) {
      print('Error toggling flash: $e');
    }
  }

  Future<void> _takePicture() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    try {
      final XFile photo = await _cameraController!.takePicture();
      // Navigate to edit screen or save
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Photo captured!'),
            duration: Duration(seconds: 1),
          ),
        );
      }
    } catch (e) {
      print('Error taking picture: $e');
    }
  }

  Future<void> _startRecording() async {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return;
    }

    try {
      await _cameraController!.startVideoRecording();
      setState(() {
        _isRecording = true;
      });
    } catch (e) {
      print('Error starting recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    if (_cameraController == null || !_cameraController!.value.isRecordingVideo) {
      return;
    }

    try {
      final XFile video = await _cameraController!.stopVideoRecording();
      setState(() {
        _isRecording = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Video recorded!'),
            duration: Duration(seconds: 1),
          ),
        );
      }
    } catch (e) {
      print('Error stopping recording: $e');
    }
  }

  void _handleZoom(ScaleUpdateDetails details) {
    if (_cameraController == null) return;
    
    double newZoom = _currentZoom * details.scale;
    newZoom = newZoom.clamp(_minZoom, _maxZoom);
    
    _cameraController!.setZoomLevel(newZoom);
    setState(() {
      _currentZoom = newZoom;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          _buildCameraPreview(),
          _buildTopControls(),
          _buildBottomControls(),
          _buildSideControls(),
        ],
      ),
    );
  }

  Widget _buildCameraPreview() {
    if (!_isCameraInitialized || _cameraController == null) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return GestureDetector(
      onScaleUpdate: _handleZoom,
      child: SizedBox(
        width: MediaQuery.of(context).size.width,
        height: MediaQuery.of(context).size.height,
        child: CameraPreview(_cameraController!),
      ),
    );
  }

  Widget _buildTopControls() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _buildControlButton(
              Icons.close,
              () => Navigator.pop(context),
            ),
            _buildModeSelector(),
            _buildControlButton(
              _isFlashOn ? Icons.flash_on : Icons.flash_off,
              _toggleFlash,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModeSelector() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: DropdownButton<String>(
        value: _selectedMode,
        dropdownColor: Colors.grey[900],
        underline: Container(),
        icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        items: _modes.map((mode) {
          return DropdownMenuItem<String>(
            value: mode,
            child: Text(mode),
          );
        }).toList(),
        onChanged: (value) {
          if (value != null) {
            setState(() {
              _selectedMode = value;
            });
          }
        },
      ),
    );
  }

  Widget _buildBottomControls() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 30),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withOpacity(0.8),
              Colors.transparent,
            ],
          ),
        ),
        child: Column(
          children: [
            _buildQuickFilters(),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildGalleryButton(),
                _buildCaptureButton(),
                _buildSwitchCameraButton(),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickFilters() {
    return SizedBox(
      height: 70,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: _quickFilters.length,
        itemBuilder: (context, index) {
          final filter = _quickFilters[index];
          return GestureDetector(
            onTap: () {
              // Apply quick filter
            },
            child: Container(
              width: 60,
              margin: const EdgeInsets.only(right: 10),
              child: Column(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: filter['color'].withOpacity(0.3),
                      shape: BoxShape.circle,
                      border: Border.all(color: filter['color'], width: 2),
                    ),
                    child: Icon(filter['icon'], color: Colors.white),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    filter['name'],
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildGalleryButton() {
    return GestureDetector(
      onTap: () async {
        final ImagePicker picker = ImagePicker();
        final XFile? image = await picker.pickImage(source: ImageSource.gallery);
        // Handle gallery image
      },
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.3),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white, width: 2),
        ),
        child: const Icon(Icons.photo_library, color: Colors.white),
      ),
    );
  }

  Widget _buildCaptureButton() {
    return GestureDetector(
      onTap: () {
        if (_selectedMode == 'Photo') {
          _takePicture();
        } else if (_selectedMode == 'Video') {
          if (_isRecording) {
            _stopRecording();
          } else {
            _startRecording();
          }
        }
      },
      child: AnimatedBuilder(
        animation: _recordingAnimation,
        builder: (context, child) {
          return Container(
            width: _isRecording ? 70 * _recordingAnimation.value : 70,
            height: _isRecording ? 70 * _recordingAnimation.value : 70,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: _isRecording ? Colors.red : Colors.white,
                width: 4,
              ),
            ),
            child: Container(
              margin: const EdgeInsets.all(5),
              decoration: BoxDecoration(
                color: _isRecording ? Colors.red : Colors.white,
                shape: _isRecording ? BoxShape.rectangle : BoxShape.circle,
                borderRadius: _isRecording ? BorderRadius.circular(5) : null,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSwitchCameraButton() {
    return GestureDetector(
      onTap: _switchCamera,
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.3),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
        ),
        child: const Icon(Icons.flip_camera_ios, color: Colors.white),
      ),
    );
  }

  Widget _buildSideControls() {
    return Positioned(
      right: 20,
      top: MediaQuery.of(context).size.height / 2 - 150,
      child: Column(
        children: [
          _buildSideButton(Icons.filter, () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => FiltersScreen(cameraController: _cameraController),
              ),
            );
          }),
          const SizedBox(height: 20),
          _buildSideButton(Icons.timer, () {
            // Timer functionality
          }),
          const SizedBox(height: 20),
          _buildSideButton(Icons.grid_on, () {
            // Grid overlay
          }),
          const SizedBox(height: 20),
          _buildSideButton(Icons.music_note, () {
            // Add music
          }),
          const SizedBox(height: 20),
          _buildZoomIndicator(),
        ],
      ),
    );
  }

  Widget _buildSideButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white),
      ),
    );
  }

  Widget _buildZoomIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        '${_currentZoom.toStringAsFixed(1)}x',
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildControlButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 45,
        height: 45,
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white),
      ),
    );
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _recordingAnimationController.dispose();
    super.dispose();
  }
}

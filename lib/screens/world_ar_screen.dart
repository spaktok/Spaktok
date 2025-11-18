import 'package:flutter/material.dart';
import 'package:ar_flutter_plugin/ar_flutter_plugin.dart';
import 'package:ar_flutter_plugin/datatypes/config_planedetection.dart';
import 'package:ar_flutter_plugin/datatypes/hittest_result_types.dart';
import 'package:ar_flutter_plugin/managers/ar_anchor_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_location_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_object_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_session_manager.dart';
import 'package:ar_flutter_plugin/models/ar_hittest_result.dart';
import '../services/world_ar_service.dart';

class WorldARScreen extends StatefulWidget {
  const WorldARScreen({Key? key}) : super(key: key);

  @override
  State<WorldARScreen> createState() => _WorldARScreenState();
}

class _WorldARScreenState extends State<WorldARScreen> {
  final WorldARService _arService = WorldARService();

  ARSessionManager? arSessionManager;
  ARObjectManager? arObjectManager;
  ARAnchorManager? arAnchorManager;

  List<Map<String, dynamic>> _modelCatalog = [];
  String? _selectedModelUrl;
  bool _isLoadingModels = true;
  bool _isPlacingMode = false;
  double _objectScale = 0.2;

  @override
  void initState() {
    super.initState();
    _loadModelCatalog();
  }

  Future<void> _loadModelCatalog() async {
    try {
      final models = await _arService.getModelCatalog();
      setState(() {
        _modelCatalog = models;
        _isLoadingModels = false;
        if (models.isNotEmpty) {
          _selectedModelUrl = models[0]['url'];
        }
      });
    } catch (e) {
      setState(() => _isLoadingModels = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading models: $e')),
        );
      }
    }
  }

  void onARViewCreated(
    ARSessionManager arSessionManager,
    ARObjectManager arObjectManager,
    ARAnchorManager arAnchorManager,
    ARLocationManager arLocationManager,
  ) {
    this.arSessionManager = arSessionManager;
    this.arObjectManager = arObjectManager;
    this.arAnchorManager = arAnchorManager;

    this.arSessionManager!.onInitialize(
          showFeaturePoints: false,
          showPlanes: true,
          showWorldOrigin: false,
          handleTaps: true,
        );

    this.arObjectManager!.onInitialize();

    this.arSessionManager!.onPlaneOrPointTap = onPlaneOrPointTapped;

    // Initialize AR service
    _arService.initializeARSession(
      arSessionManager: arSessionManager,
      arObjectManager: arObjectManager,
      arAnchorManager: arAnchorManager,
    );
  }

  Future<void> onPlaneOrPointTapped(
      List<ARHitTestResult> hitTestResults) async {
    if (!_isPlacingMode || _selectedModelUrl == null) return;

    final singleHitTestResult = hitTestResults.firstWhere(
      (hitTestResult) => hitTestResult.type == ARHitTestResultType.plane,
      orElse: () => hitTestResults.first,
    );

    try {
      final node = await _arService.placeObject(
        objectUrl: _selectedModelUrl!,
        hitResult: singleHitTestResult,
        metadata: {
          'modelUrl': _selectedModelUrl,
          'scale': _objectScale,
        },
      );

      if (node != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Object placed!'),
            duration: Duration(seconds: 1),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error placing object: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // AR View
          ARView(
            onARViewCreated: onARViewCreated,
            planeDetectionConfig: PlaneDetectionConfig.horizontalAndVertical,
          ),

          // Top bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.7),
                      Colors.transparent,
                    ],
                  ),
                ),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Expanded(
                      child: Text(
                        'World AR',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.info_outline, color: Colors.white),
                      onPressed: _showHelp,
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Bottom controls
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Container(
                padding: const EdgeInsets.all(16),
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
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Model selector
                    if (!_isLoadingModels && _modelCatalog.isNotEmpty)
                      SizedBox(
                        height: 100,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: _modelCatalog.length,
                          itemBuilder: (context, index) {
                            final model = _modelCatalog[index];
                            final isSelected =
                                model['url'] == _selectedModelUrl;

                            return GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedModelUrl = model['url'];
                                });
                              },
                              child: Container(
                                width: 80,
                                margin: const EdgeInsets.only(right: 12),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? Colors.pink.withOpacity(0.3)
                                      : Colors.grey[800],
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isSelected
                                        ? Colors.pink
                                        : Colors.transparent,
                                    width: 2,
                                  ),
                                ),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.view_in_ar,
                                      color: isSelected
                                          ? Colors.pink
                                          : Colors.white70,
                                      size: 32,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      model['name'] ?? 'Model',
                                      style: TextStyle(
                                        color: isSelected
                                            ? Colors.white
                                            : Colors.white70,
                                        fontSize: 12,
                                      ),
                                      textAlign: TextAlign.center,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),

                    const SizedBox(height: 16),

                    // Scale slider
                    if (_selectedModelUrl != null)
                      Row(
                        children: [
                          const Icon(Icons.zoom_out, color: Colors.white70),
                          Expanded(
                            child: Slider(
                              value: _objectScale,
                              min: 0.1,
                              max: 1.0,
                              onChanged: (value) {
                                setState(() => _objectScale = value);
                              },
                              activeColor: Colors.pink,
                            ),
                          ),
                          const Icon(Icons.zoom_in, color: Colors.white70),
                        ],
                      ),

                    const SizedBox(height: 8),

                    // Action buttons
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: _selectedModelUrl == null
                                ? null
                                : () {
                                    setState(() {
                                      _isPlacingMode = !_isPlacingMode;
                                    });
                                  },
                            icon: Icon(_isPlacingMode
                                ? Icons.check_circle
                                : Icons.add_circle_outline),
                            label: Text(_isPlacingMode
                                ? 'Tap to Place'
                                : 'Start Placing'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _isPlacingMode
                                  ? Colors.pink
                                  : Colors.grey[800],
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          onPressed: _clearAllObjects,
                          icon: const Icon(Icons.delete_outline),
                          label: const Text('Clear'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey[800],
                            padding: const EdgeInsets.symmetric(
                              vertical: 16,
                              horizontal: 20,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          onPressed: _captureScreenshot,
                          icon: const Icon(Icons.camera_alt),
                          label: const Text(''),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey[800],
                            padding: const EdgeInsets.all(16),
                            shape: const CircleBorder(),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Instruction overlay
          if (_isPlacingMode && _selectedModelUrl != null)
            Positioned(
              top: 100,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.pink,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Tap on a surface to place object',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showHelp() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('How to use World AR'),
        content: const SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('1. Move your device to scan surfaces'),
              SizedBox(height: 8),
              Text('2. Select a 3D model from the bottom'),
              SizedBox(height: 8),
              Text('3. Adjust the size with the slider'),
              SizedBox(height: 8),
              Text('4. Tap "Start Placing"'),
              SizedBox(height: 8),
              Text('5. Tap on detected surfaces to place objects'),
              SizedBox(height: 8),
              Text('6. Capture and share your AR creation!'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Got it'),
          ),
        ],
      ),
    );
  }

  Future<void> _clearAllObjects() async {
    await _arService.clearAllObjects();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All objects cleared')),
      );
    }
  }

  Future<void> _captureScreenshot() async {
    try {
      final screenshot = await _arService.captureARScreenshot();
      if (screenshot != null && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Screenshot saved!')),
        );
        // TODO: Save screenshot to gallery or share
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error capturing screenshot: $e')),
        );
      }
    }
  }

  @override
  void dispose() {
    arSessionManager?.dispose();
    _arService.dispose();
    super.dispose();
  }
}

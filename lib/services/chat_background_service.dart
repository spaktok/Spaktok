import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:developer' as developer;

/// خدمة خلفيات الدردشة المتقدمة
/// تدعم: صور، تدرجات، أنماط، الكاميرا الخلفية المباشرة
class ChatBackgroundService extends ChangeNotifier {
  static const String _backgroundTypeKey = 'chat_background_type';
  static const String _backgroundValueKey = 'chat_background_value';

  ChatBackgroundType _currentType = ChatBackgroundType.gradient;
  String _currentValue = 'gradient_1';
  CameraController? _cameraController;
  bool _isCameraActive = false;

  ChatBackgroundType get currentType => _currentType;
  String get currentValue => _currentValue;
  CameraController? get cameraController => _cameraController;
  bool get isCameraActive => _isCameraActive;

  /// تهيئة الخدمة
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final type = prefs.getString(_backgroundTypeKey);
    final value = prefs.getString(_backgroundValueKey);

    if (type != null) {
      _currentType = ChatBackgroundType.values.firstWhere(
        (e) => e.name == type,
        orElse: () => ChatBackgroundType.gradient,
      );
    }

    if (value != null) {
      _currentValue = value;
    }

    notifyListeners();
  }

  /// تغيير نوع الخلفية
  Future<void> setBackground(ChatBackgroundType type, String value) async {
    // إيقاف الكاميرا إذا كانت نشطة
    if (_isCameraActive) {
      await stopCamera();
    }

    _currentType = type;
    _currentValue = value;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_backgroundTypeKey, type.name);
    await prefs.setString(_backgroundValueKey, value);

    // تفعيل الكاميرا إذا كان النوع كاميرا
    if (type == ChatBackgroundType.camera) {
      await startCamera();
    }

    notifyListeners();
  }

  /// بدء الكاميرا
  Future<void> startCamera() async {
    try {
      final cameras = await availableCameras();
      if (cameras.isEmpty) {
        developer.log('No cameras available', name: 'chat_background_service');
        return;
      }

      // استخدام الكاميرا الخلفية
      final backCamera = cameras.firstWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        backCamera,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );

      await _cameraController!.initialize();
      _isCameraActive = true;
      notifyListeners();
    } catch (e) {
      developer.log('Error starting camera: $e', name: 'chat_background_service');
      _isCameraActive = false;
    }
  }

  /// إيقاف الكاميرا
  Future<void> stopCamera() async {
    if (_cameraController != null) {
      await _cameraController!.dispose();
      _cameraController = null;
      _isCameraActive = false;
      notifyListeners();
    }
  }

  /// الحصول على widget الخلفية
  Widget getBackgroundWidget(BuildContext context) {
    switch (_currentType) {
      case ChatBackgroundType.solid:
        return Container(color: _getSolidColor());

      case ChatBackgroundType.gradient:
        return Container(
          decoration: BoxDecoration(
            gradient: _getGradient(),
          ),
        );

      case ChatBackgroundType.image:
        return Image.asset(
          'assets/backgrounds/$_currentValue',
          fit: BoxFit.cover,
          width: double.infinity,
          height: double.infinity,
        );

      case ChatBackgroundType.pattern:
        return Stack(
          children: [
            Container(color: Colors.grey[100]),
            Opacity(
              opacity: 0.1,
              child: Container(
                width: double.infinity,
                height: double.infinity,
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage('assets/backgrounds/$_currentValue'),
                    repeat: ImageRepeat.repeat,
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
          ],
        );

      case ChatBackgroundType.camera:
        return _buildCameraBackground();

      case ChatBackgroundType.anime:
        return Container(
          decoration: BoxDecoration(
            image: DecorationImage(
              image: AssetImage('assets/backgrounds/$_currentValue'),
              fit: BoxFit.cover,
              colorFilter: ColorFilter.mode(
                Colors.purple.withValues(alpha: 0.3),
                BlendMode.overlay,
              ),
            ),
          ),
        );
    }
  }

  Widget _buildCameraBackground() {
    if (_cameraController == null || !_cameraController!.value.isInitialized) {
      return Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Stack(
      children: [
        // معاينة الكاميرا
        SizedBox.expand(
          child: FittedBox(
            fit: BoxFit.cover,
            child: SizedBox(
              width: _cameraController!.value.previewSize!.height,
              height: _cameraController!.value.previewSize!.width,
              child: CameraPreview(_cameraController!),
            ),
          ),
        ),
        // طبقة شفافة لتحسين قراءة الرسائل
        Container(
          color: Colors.black.withValues(alpha: 0.3),
        ),
      ],
    );
  }

  Color _getSolidColor() {
    switch (_currentValue) {
      case 'white':
        return Colors.white;
      case 'black':
        return Colors.black;
      case 'blue':
        return Colors.blue[100]!;
      case 'pink':
        return Colors.pink[100]!;
      case 'purple':
        return Colors.purple[100]!;
      default:
        return Colors.white;
    }
  }

  LinearGradient _getGradient() {
    switch (_currentValue) {
      case 'gradient_1':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF667eea), Color(0xFF764ba2)],
        );
      case 'gradient_2':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFf093fb), Color(0xFFf5576c)],
        );
      case 'gradient_3':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF4facfe), Color(0xFF00f2fe)],
        );
      case 'gradient_4':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF43e97b), Color(0xFF38f9d7)],
        );
      case 'gradient_5':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFfa709a), Color(0xFFfee140)],
        );
      default:
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF667eea), Color(0xFF764ba2)],
        );
    }
  }

  @override
  void dispose() {
    stopCamera();
    super.dispose();
  }
}

/// أنواع خلفيات الدردشة
enum ChatBackgroundType {
  solid, // لون واحد
  gradient, // تدرج
  image, // صورة
  pattern, // نمط متكرر
  camera, // الكاميرا الخلفية المباشرة
  anime, // خلفيات أنمي
}

/// الخلفيات المتاحة
class AvailableBackgrounds {
  static const List<Map<String, dynamic>> gradients = [
    {
      'id': 'gradient_1',
      'name': 'Purple Dream',
      'colors': [Color(0xFF667eea), Color(0xFF764ba2)],
    },
    {
      'id': 'gradient_2',
      'name': 'Pink Sunset',
      'colors': [Color(0xFFf093fb), Color(0xFFf5576c)],
    },
    {
      'id': 'gradient_3',
      'name': 'Ocean Blue',
      'colors': [Color(0xFF4facfe), Color(0xFF00f2fe)],
    },
    {
      'id': 'gradient_4',
      'name': 'Green Paradise',
      'colors': [Color(0xFF43e97b), Color(0xFF38f9d7)],
    },
    {
      'id': 'gradient_5',
      'name': 'Sunset Glow',
      'colors': [Color(0xFFfa709a), Color(0xFFfee140)],
    },
  ];

  static const List<Map<String, String>> images = [
    {
      'id': 'gradient_1.png',
      'name': 'Abstract 1',
    },
    {
      'id': 'gradient_2.png',
      'name': 'Abstract 2',
    },
  ];

  static const List<Map<String, String>> patterns = [
    {
      'id': 'pattern_1.png',
      'name': 'Geometric',
    },
    {
      'id': 'pattern_2.png',
      'name': 'Dots',
    },
  ];

  static const List<Map<String, String>> anime = [
    {
      'id': 'anime_1.png',
      'name': 'Anime Sky',
    },
    {
      'id': 'anime_2.png',
      'name': 'Anime City',
    },
  ];

  static const List<Map<String, dynamic>> solids = [
    {'id': 'white', 'name': 'White', 'color': Colors.white},
    {'id': 'black', 'name': 'Black', 'color': Colors.black},
    {'id': 'blue', 'name': 'Blue', 'color': Colors.blue},
    {'id': 'pink', 'name': 'Pink', 'color': Colors.pink},
    {'id': 'purple', 'name': 'Purple', 'color': Colors.purple},
  ];
}

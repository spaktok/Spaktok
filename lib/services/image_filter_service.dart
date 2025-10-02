import 'dart:io';
import 'dart:typed_data';
import 'package:image/image.dart' as img;
import 'package:flutter/foundation.dart';

enum FilterType {
  none,
  grayscale,
  sepia,
  vintage,
  cool,
  warm,
  bright,
  dark,
  contrast,
  saturate,
  invert,
  blur,
  sharpen,
}

class ImageFilterService {
  static ImageFilterService? _instance;
  static ImageFilterService get instance {
    _instance ??= ImageFilterService._();
    return _instance!;
  }

  ImageFilterService._();

  // Apply filter to image file
  Future<File> applyFilterToFile(File imageFile, FilterType filter) async {
    try {
      final bytes = await imageFile.readAsBytes();
      final image = img.decodeImage(bytes);
      
      if (image == null) {
        throw Exception('Failed to decode image');
      }

      final filteredImage = await compute(_applyFilter, {
        'image': image,
        'filter': filter,
      });

      final filteredBytes = img.encodeJpg(filteredImage);
      await imageFile.writeAsBytes(filteredBytes);
      
      return imageFile;
    } catch (e) {
      debugPrint('Error applying filter: $e');
      rethrow;
    }
  }

  // Apply filter to image bytes
  Future<Uint8List> applyFilterToBytes(Uint8List bytes, FilterType filter) async {
    try {
      final image = img.decodeImage(bytes);
      
      if (image == null) {
        throw Exception('Failed to decode image');
      }

      final filteredImage = await compute(_applyFilter, {
        'image': image,
        'filter': filter,
      });

      return Uint8List.fromList(img.encodeJpg(filteredImage));
    } catch (e) {
      debugPrint('Error applying filter: $e');
      rethrow;
    }
  }

  // Static method for compute isolation
  static img.Image _applyFilter(Map<String, dynamic> params) {
    final image = params['image'] as img.Image;
    final filter = params['filter'] as FilterType;

    switch (filter) {
      case FilterType.none:
        return image;
      
      case FilterType.grayscale:
        return img.grayscale(image);
      
      case FilterType.sepia:
        return _applySepia(image);
      
      case FilterType.vintage:
        return _applyVintage(image);
      
      case FilterType.cool:
        return _applyCool(image);
      
      case FilterType.warm:
        return _applyWarm(image);
      
      case FilterType.bright:
        return img.adjustColor(image, brightness: 1.2);
      
      case FilterType.dark:
        return img.adjustColor(image, brightness: 0.8);
      
      case FilterType.contrast:
        return img.adjustColor(image, contrast: 1.3);
      
      case FilterType.saturate:
        return img.adjustColor(image, saturation: 1.5);
      
      case FilterType.invert:
        return img.invert(image);
      
      case FilterType.blur:
        return img.gaussianBlur(image, radius: 5);
      
      case FilterType.sharpen:
        return img.convolution(image, filter: [0, -1, 0, -1, 5, -1, 0, -1, 0]);
      
      default:
        return image;
    }
  }

  // Custom sepia filter
  static img.Image _applySepia(img.Image image) {
    return img.adjustColor(
      image,
      saturation: 0.3,
      hue: 20,
      brightness: 1.1,
    );
  }

  // Custom vintage filter
  static img.Image _applyVintage(img.Image image) {
    var result = img.adjustColor(
      image,
      saturation: 0.5,
      contrast: 1.2,
    );
    result = img.vignette(result);
    return result;
  }

  // Custom cool filter (blue tint)
  static img.Image _applyCool(img.Image image) {
    for (var y = 0; y < image.height; y++) {
      for (var x = 0; x < image.width; x++) {
        final pixel = image.getPixel(x, y);
        final r = pixel.r;
        final g = pixel.g;
        final b = pixel.b;
        final a = pixel.a;
        
        image.setPixel(
          x,
          y,
          img.ColorRgba8(
            (r * 0.9).toInt(),
            (g * 0.95).toInt(),
            (b * 1.1).toInt(),
            a.toInt(),
          ),
        );
      }
    }
    return image;
  }

  // Custom warm filter (orange tint)
  static img.Image _applyWarm(img.Image image) {
    for (var y = 0; y < image.height; y++) {
      for (var x = 0; x < image.width; x++) {
        final pixel = image.getPixel(x, y);
        final r = pixel.r;
        final g = pixel.g;
        final b = pixel.b;
        final a = pixel.a;
        
        image.setPixel(
          x,
          y,
          img.ColorRgba8(
            (r * 1.1).toInt(),
            (g * 1.05).toInt(),
            (b * 0.9).toInt(),
            a.toInt(),
          ),
        );
      }
    }
    return image;
  }

  // Adjust brightness
  Future<Uint8List> adjustBrightness(Uint8List bytes, double brightness) async {
    try {
      final image = img.decodeImage(bytes);
      if (image == null) throw Exception('Failed to decode image');
      
      final adjusted = img.adjustColor(image, brightness: brightness);
      return Uint8List.fromList(img.encodeJpg(adjusted));
    } catch (e) {
      debugPrint('Error adjusting brightness: $e');
      rethrow;
    }
  }

  // Adjust contrast
  Future<Uint8List> adjustContrast(Uint8List bytes, double contrast) async {
    try {
      final image = img.decodeImage(bytes);
      if (image == null) throw Exception('Failed to decode image');
      
      final adjusted = img.adjustColor(image, contrast: contrast);
      return Uint8List.fromList(img.encodeJpg(adjusted));
    } catch (e) {
      debugPrint('Error adjusting contrast: $e');
      rethrow;
    }
  }

  // Adjust saturation
  Future<Uint8List> adjustSaturation(Uint8List bytes, double saturation) async {
    try {
      final image = img.decodeImage(bytes);
      if (image == null) throw Exception('Failed to decode image');
      
      final adjusted = img.adjustColor(image, saturation: saturation);
      return Uint8List.fromList(img.encodeJpg(adjusted));
    } catch (e) {
      debugPrint('Error adjusting saturation: $e');
      rethrow;
    }
  }

  // Crop image
  Future<Uint8List> cropImage(
    Uint8List bytes,
    int x,
    int y,
    int width,
    int height,
  ) async {
    try {
      final image = img.decodeImage(bytes);
      if (image == null) throw Exception('Failed to decode image');
      
      final cropped = img.copyCrop(image, x: x, y: y, width: width, height: height);
      return Uint8List.fromList(img.encodeJpg(cropped));
    } catch (e) {
      debugPrint('Error cropping image: $e');
      rethrow;
    }
  }

  // Rotate image
  Future<Uint8List> rotateImage(Uint8List bytes, int angle) async {
    try {
      final image = img.decodeImage(bytes);
      if (image == null) throw Exception('Failed to decode image');
      
      final rotated = img.copyRotate(image, angle: angle);
      return Uint8List.fromList(img.encodeJpg(rotated));
    } catch (e) {
      debugPrint('Error rotating image: $e');
      rethrow;
    }
  }

  // Flip image
  Future<Uint8List> flipImage(Uint8List bytes, {bool horizontal = true}) async {
    try {
      final image = img.decodeImage(bytes);
      if (image == null) throw Exception('Failed to decode image');
      
      final flipped = horizontal ? img.flipHorizontal(image) : img.flipVertical(image);
      return Uint8List.fromList(img.encodeJpg(flipped));
    } catch (e) {
      debugPrint('Error flipping image: $e');
      rethrow;
    }
  }

  // Resize image
  Future<Uint8List> resizeImage(
    Uint8List bytes,
    int width,
    int height,
  ) async {
    try {
      final image = img.decodeImage(bytes);
      if (image == null) throw Exception('Failed to decode image');
      
      final resized = img.copyResize(image, width: width, height: height);
      return Uint8List.fromList(img.encodeJpg(resized));
    } catch (e) {
      debugPrint('Error resizing image: $e');
      rethrow;
    }
  }
}

import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class ImageEditingService {
  static final ImageEditingService _instance = ImageEditingService._internal();
  factory ImageEditingService() => _instance;
  ImageEditingService._internal();

  final ImagePicker _picker = ImagePicker();

  // Pick image from camera or gallery
  Future<File?> pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );
      
      if (pickedFile != null) {
        return File(pickedFile.path);
      }
      return null;
    } catch (e) {
      throw Exception('Error picking image: $e');
    }
  }

  // Apply brightness filter
  ColorFilter applyBrightness(double brightness) {
    return ColorFilter.matrix([
      1, 0, 0, 0, brightness * 255,
      0, 1, 0, 0, brightness * 255,
      0, 0, 1, 0, brightness * 255,
      0, 0, 0, 1, 0,
    ]);
  }

  // Apply contrast filter
  ColorFilter applyContrast(double contrast) {
    double intercept = 128 * (1 - contrast);
    return ColorFilter.matrix([
      contrast, 0, 0, 0, intercept,
      0, contrast, 0, 0, intercept,
      0, 0, contrast, 0, intercept,
      0, 0, 0, 1, 0,
    ]);
  }

  // Apply saturation filter
  ColorFilter applySaturation(double saturation) {
    double invSat = 1 - saturation;
    double R = 0.213 * invSat;
    double G = 0.715 * invSat;
    double B = 0.072 * invSat;

    return ColorFilter.matrix([
      R + saturation, G, B, 0, 0,
      R, G + saturation, B, 0, 0,
      R, G, B + saturation, 0, 0,
      0, 0, 0, 1, 0,
    ]);
  }

  // Get predefined filter
  ColorFilter getFilter(String filterName) {
    switch (filterName.toLowerCase()) {
      case 'black & white':
      case 'grayscale':
        return const ColorFilter.matrix([
          0.2126, 0.7152, 0.0722, 0, 0,
          0.2126, 0.7152, 0.0722, 0, 0,
          0.2126, 0.7152, 0.0722, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      
      case 'sepia':
        return const ColorFilter.matrix([
          0.393, 0.769, 0.189, 0, 0,
          0.349, 0.686, 0.168, 0, 0,
          0.272, 0.534, 0.131, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      
      case 'vintage':
        return const ColorFilter.matrix([
          0.9, 0.5, 0.1, 0, 0,
          0.3, 0.8, 0.1, 0, 0,
          0.2, 0.3, 0.5, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      
      case 'warm':
        return const ColorFilter.matrix([
          1.2, 0, 0, 0, 0,
          0, 1.0, 0, 0, 0,
          0, 0, 0.8, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      
      case 'cool':
        return const ColorFilter.matrix([
          0.8, 0, 0, 0, 0,
          0, 1.0, 0, 0, 0,
          0, 0, 1.2, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      
      case 'dramatic':
        return const ColorFilter.matrix([
          1.5, 0, 0, 0, 0,
          0, 1.5, 0, 0, 0,
          0, 0, 1.5, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      
      case 'soft':
        return const ColorFilter.matrix([
          0.8, 0.1, 0.1, 0, 0,
          0.1, 0.8, 0.1, 0, 0,
          0.1, 0.1, 0.8, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      
      case 'high contrast':
        return const ColorFilter.matrix([
          2.0, 0, 0, 0, -128,
          0, 2.0, 0, 0, -128,
          0, 0, 2.0, 0, -128,
          0, 0, 0, 1, 0,
        ]);
      
      case 'invert':
        return const ColorFilter.matrix([
          -1, 0, 0, 0, 255,
          0, -1, 0, 0, 255,
          0, 0, -1, 0, 255,
          0, 0, 0, 1, 0,
        ]);
      
      default:
        return const ColorFilter.matrix([
          1, 0, 0, 0, 0,
          0, 1, 0, 0, 0,
          0, 0, 1, 0, 0,
          0, 0, 0, 1, 0,
        ]);
    }
  }

  // Combine multiple filters
  ColorFilter combineFilters({
    double brightness = 0.0,
    double contrast = 1.0,
    double saturation = 1.0,
    String? filterName,
  }) {
    // Start with base filter if specified
    if (filterName != null && filterName.toLowerCase() != 'none') {
      return getFilter(filterName);
    }

    // Apply brightness, contrast, and saturation adjustments
    double intercept = 128 * (1 - contrast);
    double invSat = 1 - saturation;
    double R = 0.213 * invSat;
    double G = 0.715 * invSat;
    double B = 0.072 * invSat;

    return ColorFilter.matrix([
      (R + saturation) * contrast, G * contrast, B * contrast, 0, intercept + brightness * 255,
      R * contrast, (G + saturation) * contrast, B * contrast, 0, intercept + brightness * 255,
      R * contrast, G * contrast, (B + saturation) * contrast, 0, intercept + brightness * 255,
      0, 0, 0, 1, 0,
    ]);
  }

  // Get list of available filters
  List<String> getAvailableFilters() {
    return [
      'None',
      'Black & White',
      'Sepia',
      'Vintage',
      'Warm',
      'Cool',
      'Dramatic',
      'Soft',
      'High Contrast',
      'Invert',
    ];
  }

  // Save image to gallery (placeholder - would need platform-specific implementation)
  Future<bool> saveImageToGallery(File imageFile) async {
    try {
      // This would require platform-specific implementation
      // For now, we'll just return true as a placeholder
      await Future.delayed(const Duration(milliseconds: 500));
      return true;
    } catch (e) {
      throw Exception('Error saving image: $e');
    }
  }

  // Share image (placeholder - would need platform-specific implementation)
  Future<bool> shareImage(File imageFile, {String? text}) async {
    try {
      // This would require platform-specific implementation
      // For now, we'll just return true as a placeholder
      await Future.delayed(const Duration(milliseconds: 500));
      return true;
    } catch (e) {
      throw Exception('Error sharing image: $e');
    }
  }

  // Crop image (placeholder - would need image processing library)
  Future<File?> cropImage(File imageFile, Rect cropRect) async {
    try {
      // This would require an image processing library like image package
      // For now, we'll just return the original file
      await Future.delayed(const Duration(milliseconds: 500));
      return imageFile;
    } catch (e) {
      throw Exception('Error cropping image: $e');
    }
  }

  // Resize image (placeholder - would need image processing library)
  Future<File?> resizeImage(File imageFile, int width, int height) async {
    try {
      // This would require an image processing library like image package
      // For now, we'll just return the original file
      await Future.delayed(const Duration(milliseconds: 500));
      return imageFile;
    } catch (e) {
      throw Exception('Error resizing image: $e');
    }
  }
}

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/theme_mode.dart';

/// Service to manage app theme mode with persistence
/// Supports Light, Dark, and Anime themes
class AppThemeService extends ChangeNotifier {
  static const String _themeKey = 'app_theme_mode';

  AppThemeMode _currentTheme = AppThemeMode.dark;
  bool _isInitialized = false;

  AppThemeMode get currentTheme => _currentTheme;
  bool get isInitialized => _isInitialized;

  /// Initialize theme from saved preferences
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final savedTheme = prefs.getString(_themeKey);

      if (savedTheme != null) {
        _currentTheme = AppThemeMode.values.firstWhere(
          (mode) => mode.toString() == savedTheme,
          orElse: () => AppThemeMode.dark,
        );
      }

      _isInitialized = true;
      notifyListeners();
    } catch (e) {
      debugPrint('Error initializing theme: $e');
      _isInitialized = true;
    }
  }

  /// Set theme mode and persist to storage
  Future<void> setTheme(AppThemeMode mode) async {
    if (_currentTheme == mode) return;

    _currentTheme = mode;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_themeKey, mode.toString());
    } catch (e) {
      debugPrint('Error saving theme: $e');
    }
  }

  /// Toggle between light and dark modes
  Future<void> toggleLightDark() async {
    final newMode = _currentTheme == AppThemeMode.light
        ? AppThemeMode.dark
        : AppThemeMode.light;
    await setTheme(newMode);
  }

  /// Cycle through all theme modes
  Future<void> cycleTheme() async {
    final currentIndex = AppThemeMode.values.indexOf(_currentTheme);
    final nextIndex = (currentIndex + 1) % AppThemeMode.values.length;
    await setTheme(AppThemeMode.values[nextIndex]);
  }

  /// Check if current theme is light
  bool get isLight => _currentTheme == AppThemeMode.light;

  /// Check if current theme is dark
  bool get isDark => _currentTheme == AppThemeMode.dark;

  /// Check if current theme is anime
  bool get isAnime => _currentTheme == AppThemeMode.anime;
}

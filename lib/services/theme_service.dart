import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// نظام الثيمات الثلاثة: ليلي، نهاري، أنمي
/// مع إمكانية تخصيص الألوان بالكامل
class ThemeService extends ChangeNotifier {
  static const String _themeKey = 'selected_theme_mode';
  static const String _customColorsKey = 'custom_colors';

  ThemeMode _themeMode = ThemeMode.light;
  AppThemeType _appThemeType = AppThemeType.light;
  CustomColors? _customColors;

  ThemeMode get themeMode => _themeMode;
  AppThemeType get appThemeType => _appThemeType;
  CustomColors? get customColors => _customColors;

  /// تهيئة الثيم من التخزين
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final savedTheme = prefs.getString(_themeKey) ?? 'light';
    _appThemeType = AppThemeType.values.firstWhere(
      (e) => e.name == savedTheme,
      orElse: () => AppThemeType.light,
    );
    _themeMode = _getThemeMode(_appThemeType);

    // تحميل الألوان المخصصة
    final customColorsJson = prefs.getString(_customColorsKey);
    if (customColorsJson != null) {
      _customColors = CustomColors.fromJson(customColorsJson);
    }

    notifyListeners();
  }

  /// تغيير الثيم
  Future<void> setTheme(AppThemeType type) async {
    _appThemeType = type;
    _themeMode = _getThemeMode(type);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, type.name);

    notifyListeners();
  }

  /// تخصيص الألوان
  Future<void> setCustomColors(CustomColors colors) async {
    _customColors = colors;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_customColorsKey, colors.toJson());

    notifyListeners();
  }

  /// إعادة تعيين الألوان المخصصة
  Future<void> resetCustomColors() async {
    _customColors = null;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_customColorsKey);

    notifyListeners();
  }

  ThemeMode _getThemeMode(AppThemeType type) {
    switch (type) {
      case AppThemeType.light:
        return ThemeMode.light;
      case AppThemeType.dark:
        return ThemeMode.dark;
      case AppThemeType.anime:
        return ThemeMode.dark;
    }
  }

  /// الحصول على الثيم الحالي
  ThemeData getCurrentTheme(BuildContext context) {
    if (_customColors != null) {
      return _buildCustomTheme(context);
    }

    switch (_appThemeType) {
      case AppThemeType.light:
        return lightTheme;
      case AppThemeType.dark:
        return darkTheme;
      case AppThemeType.anime:
        return animeTheme;
    }
  }

  ThemeData _buildCustomTheme(BuildContext context) {
    return ThemeData(
      useMaterial3: true,
      brightness:
          _themeMode == ThemeMode.dark ? Brightness.dark : Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: _customColors!.primary,
        brightness:
            _themeMode == ThemeMode.dark ? Brightness.dark : Brightness.light,
        primary: _customColors!.primary,
        secondary: _customColors!.secondary,
        surface: _customColors!.surface,
        error: _customColors!.error,
      ),
      scaffoldBackgroundColor: _customColors!.background,
      appBarTheme: AppBarTheme(
        backgroundColor: _customColors!.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: _customColors!.surface,
        elevation: 2,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: _customColors!.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}

/// أنواع الثيمات
enum AppThemeType {
  light,
  dark,
  anime,
}

/// ثيم نهاري
final ThemeData lightTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.light,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFF6200EE),
    brightness: Brightness.light,
  ),
  scaffoldBackgroundColor: const Color(0xFFF5F5F5),
  appBarTheme: const AppBarTheme(
    backgroundColor: Color(0xFF6200EE),
    foregroundColor: Colors.white,
    elevation: 0,
    centerTitle: true,
  ),
  cardTheme: CardThemeData(
    color: Colors.white,
    elevation: 2,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
  ),
  floatingActionButtonTheme: const FloatingActionButtonThemeData(
    backgroundColor: Color(0xFF6200EE),
    foregroundColor: Colors.white,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFF6200EE), width: 2),
    ),
  ),
);

/// ثيم ليلي
final ThemeData darkTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFFBB86FC),
    brightness: Brightness.dark,
  ),
  scaffoldBackgroundColor: const Color(0xFF121212),
  appBarTheme: const AppBarTheme(
    backgroundColor: Color(0xFF1E1E1E),
    foregroundColor: Colors.white,
    elevation: 0,
    centerTitle: true,
  ),
  cardTheme: CardThemeData(
    color: const Color(0xFF1E1E1E),
    elevation: 4,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
  ),
  floatingActionButtonTheme: const FloatingActionButtonThemeData(
    backgroundColor: Color(0xFFBB86FC),
    foregroundColor: Colors.black,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: const Color(0xFF1E1E1E),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide.none,
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFBB86FC), width: 2),
    ),
  ),
);

/// ثيم أنمي
final ThemeData animeTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  colorScheme: ColorScheme.fromSeed(
    seedColor: const Color(0xFFFF69B4),
    brightness: Brightness.dark,
    primary: const Color(0xFFFF69B4),
    secondary: const Color(0xFF00CED1),
    tertiary: const Color(0xFFFFD700),
  ),
  scaffoldBackgroundColor: const Color(0xFF0A0E27),
  appBarTheme: const AppBarTheme(
    backgroundColor: Color(0xFF1A1F3A),
    foregroundColor: Color(0xFFFF69B4),
    elevation: 0,
    centerTitle: true,
  ),
  cardTheme: CardThemeData(
    color: const Color(0xFF1A1F3A),
    elevation: 8,
    shadowColor: const Color(0xFFFF69B4).withOpacity(0.3),
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(20),
      side: BorderSide(
        color: const Color(0xFFFF69B4).withOpacity(0.3),
        width: 1,
      ),
    ),
  ),
  floatingActionButtonTheme: FloatingActionButtonThemeData(
    backgroundColor: const Color(0xFFFF69B4),
    foregroundColor: Colors.white,
    elevation: 8,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(16),
    ),
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: const Color(0xFF1A1F3A),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(
        color: const Color(0xFFFF69B4).withOpacity(0.3),
      ),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFFF69B4), width: 2),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(
        color: const Color(0xFFFF69B4).withOpacity(0.3),
      ),
    ),
  ),
  textTheme: const TextTheme(
    displayLarge: TextStyle(
      color: Color(0xFFFF69B4),
      fontWeight: FontWeight.bold,
    ),
    displayMedium: TextStyle(
      color: Color(0xFFFF69B4),
      fontWeight: FontWeight.bold,
    ),
    titleLarge: TextStyle(
      color: Color(0xFFFF69B4),
      fontWeight: FontWeight.w600,
    ),
  ),
);

/// الألوان المخصصة
class CustomColors {
  final Color primary;
  final Color secondary;
  final Color background;
  final Color surface;
  final Color error;
  final Color text;

  CustomColors({
    required this.primary,
    required this.secondary,
    required this.background,
    required this.surface,
    required this.error,
    required this.text,
  });

  String toJson() {
    return '{'
        '"primary":${primary.value},'
        '"secondary":${secondary.value},'
        '"background":${background.value},'
        '"surface":${surface.value},'
        '"error":${error.value},'
        '"text":${text.value}'
        '}';
  }

  factory CustomColors.fromJson(String json) {
    final data = json
        .replaceAll('{', '')
        .replaceAll('}', '')
        .replaceAll('"', '')
        .split(',')
        .map((e) => e.split(':'))
        .toList();

    return CustomColors(
      primary: Color(int.parse(data[0][1])),
      secondary: Color(int.parse(data[1][1])),
      background: Color(int.parse(data[2][1])),
      surface: Color(int.parse(data[3][1])),
      error: Color(int.parse(data[4][1])),
      text: Color(int.parse(data[5][1])),
    );
  }
}

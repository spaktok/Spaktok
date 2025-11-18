/// Theme mode enumeration for Spaktok
/// Supports Light, Dark, and Anime themes
enum AppThemeMode {
  light,
  dark,
  anime,
}

extension AppThemeModeExtension on AppThemeMode {
  String get name {
    switch (this) {
      case AppThemeMode.light:
        return 'Light';
      case AppThemeMode.dark:
        return 'Dark';
      case AppThemeMode.anime:
        return 'Anime';
    }
  }

  String get description {
    switch (this) {
      case AppThemeMode.light:
        return 'Pure white bright theme for daylight';
      case AppThemeMode.dark:
        return 'Vantablack with electric blue accents';
      case AppThemeMode.anime:
        return 'Vibrant anime-inspired theme with pastel colors';
    }
  }
}

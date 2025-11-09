import 'package:flutter/material.dart';

class ThemeConfig {
  // Define the new color palette
  static const Color vantablack = Color(0xFF000000);
  static const Color pureWhite = Color(0xFFFFFFFF);
  static const Color electricBlue = Color(0xFF0052D4);

  // The main dark theme for the app
  static final ThemeData darkTheme = ThemeData(
    brightness: Brightness.dark,
    primaryColor: electricBlue,
    scaffoldBackgroundColor: vantablack, // Vantablack background
    colorScheme: const ColorScheme.dark(
      primary: electricBlue,      // For buttons, FABs, etc.
      secondary: electricBlue,     // Background
      surface: vantablack,        // Surface of cards, dialogs
      onPrimary: pureWhite,       // Text on primary color
      onSecondary: pureWhite,    // Main text color
      onSurface: pureWhite,       // Text on cards
    ),

    // App Bar Theme
    appBarTheme: const AppBarTheme(
      backgroundColor: vantablack, // Black app bars
      elevation: 0, // No shadow for a modern look
      iconTheme: IconThemeData(color: pureWhite),
      titleTextStyle: TextStyle(color: pureWhite, fontSize: 20, fontWeight: FontWeight.bold),
    ),

    // Bottom Navigation Bar Theme
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: vantablack,
      selectedItemColor: electricBlue,
      unselectedItemColor: Colors.grey[600],
    ),

    // Text Theme
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: pureWhite),
      bodyMedium: TextStyle(color: pureWhite),
      titleLarge: TextStyle(color: pureWhite, fontWeight: FontWeight.bold),
      headlineSmall: TextStyle(color: pureWhite, fontWeight: FontWeight.bold),
    ),

    // Icon Theme
    iconTheme: const IconThemeData(
      color: pureWhite,
    ),

    // Elevated Button Theme
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: electricBlue, // Blue buttons
        foregroundColor: pureWhite,      // White text on buttons
      ),
    ),
  );

  // A consistent light theme (not currently used but good practice)
  static final ThemeData lightTheme = ThemeData(
    brightness: Brightness.light,
    primaryColor: electricBlue,
    scaffoldBackgroundColor: pureWhite,
    colorScheme: const ColorScheme.light(
      primary: electricBlue,
      secondary: electricBlue,
      surface: pureWhite,
      onPrimary: pureWhite,
      onSecondary: vantablack,
      onSurface: vantablack,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: pureWhite,
      elevation: 0,
      iconTheme: IconThemeData(color: vantablack),
      titleTextStyle: TextStyle(color: vantablack, fontSize: 20, fontWeight: FontWeight.bold),
    ),
  );
}

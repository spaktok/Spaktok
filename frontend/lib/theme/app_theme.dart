import 'package:flutter/material.dart';

class AppTheme {
  // Primary Palette
  static const Color vantablack = Color(0xFF000000);
  static const Color pureWhite = Color(0xFFFFFFFF);
  static const Color electricBlue = Color(0xFF00C6FF);
  static const Color plasmaViolet = Color(0xFF8A2BE2);
  static const Color cyanGlow = Color(0xFF20E3FF);
  static const Color darkSurface = Color(0xFF0A0A0A);

  // Gradients
  static const LinearGradient mainGradient = LinearGradient(
    colors: [
      cyanGlow,
      electricBlue,
      plasmaViolet,
      Color(0xFFFF2AD8), // Magenta from previous spec, blending with Plasma Violet
    ],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Text Styles
  static const String fontInter = 'Inter';
  static const String fontSFProDisplay = 'SF Pro Display';

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: vantablack,
      primaryColor: electricBlue,
      hintColor: cyanGlow,
      cardColor: darkSurface,
      dividerColor: Colors.white.withOpacity(0.1),
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 32, fontWeight: FontWeight.bold),
        displayMedium: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 28, fontWeight: FontWeight.bold),
        displaySmall: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 24, fontWeight: FontWeight.bold),
        headlineLarge: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 22, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 20, fontWeight: FontWeight.bold),
        headlineSmall: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 18, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 16, fontWeight: FontWeight.w600),
        titleMedium: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 14, fontWeight: FontWeight.w600),
        titleSmall: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 12, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 16),
        bodyMedium: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 14),
        bodySmall: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 12),
        labelLarge: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 14, fontWeight: FontWeight.bold),
        labelMedium: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 12, fontWeight: FontWeight.bold),
        labelSmall: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 10, fontWeight: FontWeight.bold),
      ).apply(bodyColor: pureWhite, displayColor: pureWhite),
      appBarTheme: AppBarTheme(
        backgroundColor: vantablack,
        foregroundColor: pureWhite,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 20, fontWeight: FontWeight.bold),
      ),
      buttonTheme: ButtonThemeData(
        buttonColor: electricBlue,
        textTheme: ButtonTextTheme.primary,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: electricBlue,
          foregroundColor: pureWhite,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.0)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          textStyle: const TextStyle(fontFamily: fontInter, fontSize: 16, fontWeight: FontWeight.bold),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: electricBlue,
          textStyle: const TextStyle(fontFamily: fontInter, fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkSurface,
        hintStyle: TextStyle(color: pureWhite.withOpacity(0.5)),
        labelStyle: const TextStyle(color: pureWhite),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.0),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.0),
          borderSide: const BorderSide(color: electricBlue, width: 2.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.0),
          borderSide: BorderSide(color: pureWhite.withOpacity(0.2), width: 1.0),
        ),
      ),
      iconTheme: const IconThemeData(
        color: pureWhite,
        size: 24,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: darkSurface,
        selectedItemColor: electricBlue,
        unselectedItemColor: pureWhite.withOpacity(0.6),
        type: BottomNavigationBarType.fixed,
        selectedLabelStyle: const TextStyle(fontFamily: fontInter, fontSize: 12),
        unselectedLabelStyle: const TextStyle(fontFamily: fontInter, fontSize: 12),
      ),
      tabBarTheme: TabBarTheme(
        labelColor: electricBlue,
        unselectedLabelColor: pureWhite.withOpacity(0.6),
        indicator: UnderlineTabIndicator(
          borderSide: BorderSide(color: electricBlue, width: 3.0),
          borderRadius: BorderRadius.circular(3.0),
        ),
        labelStyle: const TextStyle(fontFamily: fontInter, fontSize: 14, fontWeight: FontWeight.bold),
        unselectedLabelStyle: const TextStyle(fontFamily: fontInter, fontSize: 14, fontWeight: FontWeight.w600),
      ),
      cardTheme: CardTheme(
        color: darkSurface,
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.0)),
        margin: const EdgeInsets.all(8.0),
      ),
      dialogTheme: DialogTheme(
        backgroundColor: darkSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.0)),
        titleTextStyle: const TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 20, fontWeight: FontWeight.bold),
        contentTextStyle: const TextStyle(fontFamily: fontInter, color: pureWhite, fontSize: 16),
      ),
      sliderTheme: SliderThemeData(
        activeTrackColor: electricBlue,
        inactiveTrackColor: pureWhite.withOpacity(0.3),
        thumbColor: electricBlue,
        overlayColor: electricBlue.withOpacity(0.2),
        valueIndicatorColor: electricBlue,
        valueIndicatorTextStyle: const TextStyle(fontFamily: fontInter, color: pureWhite),
      ),
      switchTheme: SwitchThemeData(
        thumbColor: MaterialStateProperty.resolveWith<Color?>(
          (Set<MaterialState> states) {
            if (states.contains(MaterialState.selected)) {
              return electricBlue;
            }
            return pureWhite.withOpacity(0.8);
          },
        ),
        trackColor: MaterialStateProperty.resolveWith<Color?>(
          (Set<MaterialState> states) {
            if (states.contains(MaterialState.selected)) {
              return electricBlue.withOpacity(0.5);
            }
            return pureWhite.withOpacity(0.3);
          },
        ),
      ),
      // Add more theme properties as needed
    );
  }

  static ThemeData get lightTheme {
    // Define a light theme if dynamic theme switching is fully implemented
    // For now, it can be a basic light theme or a placeholder
    return ThemeData(
      brightness: Brightness.light,
      scaffoldBackgroundColor: pureWhite,
      primaryColor: electricBlue,
      hintColor: electricBlue,
      cardColor: Colors.white,
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 32, fontWeight: FontWeight.bold),
        displayMedium: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 28, fontWeight: FontWeight.bold),
        displaySmall: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 24, fontWeight: FontWeight.bold),
        headlineLarge: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 22, fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 20, fontWeight: FontWeight.bold),
        headlineSmall: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 18, fontWeight: FontWeight.bold),
        titleLarge: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 16, fontWeight: FontWeight.w600),
        titleMedium: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 14, fontWeight: FontWeight.w600),
        titleSmall: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 12, fontWeight: FontWeight.w600),
        bodyLarge: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 16),
        bodyMedium: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 14),
        bodySmall: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 12),
        labelLarge: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 14, fontWeight: FontWeight.bold),
        labelMedium: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 12, fontWeight: FontWeight.bold),
        labelSmall: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 10, fontWeight: FontWeight.bold),
      ).apply(bodyColor: vantablack, displayColor: vantablack),
      appBarTheme: AppBarTheme(
        backgroundColor: pureWhite,
        foregroundColor: vantablack,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(fontFamily: fontInter, color: vantablack, fontSize: 20, fontWeight: FontWeight.bold),
      ),
      // ... other light theme properties
    );
  }
}


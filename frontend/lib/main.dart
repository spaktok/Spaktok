import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:spaktok_frontend/firebase_options.dart';
import 'package:spaktok_frontend/theme/app_theme.dart';
import 'package:spaktok_frontend/screens/home_feed_screen.dart'; // Assuming this is the main screen

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  ThemeMode _themeMode = ThemeMode.dark; // Default to dark theme

  void _toggleTheme(bool isDark) {
    setState(() {
      _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Spaktok',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme, // Light theme definition
      darkTheme: AppTheme.darkTheme, // Dark theme definition
      themeMode: _themeMode, // Use the selected theme mode
      home: Builder(
        builder: (context) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Spaktok'),
              actions: [
                IconButton(
                  icon: Icon(
                    _themeMode == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode,
                  ),
                  onPressed: () {
                    _toggleTheme(_themeMode == ThemeMode.light);
                  },
                ),
              ],
            ),
            body: const HomeFeedScreen(), // Use HomeFeedScreen as the main content
          );
        },
      ),
    );
  }
}


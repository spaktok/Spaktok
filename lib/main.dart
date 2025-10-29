import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:spaktok/core/firebase_options.dart';
import 'package:spaktok/screens/main_navigation_screen.dart';
import 'package:spaktok/screens/auth/login_screen.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/services/call_service.dart';
import 'package:spaktok/services/location_service.dart'; // Import LocationService
import 'package:spaktok/config/theme_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Spaktok',
      theme: ThemeConfig.lightTheme,
      darkTheme: ThemeConfig.darkTheme,
      themeMode: ThemeMode.dark,
      home: const AuthWrapper(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final authService = AuthService();
    return StreamBuilder(
      stream: authService.authStateChanges,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        if (snapshot.hasData) {
          return const LoggedInWrapper(); // User is logged in
        }
        return const LoginScreen(); // User is not logged in
      },
    );
  }
}

// This widget is crucial for managing background services for a logged-in user
class LoggedInWrapper extends StatefulWidget {
  const LoggedInWrapper({super.key});

  @override
  State<LoggedInWrapper> createState() => _LoggedInWrapperState();
}

class _LoggedInWrapperState extends State<LoggedInWrapper> {
  final CallService _callService = CallService();
  final LocationService _locationService = LocationService();

  @override
  void initState() {
    super.initState();
    // Start all essential background services when user logs in
    _callService.listenForIncomingCalls(context);
    _locationService.startLocationUpdates(); 
  }

  @override
  void dispose() {
    // Stop services when the user logs out
    _locationService.stopLocationUpdates();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return const MainNavigationScreen();
  }
}

import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:spaktok/core/firebase_options.dart';
import 'package:spaktok/spaktok/theme/app_theme.dart';
import 'package:spaktok/spaktok/screens/main_navigation_screen.dart';
import 'package:spaktok/screens/auth/login_screen.dart';
import 'package:spaktok/screens/auth/signup_screen.dart' show SignUpScreen;
import 'package:spaktok/screens/auth/forgot_password_screen.dart';
import 'package:spaktok/screens/appearance_settings_screen.dart';
import 'package:spaktok/spaktok/screens/settings_screen.dart';
import 'package:spaktok/screens/notifications_screen.dart';
import 'package:spaktok/screens/search_screen.dart';
import 'package:spaktok/spaktok/screens/buy_coins_screen.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/services/call_service.dart';
import 'package:spaktok/services/location_service.dart';
import 'package:spaktok/services/theme_service.dart';
import 'package:spaktok/services/chat_background_service.dart';

/// التطبيق الرئيسي مع جميع التكاملات
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // تهيئة Firebase
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // تهيئة Stripe
  Stripe.publishableKey = const String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
    defaultValue: 'pk_test_your_key_here',
  );
  await Stripe.instance.applySettings();

  // تهيئة الخدمات
  final themeService = ThemeService();
  final chatBgService = ChatBackgroundService();

  await themeService.init();
  await chatBgService.init();

  runApp(
    MyApp(
      themeService: themeService,
      chatBgService: chatBgService,
    ),
  );
}

class MyApp extends StatelessWidget {
  final ThemeService themeService;
  final ChatBackgroundService chatBgService;

  const MyApp({
    super.key,
    required this.themeService,
    required this.chatBgService,
  });

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: themeService),
        ChangeNotifierProvider.value(value: chatBgService),
      ],
      child: Consumer<ThemeService>(
        builder: (context, themeService, child) {
          return MaterialApp(
            title: 'Spaktok',
            debugShowCheckedModeBanner: false,

            // Dual theme system: Pure White & Vantablack + Electric Blue
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeService.themeMode,

            home: const AuthWrapper(),

            // Named Routes for all primary screens
            routes: {
              '/login': (context) => const LoginScreen(),
              '/signup': (context) => const SignUpScreen(),
              '/forgot-password': (context) => const ForgotPasswordScreen(),
              '/settings': (context) => const SettingsScreen(),
              '/appearance': (context) => const AppearanceSettingsScreen(),
              '/notifications': (context) => const NotificationsScreen(),
              '/search': (context) => const SearchScreen(),
              '/buy-coins': (context) => const BuyCoinsScreen(),
              // Note: Gifts screen requires parameters, use Navigator.push with arguments
            },
          );
        },
      ),
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
          return const Scaffold(
              body: Center(child: CircularProgressIndicator()));
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

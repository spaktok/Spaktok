import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:spaktok/core/firebase_options.dart';
import 'package:spaktok/spaktok/theme/app_theme.dart';
import 'package:spaktok/spaktok/screens/main_navigation_screen.dart';
import 'package:spaktok/screens/create_duet_screen.dart';
import 'package:spaktok/screens/stitch_editor_screen.dart';
import 'package:spaktok/screens/world_ar_screen.dart';
import 'package:spaktok/screens/auth/login_screen.dart';
import 'package:spaktok/screens/auth/signup_screen.dart' show SignUpScreen;
import 'package:spaktok/screens/auth/forgot_password_screen.dart';
import 'package:spaktok/screens/appearance_settings_screen.dart';
import 'package:spaktok/screens/theme_selection_screen.dart';
import 'package:spaktok/spaktok/screens/settings_screen.dart';
import 'package:spaktok/screens/notifications_screen.dart';
import 'package:spaktok/screens/search_screen.dart';
import 'package:spaktok/spaktok/screens/buy_coins_screen.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/services/call_service.dart';
import 'package:spaktok/services/location_service.dart';
import 'package:spaktok/services/theme_service.dart';
import 'package:spaktok/services/app_theme_service.dart';
import 'package:spaktok/services/chat_background_service.dart';
import 'package:spaktok/core/theme_mode.dart';

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

  // Initialize services
  final themeService = ThemeService();
  final appThemeService = AppThemeService();
  final chatBgService = ChatBackgroundService();

  await themeService.init();
  await appThemeService.initialize();
  await chatBgService.init();

  runApp(
    MyApp(
      themeService: themeService,
      appThemeService: appThemeService,
      chatBgService: chatBgService,
    ),
  );
}

class MyApp extends StatelessWidget {
  final ThemeService themeService;
  final AppThemeService appThemeService;
  final ChatBackgroundService chatBgService;

  const MyApp({
    super.key,
    required this.themeService,
    required this.appThemeService,
    required this.chatBgService,
  });

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: themeService),
        ChangeNotifierProvider.value(value: appThemeService),
        ChangeNotifierProvider.value(value: chatBgService),
      ],
      child: Consumer<AppThemeService>(
        builder: (context, appTheme, child) {
          // Enable UI preview mode by passing --dart-define=PREVIEW_UI=true
          final previewMode =
              const bool.fromEnvironment('PREVIEW_UI', defaultValue: false);

          // Select theme based on current mode
          ThemeData selectedTheme;
          switch (appTheme.currentTheme) {
            case AppThemeMode.light:
              selectedTheme = AppTheme.lightTheme;
              break;
            case AppThemeMode.dark:
              selectedTheme = AppTheme.darkTheme;
              break;
            case AppThemeMode.anime:
              selectedTheme = AppTheme.animeTheme;
              break;
          }

          return MaterialApp(
            title: 'Spaktok',
            debugShowCheckedModeBanner: false,

            // Triple theme system: Light, Dark, and Anime
            theme: selectedTheme,
            themeMode: ThemeMode
                .light, // Always light since we handle theme selection manually

            home: previewMode ? const _PreviewHubScreen() : const AuthWrapper(),

            // Named Routes for all primary screens
            routes: {
              '/login': (context) => const LoginScreen(),
              '/signup': (context) => const SignUpScreen(),
              '/forgot-password': (context) => const ForgotPasswordScreen(),
              '/settings': (context) => const SettingsScreen(),
              '/appearance': (context) => const AppearanceSettingsScreen(),
              '/theme-selection': (context) => const ThemeSelectionScreen(),
              '/notifications': (context) => const NotificationsScreen(),
              '/search': (context) => const SearchScreen(),
              '/buy-coins': (context) => const BuyCoinsScreen(),
              // Preview routes
              '/preview/duet': (context) =>
                  const CreateDuetScreen(originalVideoId: 'demo'),
              '/preview/stitch': (context) =>
                  const StitchEditorScreen(originalVideoId: 'demo'),
              '/preview/ar': (context) => const WorldARScreen(),
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

// Simple developer hub to preview new UI screens without backend wiring
class _PreviewHubScreen extends StatelessWidget {
  const _PreviewHubScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF101317),
      appBar: AppBar(
        title: const Text('Preview Hub'),
        backgroundColor: const Color(0xFF1A1F24),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _tile(
              context,
              title: 'Create Duet',
              subtitle: 'Split view, effects bar, record controls',
              route: '/preview/duet',
              icon: Icons.view_sidebar_outlined,
            ),
            const SizedBox(height: 12),
            _tile(
              context,
              title: 'Stitch Editor',
              subtitle: 'Timeline range selector, clips, preview',
              route: '/preview/stitch',
              icon: Icons.movie_edit,
            ),
            const SizedBox(height: 12),
            _tile(
              context,
              title: 'World AR',
              subtitle: 'Model carousel, place, scale, capture',
              route: '/preview/ar',
              icon: Icons.view_in_ar,
            ),
            const Spacer(),
            const Text(
              'Tip: Run with --dart-define=PREVIEW_UI=true to boot into this hub.',
              style: TextStyle(color: Colors.white54),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _tile(BuildContext context,
      {required String title,
      required String subtitle,
      required String route,
      required IconData icon}) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, route),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1F252B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white12),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF232A31),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600)),
                  const SizedBox(height: 4),
                  Text(subtitle,
                      style:
                          const TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white70),
          ],
        ),
      ),
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

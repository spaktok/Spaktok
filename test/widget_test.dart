import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:spaktok/main.dart';
import 'package:spaktok/screens/main_navigation_screen.dart';
import 'package:spaktok/screens/explore_screen.dart';
import 'package:spaktok/screens/camera_screen.dart';
import 'package:spaktok/screens/story_screen.dart';
import 'package:spaktok/screens/reel_screen.dart';
import 'package:spaktok/screens/live_stream_screen.dart';

void main() {
  group('Spaktok App Tests', () {
    testWidgets('App should start with MainNavigationScreen', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      // Verify that MainNavigationScreen is displayed
      expect(find.byType(MainNavigationScreen), findsOneWidget);
    });

    testWidgets('Bottom navigation should have 5 items', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      // Find the BottomNavigationBar
      expect(find.byType(BottomNavigationBar), findsOneWidget);
      
      // Check for navigation items
      expect(find.text('Explore'), findsOneWidget);
      expect(find.text('Reels'), findsOneWidget);
      expect(find.text('Create'), findsOneWidget);
      expect(find.text('Stories'), findsOneWidget);
      expect(find.text('Live'), findsOneWidget);
    });

    testWidgets('Should navigate between screens', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      // Tap on Reels tab
      await tester.tap(find.text('Reels'));
      await tester.pumpAndSettle();
      
      // Verify ReelScreen is displayed
      expect(find.byType(ReelScreen), findsOneWidget);
      
      // Tap on Create tab
      await tester.tap(find.text('Create'));
      await tester.pumpAndSettle();
      
      // Verify CameraScreen is displayed
      expect(find.byType(CameraScreen), findsOneWidget);
    });

    testWidgets('Drawer should open and close', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      // Open drawer
      await tester.tap(find.byIcon(Icons.menu));
      await tester.pumpAndSettle();
      
      // Verify drawer items
      expect(find.text('Profile'), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
      expect(find.text('Favorites'), findsOneWidget);
      
      // Close drawer
      await tester.tap(find.byIcon(Icons.arrow_back));
      await tester.pumpAndSettle();
    });

    testWidgets('FloatingActionButton should be visible on Explore screen', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      // Should be on Explore screen by default
      expect(find.byType(FloatingActionButton), findsOneWidget);
      
      // Navigate to another screen
      await tester.tap(find.text('Reels'));
      await tester.pumpAndSettle();
      
      // FloatingActionButton should not be visible
      expect(find.byType(FloatingActionButton), findsNothing);
    });
  });

  group('Screen Tests', () {
    testWidgets('ExploreScreen should display correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: const ExploreScreen(),
        ),
      );
      
      expect(find.byType(ExploreScreen), findsOneWidget);
    });

    testWidgets('CameraScreen should display correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: const CameraScreen(),
        ),
      );
      
      expect(find.byType(CameraScreen), findsOneWidget);
      expect(find.text('Camera & Filters'), findsOneWidget);
    });

    testWidgets('StoryScreen should display correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: const StoryScreen(),
        ),
      );
      
      expect(find.byType(StoryScreen), findsOneWidget);
    });

    testWidgets('ReelScreen should display correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: const ReelScreen(),
        ),
      );
      
      expect(find.byType(ReelScreen), findsOneWidget);
    });

    testWidgets('LiveStreamScreen should display correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: const LiveStreamScreen(),
        ),
      );
      
      expect(find.byType(LiveStreamScreen), findsOneWidget);
    });
  });

  group('Theme Tests', () {
    testWidgets('App should use dark theme by default', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      final MaterialApp app = tester.widget(find.byType(MaterialApp));
      expect(app.themeMode, ThemeMode.dark);
    });

    testWidgets('App should have proper theme configuration', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      final MaterialApp app = tester.widget(find.byType(MaterialApp));
      expect(app.theme, isNotNull);
      expect(app.darkTheme, isNotNull);
    });
  });

  group('Localization Tests', () {
    testWidgets('App should support multiple locales', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      final MaterialApp app = tester.widget(find.byType(MaterialApp));
      expect(app.supportedLocales.length, greaterThan(180));
    });

    testWidgets('App should have localization delegates', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      final MaterialApp app = tester.widget(find.byType(MaterialApp));
      expect(app.localizationsDelegates, isNotNull);
      expect(app.localizationsDelegates!.length, greaterThan(0));
    });
  });
}

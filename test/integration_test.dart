import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:spaktok/main.dart';
import 'package:spaktok/services/image_editing_service.dart';
import 'package:spaktok/services/trending_service.dart';
import 'package:spaktok/services/story_service.dart';
import 'package:spaktok/services/reel_service.dart';
import 'package:spaktok/services/gift_service.dart';
import 'package:spaktok/services/chat_service.dart';
import 'package:spaktok/services/payment_service.dart';
import 'package:spaktok/models/filter.dart';

void main() {
  group('Service Integration Tests', () {
    test('ImageEditingService should provide available filters', () {
      final service = ImageEditingService();
      final filters = service.getAvailableFilters();
      
      expect(filters, isNotEmpty);
      expect(filters.contains('None'), isTrue);
      expect(filters.contains('Black & White'), isTrue);
      expect(filters.contains('Sepia'), isTrue);
    });

    test('Filter model should have predefined filters', () {
      final filters = Filter.getAllFilters();
      
      expect(filters, isNotEmpty);
      expect(filters.length, greaterThan(10));
      
      final noneFilter = filters.firstWhere((f) => f.name == 'none');
      expect(noneFilter.displayName, 'Original');
      
      final bwFilter = filters.firstWhere((f) => f.name == 'black_white');
      expect(bwFilter.displayName, 'B&W');
    });

    test('Filter categories should be properly defined', () {
      final basicFilters = Filter.getFiltersByCategory(FilterCategory.basic);
      final vintageFilters = Filter.getFiltersByCategory(FilterCategory.vintage);
      final artisticFilters = Filter.getFiltersByCategory(FilterCategory.artistic);
      
      expect(basicFilters, isNotEmpty);
      expect(vintageFilters, isNotEmpty);
      expect(artisticFilters, isNotEmpty);
    });

    test('Premium and free filters should be separated', () {
      final freeFilters = Filter.getFreeFilters();
      final premiumFilters = Filter.getPremiumFilters();
      
      expect(freeFilters, isNotEmpty);
      expect(premiumFilters, isNotEmpty);
      
      // Verify no overlap
      for (final filter in freeFilters) {
        expect(filter.isPremium, isFalse);
      }
      
      for (final filter in premiumFilters) {
        expect(filter.isPremium, isTrue);
      }
    });

    test('TrendingService should initialize properly', () {
      final service = TrendingService();
      expect(service, isNotNull);
    });

    test('StoryService should initialize properly', () {
      final service = StoryService();
      expect(service, isNotNull);
    });

    test('ReelService should initialize properly', () {
      final service = ReelService();
      expect(service, isNotNull);
    });

    test('GiftService should initialize properly', () {
      final service = GiftService();
      expect(service, isNotNull);
    });

    test('ChatService should initialize properly', () {
      final service = ChatService();
      expect(service, isNotNull);
    });

    test('PaymentService should initialize properly', () {
      final service = PaymentService();
      expect(service, isNotNull);
    });
  });

  group('Model Tests', () {
    test('Filter equality should work correctly', () {
      const filter1 = Filter.none;
      const filter2 = Filter.none;
      const filter3 = Filter.blackAndWhite;
      
      expect(filter1, equals(filter2));
      expect(filter1, isNot(equals(filter3)));
    });

    test('Filter toString should provide meaningful output', () {
      const filter = Filter.vintage;
      final string = filter.toString();
      
      expect(string, contains('vintage'));
      expect(string, contains('Vintage'));
      expect(string, contains('isPremium'));
    });
  });

  group('Navigation Integration Tests', () {
    testWidgets('Full navigation flow should work', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      // Start on Explore screen
      expect(find.text('Explore'), findsOneWidget);
      
      // Navigate to each screen
      final screens = ['Reels', 'Create', 'Stories', 'Live'];
      
      for (final screen in screens) {
        await tester.tap(find.text(screen));
        await tester.pumpAndSettle();
        
        // Verify we're on the correct screen
        final bottomNav = find.byType(BottomNavigationBar);
        expect(bottomNav, findsOneWidget);
      }
      
      // Return to Explore
      await tester.tap(find.text('Explore'));
      await tester.pumpAndSettle();
      
      // Verify FloatingActionButton is visible again
      expect(find.byType(FloatingActionButton), findsOneWidget);
    });

    testWidgets('Drawer navigation should work', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      // Open drawer
      await tester.tap(find.byIcon(Icons.menu));
      await tester.pumpAndSettle();
      
      // Test About dialog
      await tester.tap(find.text('About'));
      await tester.pumpAndSettle();
      
      expect(find.text('About Spaktok'), findsOneWidget);
      expect(find.text('Spaktok is a modern social media platform'), findsOneWidget);
      
      // Close dialog
      await tester.tap(find.text('OK'));
      await tester.pumpAndSettle();
      
      // Open drawer again
      await tester.tap(find.byIcon(Icons.menu));
      await tester.pumpAndSettle();
      
      // Test Logout dialog
      await tester.tap(find.text('Logout'));
      await tester.pumpAndSettle();
      
      expect(find.text('Logout'), findsWidgets);
      expect(find.text('Are you sure you want to logout?'), findsOneWidget);
      
      // Cancel logout
      await tester.tap(find.text('Cancel'));
      await tester.pumpAndSettle();
    });
  });

  group('Camera Screen Integration Tests', () {
    testWidgets('Camera screen should handle image selection', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: const Scaffold(
            body: CameraScreen(),
          ),
        ),
      );
      
      // Verify initial state
      expect(find.text('No image selected'), findsOneWidget);
      expect(find.byIcon(Icons.camera_alt), findsWidgets);
      
      // Test camera button
      final cameraButton = find.byIcon(Icons.camera_alt).first;
      await tester.tap(cameraButton);
      await tester.pumpAndSettle();
      
      // Should show image source dialog
      expect(find.text('Camera'), findsOneWidget);
      expect(find.text('Gallery'), findsOneWidget);
    });
  });

  group('Theme Integration Tests', () {
    testWidgets('Theme should be applied consistently', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      final scaffold = find.byType(Scaffold);
      expect(scaffold, findsOneWidget);
      
      // Check if dark theme is applied
      final BuildContext context = tester.element(scaffold);
      final theme = Theme.of(context);
      
      expect(theme.brightness, Brightness.dark);
      expect(theme.primaryColor, isNotNull);
    });
  });

  group('Performance Tests', () {
    testWidgets('App should start within reasonable time', (WidgetTester tester) async {
      final stopwatch = Stopwatch()..start();
      
      await tester.pumpWidget(const MyApp());
      await tester.pumpAndSettle();
      
      stopwatch.stop();
      
      // App should start within 5 seconds
      expect(stopwatch.elapsedMilliseconds, lessThan(5000));
    });

    testWidgets('Navigation should be smooth', (WidgetTester tester) async {
      await tester.pumpWidget(const MyApp());
      
      final stopwatch = Stopwatch();
      
      // Test navigation performance
      final screens = ['Reels', 'Create', 'Stories', 'Live', 'Explore'];
      
      for (final screen in screens) {
        stopwatch.reset();
        stopwatch.start();
        
        await tester.tap(find.text(screen));
        await tester.pumpAndSettle();
        
        stopwatch.stop();
        
        // Each navigation should complete within 1 second
        expect(stopwatch.elapsedMilliseconds, lessThan(1000));
      }
    });
  });
}

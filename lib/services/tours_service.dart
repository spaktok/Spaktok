import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class TourStep {
  final String title;
  final String description;
  final IconData icon;
  final String? imageUrl;
  final GlobalKey? targetKey;
  final Offset? targetPosition;

  TourStep({
    required this.title,
    required this.description,
    required this.icon,
    this.imageUrl,
    this.targetKey,
    this.targetPosition,
  });
}

class Tour {
  final String id;
  final String name;
  final String description;
  final List<TourStep> steps;

  Tour({
    required this.id,
    required this.name,
    required this.description,
    required this.steps,
  });
}

class ToursService {
  static ToursService? _instance;
  static ToursService get instance {
    _instance ??= ToursService._();
    return _instance!;
  }

  ToursService._();

  static const String _tourCompletedPrefix = 'tour_completed_';

  // Check if a tour has been completed
  Future<bool> isTourCompleted(String tourId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('$_tourCompletedPrefix$tourId') ?? false;
    } catch (e) {
      return false;
    }
  }

  // Mark a tour as completed
  Future<void> markTourCompleted(String tourId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('$_tourCompletedPrefix$tourId', true);
    } catch (e) {
      debugPrint('Error marking tour as completed: $e');
    }
  }

  // Reset a tour
  Future<void> resetTour(String tourId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_tourCompletedPrefix$tourId');
    } catch (e) {
      debugPrint('Error resetting tour: $e');
    }
  }

  // Reset all tours
  Future<void> resetAllTours() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      for (var key in keys) {
        if (key.startsWith(_tourCompletedPrefix)) {
          await prefs.remove(key);
        }
      }
    } catch (e) {
      debugPrint('Error resetting all tours: $e');
    }
  }

  // Get welcome tour
  Tour getWelcomeTour() {
    return Tour(
      id: 'welcome',
      name: 'Welcome to Spaktok',
      description: 'Let\'s take a quick tour of the app',
      steps: [
        TourStep(
          title: 'Welcome!',
          description: 'Welcome to Spaktok! Let\'s show you around.',
          icon: Icons.waving_hand,
        ),
        TourStep(
          title: 'Home Feed',
          description: 'Discover amazing content from creators around the world.',
          icon: Icons.home,
        ),
        TourStep(
          title: 'Go Live',
          description: 'Start your own live stream and connect with your audience.',
          icon: Icons.videocam,
        ),
        TourStep(
          title: 'Messages',
          description: 'Chat with friends and send photos, videos, and more.',
          icon: Icons.message,
        ),
        TourStep(
          title: 'Profile',
          description: 'Customize your profile and manage your content.',
          icon: Icons.person,
        ),
      ],
    );
  }

  // Get camera tour
  Tour getCameraTour() {
    return Tour(
      id: 'camera',
      name: 'Camera Features',
      description: 'Learn how to use the camera and filters',
      steps: [
        TourStep(
          title: 'Camera',
          description: 'Take photos and videos with our advanced camera.',
          icon: Icons.camera_alt,
        ),
        TourStep(
          title: 'Filters',
          description: 'Apply beautiful filters to enhance your photos and videos.',
          icon: Icons.filter,
        ),
        TourStep(
          title: 'Effects',
          description: 'Add fun effects and stickers to your content.',
          icon: Icons.auto_awesome,
        ),
        TourStep(
          title: 'Edit',
          description: 'Edit your photos with professional tools.',
          icon: Icons.edit,
        ),
        TourStep(
          title: 'Share',
          description: 'Share your creations with the world!',
          icon: Icons.share,
        ),
      ],
    );
  }

  // Get live streaming tour
  Tour getLiveStreamingTour() {
    return Tour(
      id: 'live_streaming',
      name: 'Live Streaming',
      description: 'Learn how to go live and engage with viewers',
      steps: [
        TourStep(
          title: 'Start Streaming',
          description: 'Tap the camera icon to start your live stream.',
          icon: Icons.play_circle_fill,
        ),
        TourStep(
          title: 'Stream Settings',
          description: 'Set your stream title and description.',
          icon: Icons.settings,
        ),
        TourStep(
          title: 'Interact',
          description: 'Read and respond to viewer comments in real-time.',
          icon: Icons.chat_bubble,
        ),
        TourStep(
          title: 'Gifts',
          description: 'Viewers can send you virtual gifts during your stream.',
          icon: Icons.card_giftcard,
        ),
        TourStep(
          title: 'End Stream',
          description: 'When you\'re done, tap the end button to finish your stream.',
          icon: Icons.stop_circle,
        ),
      ],
    );
  }

  // Get chat tour
  Tour getChatTour() {
    return Tour(
      id: 'chat',
      name: 'Chat Features',
      description: 'Discover all the messaging features',
      steps: [
        TourStep(
          title: 'Messages',
          description: 'Send text messages, photos, and videos to your friends.',
          icon: Icons.message,
        ),
        TourStep(
          title: 'Camera Background',
          description: 'Enable camera background in settings for a unique chat experience.',
          icon: Icons.camera,
        ),
        TourStep(
          title: 'Voice & Video Calls',
          description: 'Make high-quality voice and video calls.',
          icon: Icons.video_call,
        ),
        TourStep(
          title: 'Media Sharing',
          description: 'Share photos, videos, and other media easily.',
          icon: Icons.photo_library,
        ),
        TourStep(
          title: 'Privacy',
          description: 'Control who can message you in your privacy settings.',
          icon: Icons.privacy_tip,
        ),
      ],
    );
  }

  // Get all available tours
  List<Tour> getAllTours() {
    return [
      getWelcomeTour(),
      getCameraTour(),
      getLiveStreamingTour(),
      getChatTour(),
    ];
  }

  // Show tour if not completed
  Future<bool> shouldShowTour(String tourId) async {
    return !(await isTourCompleted(tourId));
  }
}

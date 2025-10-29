import 'package:flutter/material.dart';
import 'package:spaktok/screens/reel_screen.dart';
import 'package:spaktok/screens/map_screen.dart'; // Import MapScreen
import 'package:spaktok/screens/enhanced_camera_screen.dart';
import 'package:spaktok/screens/notifications_screen.dart';
import 'package:spaktok/screens/profile_screen.dart';
import 'package:spaktok/screens/story_screen.dart';
import 'package:spaktok/screens/start_stream_screen.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/screens/auth/login_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  final PageController _pageController = PageController();
  final AuthService _authService = AuthService();

  // Add MapScreen to the list of screens
  final List<Widget> _screens = [
    const ReelScreen(),
    const MapScreen(), 
    const EnhancedCameraScreen(),
    const NotificationsScreen(),
    const ProfileScreen(),
  ];

  void _onItemTapped(int index) {
    _pageController.jumpToPage(index);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) => setState(() => _currentIndex = index),
        children: _screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.black,
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.grey[600],
        showSelectedLabels: false,
        showUnselectedLabels: false,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.map_outlined), label: 'Map'), // Map Icon
          BottomNavigationBarItem(icon: Icon(Icons.add_box_rounded), label: 'Create'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline_rounded), label: 'Chat'), // Changed to Chat
          BottomNavigationBarItem(icon: Icon(Icons.person_outline_rounded), label: 'Profile'),
        ],
      ),
      // Drawer is no longer needed if we have a dedicated chat screen
    );
  }
}

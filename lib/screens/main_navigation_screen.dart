import 'package:flutter/material.dart';
import 'package:spaktok/screens/live_stream_screen.dart';
import 'package:spaktok/screens/explore_screen.dart';
import 'package:spaktok/screens/enhanced_camera_screen.dart';
import 'package:spaktok/screens/story_screen.dart';
import 'package:spaktok/screens/reel_screen.dart';
import 'package:spaktok/screens/chat_screen.dart';
import 'package:spaktok/screens/profile_screen.dart';
import 'package:spaktok/screens/settings_screen.dart';
import 'package:spaktok/screens/notifications_screen.dart';
import 'package:spaktok/screens/search_screen.dart';
import 'package:spaktok/screens/gifts_screen.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/screens/admin_premium_accounts_screen.dart';
import 'package:spaktok/screens/friend_list_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({Key? key}) : super(key: key);

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;
  final PageController _pageController = PageController();
  final AuthService _authService = AuthService();
  bool _isAdmin = false;

  final List<Widget> _screens = [
    const ExploreScreen(),
    const SearchScreen(),
    const EnhancedCameraScreen(),
    const NotificationsScreen(),
    const ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    _loadAdminStatus();
  }

  Future<void> _loadAdminStatus() async {
    final currentUser = _authService.currentUser;
    if (currentUser != null) {
      final userData = await _authService.getUserData(currentUser.uid);
      if (userData != null && userData["isAdmin"] == true) {
        setState(() {
          _isAdmin = true;
        });
      }
    }
  }

  final List<BottomNavigationBarItem> _navItems = [
    const BottomNavigationBarItem(
      icon: Icon(Icons.home_outlined),
      activeIcon: Icon(Icons.home),
      label: 'Home',
    ),
    const BottomNavigationBarItem(
      icon: Icon(Icons.search_outlined),
      activeIcon: Icon(Icons.search),
      label: 'Search',
    ),
    const BottomNavigationBarItem(
      icon: Icon(Icons.add_circle_outline),
      activeIcon: Icon(Icons.add_circle),
      label: 'Create',
    ),
    const BottomNavigationBarItem(
      icon: Icon(Icons.notifications_outlined),
      activeIcon: Icon(Icons.notifications),
      label: 'Notifications',
    ),
    const BottomNavigationBarItem(
      icon: Icon(Icons.person_outline),
      activeIcon: Icon(Icons.person),
      label: 'Profile',
    ),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Colors.black.withOpacity(0.8),
              Colors.black,
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: Theme.of(context).primaryColor.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: SafeArea(
          child: BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: _onItemTapped,
            type: BottomNavigationBarType.fixed,
            backgroundColor: Colors.transparent,
            selectedItemColor: Theme.of(context).primaryColor,
            unselectedItemColor: Colors.grey,
            elevation: 0,
            selectedFontSize: 12,
            unselectedFontSize: 12,
            items: _navItems,
          ),
        ),
      ),
      drawer: _buildDrawer(),
    );
  }

  Widget _buildDrawer() {
    return Drawer(
      backgroundColor: Colors.grey[900],
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Theme.of(context).primaryColor,
                  Theme.of(context).primaryColor.withOpacity(0.7),
                ],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white,
                  child: Icon(
                    Icons.person,
                    size: 40,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  _authService.currentUser?.displayName ?? 'Spaktok User',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  '@${_authService.currentUser?.email?.split('@')[0] ?? 'user'}',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          _buildDrawerItem(
            icon: Icons.person,
            title: 'Profile',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ProfileScreen()),
              );
            },
          ),
          _buildDrawerItem(
            icon: Icons.video_library,
            title: 'Reels',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ReelScreen()),
              );
            },
          ),
          _buildDrawerItem(
            icon: Icons.auto_stories,
            title: 'Stories',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const StoryScreen()),
              );
            },
          ),
          _buildDrawerItem(
            icon: Icons.live_tv,
            title: 'Live Streams',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const LiveStreamScreen()),
              );
            },
          ),
          _buildDrawerItem(
            icon: Icons.chat,
            title: 'Messages',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const ChatScreen(receiverId: 'default', receiverName: 'Chat')),
              );
            },
          ),
          _buildDrawerItem(
            icon: Icons.people,
            title: 'Friends',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const FriendListScreen()),
              );
            },
          ),
          _buildDrawerItem(
            icon: Icons.card_giftcard,
            title: 'Gifts',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const GiftsScreen()),
              );
            },
          ),
          if (_isAdmin)
            _buildDrawerItem(
              icon: Icons.admin_panel_settings,
              title: 'Manage Premium Accounts',
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const AdminPremiumAccountsScreen()),
                );
              },
            ),
          const Divider(color: Colors.grey),
          _buildDrawerItem(
            icon: Icons.settings,
            title: 'Settings',
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const SettingsScreen()),
              );
            },
          ),
          _buildDrawerItem(
            icon: Icons.favorite,
            title: 'Favorites',
            onTap: () {
              Navigator.pop(context);
              // Navigate to favorites
            },
          ),
          _buildDrawerItem(
            icon: Icons.history,
            title: 'Watch History',
            onTap: () {
              Navigator.pop(context);
              // Navigate to history
            },
          ),
          _buildDrawerItem(
            icon: Icons.download,
            title: 'Downloads',
            onTap: () {
              Navigator.pop(context);
              // Navigate to downloads
            },
          ),
          const Divider(color: Colors.grey),
          _buildDrawerItem(
            icon: Icons.help,
            title: 'Help & Support',
            onTap: () {
              Navigator.pop(context);
              // Navigate to help
            },
          ),
          _buildDrawerItem(
            icon: Icons.info,
            title: 'About',
            onTap: () {
              Navigator.pop(context);
              _showAboutDialog();
            },
          ),
          _buildDrawerItem(
            icon: Icons.logout,
            title: 'Logout',
            onTap: () {
              Navigator.pop(context);
              _showLogoutDialog();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white),
      ),
      onTap: onTap,
    );
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Colors.grey[900],
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Column(
            children: [
              Icon(
                Icons.app_shortcut,
                size: 60,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(height: 10),
              const Text(
                'Spaktok',
                style: TextStyle(color: Colors.white),
              ),
            ],
          ),
          content: const Text(
            'Spaktok is a modern social media platform with live streaming, stories, reels, advanced camera features, and much more.\n\nVersion 1.0.0',
            style: TextStyle(color: Colors.white70),
            textAlign: TextAlign.center,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'OK',
                style: TextStyle(color: Theme.of(context).primaryColor),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Colors.grey[900],
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text(
            'Logout',
            style: TextStyle(color: Colors.white),
          ),
          content: const Text(
            'Are you sure you want to logout?',
            style: TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancel',
                style: TextStyle(color: Colors.grey),
              ),
            ),
            TextButton(
              onPressed: () async {
                await _authService.signOut();
                if (mounted) {
                  Navigator.pop(context);
                  // Navigate to login screen
                }
              },
              child: Text(
                'Logout',
                style: TextStyle(color: Theme.of(context).primaryColor),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}

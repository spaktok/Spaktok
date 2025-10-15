import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
<<<<<<< HEAD
import 'package:spaktok_frontend/firebase_options.dart';
import 'package:spaktok_frontend/theme/app_theme.dart';
import 'package:spaktok_frontend/screens/home_feed_screen.dart'; // Assuming this is the main screen
=======
import 'firebase_options.dart';
import 'package:spaktok_frontend/screens/movie_list_screen.dart';
import 'package:spaktok_frontend/screens/user_list_screen.dart';
import 'package:spaktok_frontend/screens/chat_screen.dart';
>>>>>>> feature/full-implementation

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
<<<<<<< HEAD
  ThemeMode _themeMode = ThemeMode.dark; // Default to dark theme

  void _toggleTheme(bool isDark) {
    setState(() {
      _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
=======
  int _selectedIndex = 0;

  static const List<Widget> _widgetOptions = <Widget>[
    MovieListScreen(),
    UserListScreen(),
    ChatScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
>>>>>>> feature/full-implementation
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Spaktok',
<<<<<<< HEAD
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
=======
      home: Scaffold(
        appBar: AppBar(title: const Text('Spaktok Frontend 🚀')),
        body: Center(
          child: _widgetOptions.elementAt(_selectedIndex),
        ),
        bottomNavigationBar: BottomNavigationBar(
          items: const <BottomNavigationBarItem>[
            BottomNavigationBarItem(
              icon: Icon(Icons.movie),
              label: 'Movies',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.people),
              label: 'Users',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.chat),
              label: 'Chat',
            ),
          ],
          currentIndex: _selectedIndex,
          selectedItemColor: Colors.amber[800],
          onTap: _onItemTapped,
        ),
>>>>>>> feature/full-implementation
      ),
    );
  }
}


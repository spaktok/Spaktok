import 'package:flutter/material.dart';
import 'package:spaktok/services/tours_service.dart';


class ToursScreen extends StatefulWidget {
  const ToursScreen({Key? key}) : super(key: key);

  @override
  State<ToursScreen> createState() => _ToursScreenState();
}

class _ToursScreenState extends State<ToursScreen> {
  final ToursService _toursService = ToursService();
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<Map<String, dynamic>> _tourSteps = [
    {
      'title': 'Welcome to Spaktok!',
      'description': 'Discover a new way to connect, create, and share with the world.',
      'icon': Icons.waving_hand,
      'color': Colors.purple,
      'features': [
        'Live Streaming',
        'Stories & Reels',
        'Advanced Filters',
        'Virtual Gifts',
      ],
    },
    {
      'title': 'Create Amazing Content',
      'description': 'Use our advanced camera with filters, effects, and beauty tools to create stunning photos and videos.',
      'icon': Icons.camera_alt,
      'color': Colors.blue,
      'features': [
        'Professional Filters',
        'Beauty Effects',
        'AR Stickers',
        'Music Integration',
      ],
    },
    {
      'title': 'Go Live & Connect',
      'description': 'Start live streaming and interact with your audience in real-time.',
      'icon': Icons.live_tv,
      'color': Colors.red,
      'features': [
        'HD Live Streaming',
        'Real-time Chat',
        'Virtual Gifts',
        'Multi-guest Support',
      ],
    },
    {
      'title': 'Discover & Explore',
      'description': 'Find trending content, follow creators, and discover new communities.',
      'icon': Icons.explore,
      'color': Colors.orange,
      'features': [
        'Personalized Feed',
        'Trending Hashtags',
        'Suggested Users',
        'Smart Search',
      ],
    },
    {
      'title': 'Send Gifts & Support',
      'description': 'Show appreciation to your favorite creators by sending virtual gifts.',
      'icon': Icons.card_giftcard,
      'color': Colors.pink,
      'features': [
        'Virtual Currency',
        'Exclusive Gifts',
        'Leaderboards',
        'Rewards System',
      ],
    },
    {
      'title': 'Stay Safe & Private',
      'description': 'Your privacy and safety are our top priorities.',
      'icon': Icons.security,
      'color': Colors.green,
      'features': [
        'Privacy Controls',
        'Content Moderation',
        'Reporting System',
        'Blocked Users',
      ],
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          _buildBackground(),
          SafeArea(
            child: Column(
              children: [
                _buildHeader(),
                Expanded(
                  child: PageView.builder(
                    controller: _pageController,
                    onPageChanged: (index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    itemCount: _tourSteps.length,
                    itemBuilder: (context, index) {
                      return _buildTourPage(_tourSteps[index]);
                    },
                  ),
                ),
                _buildPageIndicator(),
                _buildNavigationButtons(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBackground() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            _tourSteps[_currentPage]['color'].withOpacity(0.3),
            Colors.black,
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'App Tour',
            style: TextStyle(
              color: _tourSteps[_currentPage]['color'],
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text(
              'Skip',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTourPage(Map<String, dynamic> step) {
    return Padding(
      padding: const EdgeInsets.all(30),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              color: step['color'].withOpacity(0.2),
              shape: BoxShape.circle,
              border: Border.all(
                color: step['color'],
                width: 3,
              ),
              boxShadow: [
                BoxShadow(
                  color: step['color'].withOpacity(0.5),
                  blurRadius: 30,
                  spreadRadius: 10,
                ),
              ],
            ),
            child: Icon(
              step['icon'],
              size: 80,
              color: step['color'],
            ),
          ),
          const SizedBox(height: 40),
          Text(
            step['title'],
            style: const TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          Text(
            step['description'],
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 16,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          _buildFeaturesList(step['features'], step['color']),
        ],
      ),
    );
  }

  Widget _buildFeaturesList(List<String> features, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Column(
        children: features.map((feature) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Icon(
                  Icons.check_circle,
                  color: color,
                  size: 20,
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: Text(
                    feature,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                    ),
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPageIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        _tourSteps.length,
        (index) => Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          width: _currentPage == index ? 30 : 8,
          height: 8,
          decoration: BoxDecoration(
            color: _currentPage == index
                ? _tourSteps[_currentPage]['color']
                : Colors.grey[700],
            borderRadius: BorderRadius.circular(4),
          ),
        ),
      ),
    );
  }

  Widget _buildNavigationButtons() {
    return Padding(
      padding: const EdgeInsets.all(30),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (_currentPage > 0)
            ElevatedButton(
              onPressed: () {
                _pageController.previousPage(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey[800],
                padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Row(
                children: [
                  Icon(Icons.arrow_back, size: 20),
                  SizedBox(width: 5),
                  Text('Back'),
                ],
              ),
            )
          else
            const SizedBox(width: 100),
          ElevatedButton(
            onPressed: () {
              if (_currentPage < _tourSteps.length - 1) {
                _pageController.nextPage(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                );
              } else {
                _toursService.completeTour('app_intro');
                Navigator.pop(context);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _tourSteps[_currentPage]['color'],
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: Row(
              children: [
                Text(_currentPage < _tourSteps.length - 1 ? 'Next' : 'Get Started'),
                const SizedBox(width: 5),
                Icon(
                  _currentPage < _tourSteps.length - 1
                      ? Icons.arrow_forward
                      : Icons.check,
                  size: 20,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}

import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

class ProfileScreen extends StatefulWidget {
  final String? userId;

  const ProfileScreen({Key? key, this.userId}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> with SingleTickerProviderStateMixin {
  final AuthService _authService = AuthService();
  late TabController _tabController;
  bool _isFollowing = false;
  int _followersCount = 0;
  int _followingCount = 0;
  int _postsCount = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    // Load profile data from Firestore
    final userId = widget.userId ?? _authService.currentUser?.uid;
    if (userId != null) {
      final doc = await FirebaseFirestore.instance.collection('users').doc(userId).get();
      if (doc.exists) {
        setState(() {
          _followersCount = doc.data()?['followersCount'] ?? 0;
          _followingCount = doc.data()?['followingCount'] ?? 0;
          _postsCount = doc.data()?['postsCount'] ?? 0;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isOwnProfile = widget.userId == null || widget.userId == _authService.currentUser?.uid;
    
    return Scaffold(
      backgroundColor: Colors.black,
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(context, isOwnProfile),
          SliverToBoxAdapter(
            child: Column(
              children: [
                _buildProfileInfo(context, isOwnProfile),
                _buildStatsRow(context),
                _buildActionButtons(context, isOwnProfile),
                _buildBioSection(context),
                const SizedBox(height: 20),
              ],
            ),
          ),
          _buildTabBar(context),
          _buildTabBarView(context),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar(BuildContext context, bool isOwnProfile) {
    return SliverAppBar(
      expandedHeight: 200,
      pinned: true,
      backgroundColor: Colors.black,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Theme.of(context).primaryColor.withOpacity(0.8),
                Colors.black,
              ],
            ),
          ),
        ),
      ),
      actions: [
        if (isOwnProfile)
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              // Navigate to settings
            },
          ),
        IconButton(
          icon: const Icon(Icons.more_vert),
          onPressed: () {
            _showMoreOptions(context, isOwnProfile);
          },
        ),
      ],
    );
  }

  Widget _buildProfileInfo(BuildContext context, bool isOwnProfile) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Stack(
            children: [
              Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Theme.of(context).primaryColor,
                    width: 3,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Theme.of(context).primaryColor.withOpacity(0.5),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: const CircleAvatar(
                  radius: 60,
                  backgroundColor: Colors.grey,
                  child: Icon(Icons.person, size: 60, color: Colors.white),
                ),
              ),
              if (isOwnProfile)
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: GestureDetector(
                    onTap: () {
                      // Change profile picture
                    },
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Theme.of(context).primaryColor,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.black, width: 2),
                      ),
                      child: const Icon(Icons.camera_alt, size: 20, color: Colors.white),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            _authService.currentUser?.displayName ?? 'Spaktok User',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            '@${_authService.currentUser?.email?.split('@')[0] ?? 'username'}',
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildStatItem(context, _postsCount.toString(), 'Posts'),
          _buildStatItem(context, _formatCount(_followersCount), 'Followers'),
          _buildStatItem(context, _formatCount(_followingCount), 'Following'),
        ],
      ),
    );
  }

  Widget _buildStatItem(BuildContext context, String count, String label) {
    return GestureDetector(
      onTap: () {
        // Navigate to detailed stats
      },
      child: Column(
        children: [
          Text(
            count,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            label,
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context, bool isOwnProfile) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Row(
        children: [
          if (isOwnProfile) ...[
            Expanded(
              child: _buildButton(
                context,
                'Edit Profile',
                Icons.edit,
                () {
                  // Navigate to edit profile
                },
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildButton(
                context,
                'Share Profile',
                Icons.share,
                () {
                  // Share profile
                },
              ),
            ),
          ] else ...[
            Expanded(
              child: _buildButton(
                context,
                _isFollowing ? 'Following' : 'Follow',
                _isFollowing ? Icons.check : Icons.person_add,
                () {
                  setState(() {
                    _isFollowing = !_isFollowing;
                    _followersCount += _isFollowing ? 1 : -1;
                  });
                },
                isPrimary: !_isFollowing,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _buildButton(
                context,
                'Message',
                Icons.message,
                () {
                  // Navigate to chat
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildButton(BuildContext context, String text, IconData icon, VoidCallback onPressed, {bool isPrimary = false}) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 18),
      label: Text(text),
      style: ElevatedButton.styleFrom(
        backgroundColor: isPrimary ? Theme.of(context).primaryColor : Colors.grey[800],
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }

  Widget _buildBioSection(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Bio',
            style: TextStyle(
              color: Colors.grey[400],
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            '✨ Content Creator | Live Streamer\n🎥 Making amazing content every day\n🌍 Connecting people worldwide',
            style: TextStyle(
              color: Colors.white,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar(BuildContext context) {
    return SliverPersistentHeader(
      pinned: true,
      delegate: _SliverAppBarDelegate(
        TabBar(
          controller: _tabController,
          indicatorColor: Theme.of(context).primaryColor,
          labelColor: Theme.of(context).primaryColor,
          unselectedLabelColor: Colors.grey,
          tabs: const [
            Tab(icon: Icon(Icons.grid_on)),
            Tab(icon: Icon(Icons.video_library)),
            Tab(icon: Icon(Icons.live_tv)),
            Tab(icon: Icon(Icons.favorite)),
          ],
        ),
      ),
    );
  }

  Widget _buildTabBarView(BuildContext context) {
    return SliverFillRemaining(
      child: TabBarView(
        controller: _tabController,
        children: [
          _buildPostsGrid(context),
          _buildVideosGrid(context),
          _buildLiveGrid(context),
          _buildLikesGrid(context),
        ],
      ),
    );
  }

  Widget _buildPostsGrid(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: 20,
      itemBuilder: (context, index) {
        return Container(
          color: Colors.grey[900],
          child: Center(
            child: Icon(
              Icons.image,
              color: Colors.grey[700],
              size: 40,
            ),
          ),
        );
      },
    );
  }

  Widget _buildVideosGrid(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: 15,
      itemBuilder: (context, index) {
        return Container(
          color: Colors.grey[900],
          child: Center(
            child: Icon(
              Icons.play_circle_outline,
              color: Colors.grey[700],
              size: 40,
            ),
          ),
        );
      },
    );
  }

  Widget _buildLiveGrid(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
        childAspectRatio: 0.75,
      ),
      itemCount: 10,
      itemBuilder: (context, index) {
        return Container(
          color: Colors.grey[900],
          child: Stack(
            children: [
              Center(
                child: Icon(
                  Icons.live_tv,
                  color: Colors.grey[700],
                  size: 40,
                ),
              ),
              Positioned(
                top: 10,
                left: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'LIVE',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildLikesGrid(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(2),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 2,
        mainAxisSpacing: 2,
      ),
      itemCount: 25,
      itemBuilder: (context, index) {
        return Container(
          color: Colors.grey[900],
          child: Center(
            child: Icon(
              Icons.favorite,
              color: Colors.grey[700],
              size: 40,
            ),
          ),
        );
      },
    );
  }

  void _showMoreOptions(BuildContext context, bool isOwnProfile) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (!isOwnProfile) ...[
                ListTile(
                  leading: const Icon(Icons.block, color: Colors.red),
                  title: const Text('Block User', style: TextStyle(color: Colors.white)),
                  onTap: () {
                    Navigator.pop(context);
                    // Block user
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.report, color: Colors.orange),
                  title: const Text('Report User', style: TextStyle(color: Colors.white)),
                  onTap: () {
                    Navigator.pop(context);
                    // Report user
                  },
                ),
              ],
              ListTile(
                leading: const Icon(Icons.link, color: Colors.white),
                title: const Text('Copy Profile Link', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  // Copy link
                },
              ),
              ListTile(
                leading: const Icon(Icons.qr_code, color: Colors.white),
                title: const Text('Show QR Code', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  // Show QR code
                },
              ),
            ],
          ),
        );
      },
    );
  }

  String _formatCount(int count) {
    if (count >= 1000000) {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    } else if (count >= 1000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    }
    return count.toString();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.black,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}

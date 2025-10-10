import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

/// Smart Notifications & Discovery Engine
/// - AI-driven feed personalization (For You / Following tabs)
/// - Intelligent notifications for likes, comments, mentions, and rankings
/// - Trending algorithm with tag, sound, and region-based discovery
/// - Behavioral analysis for user engagement optimization
/// - Map-based global discovery (optional)
class DiscoveryEngineScreen extends StatefulWidget {
  final String userId;

  const DiscoveryEngineScreen({
    Key? key,
    required this.userId,
  }) : super(key: key);

  @override
  State<DiscoveryEngineScreen> createState() => _DiscoveryEngineScreenState();
}

class _DiscoveryEngineScreenState extends State<DiscoveryEngineScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Feed state
  List<ContentItem> _forYouFeed = [];
  List<ContentItem> _followingFeed = [];
  List<TrendingItem> _trendingTags = [];
  List<TrendingItem> _trendingSounds = [];
  List<TrendingItem> _trendingRegions = [];

  // Notifications state
  List<NotificationItem> _notifications = [];
  int _unreadCount = 0;

  // User behavior tracking
  Map<String, double> _userInterests = {};
  Map<String, int> _engagementHistory = {};
  DateTime? _lastActiveTime;

  // Discovery filters
  String _selectedRegion = 'Global';
  String _selectedCategory = 'All';
  List<String> _regions = ['Global', 'North America', 'Europe', 'Asia', 'Middle East', 'Africa', 'South America'];
  List<String> _categories = ['All', 'Music', 'Dance', 'Comedy', 'Sports', 'Education', 'Gaming', 'Food', 'Travel'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _initializeDiscoveryEngine();
  }

  Future<void> _initializeDiscoveryEngine() async {
    await Future.wait([
      _loadUserBehavior(),
      _loadForYouFeed(),
      _loadFollowingFeed(),
      _loadTrendingContent(),
      _loadNotifications(),
    ]);
    _startBehaviorTracking();
  }

  Future<void> _loadUserBehavior() async {
    try {
      final behaviorDoc = await _firestore
          .collection('user_behavior')
          .doc(widget.userId)
          .get();

      if (behaviorDoc.exists) {
        final data = behaviorDoc.data()!;
        setState(() {
          _userInterests = Map<String, double>.from(data['interests'] ?? {});
          _engagementHistory = Map<String, int>.from(data['engagementHistory'] ?? {});
          _lastActiveTime = (data['lastActiveTime'] as Timestamp?)?.toDate();
        });
      }
    } catch (e) {
      debugPrint('Error loading user behavior: $e');
    }
  }

  Future<void> _loadForYouFeed() async {
    try {
      // AI-driven personalized feed based on user interests and behavior
      final feedSnapshot = await _firestore
          .collection('content')
          .where('isPublic', isEqualTo: true)
          .orderBy('engagementScore', descending: true)
          .limit(50)
          .get();

      List<ContentItem> items = feedSnapshot.docs
          .map((doc) => ContentItem.fromFirestore(doc))
          .toList();

      // Apply AI ranking algorithm
      items = _applyAIRanking(items);

      setState(() {
        _forYouFeed = items;
      });
    } catch (e) {
      debugPrint('Error loading For You feed: $e');
    }
  }

  List<ContentItem> _applyAIRanking(List<ContentItem> items) {
    // Calculate personalized score for each item based on:
    // 1. User interests match
    // 2. Engagement history
    // 3. Content freshness
    // 4. Creator popularity
    // 5. Trending signals

    for (var item in items) {
      double score = 0.0;

      // Interest match (40% weight)
      double interestScore = 0.0;
      for (var tag in item.tags) {
        interestScore += _userInterests[tag] ?? 0.0;
      }
      score += interestScore * 0.4;

      // Engagement history (20% weight)
      int previousEngagement = _engagementHistory[item.creatorId] ?? 0;
      score += (previousEngagement / 100.0) * 0.2;

      // Freshness (15% weight)
      final hoursSincePost = DateTime.now().difference(item.timestamp).inHours;
      double freshnessScore = max(0, 1 - (hoursSincePost / 48.0));
      score += freshnessScore * 0.15;

      // Creator popularity (15% weight)
      double popularityScore = min(1.0, item.creatorFollowers / 10000.0);
      score += popularityScore * 0.15;

      // Trending signals (10% weight)
      double trendingScore = min(1.0, item.engagementScore / 1000.0);
      score += trendingScore * 0.1;

      item.personalizedScore = score;
    }

    // Sort by personalized score
    items.sort((a, b) => b.personalizedScore.compareTo(a.personalizedScore));
    return items;
  }

  Future<void> _loadFollowingFeed() async {
    try {
      // Get list of followed users
      final followingSnapshot = await _firestore
          .collection('users')
          .doc(widget.userId)
          .collection('following')
          .get();

      final followingIds = followingSnapshot.docs.map((doc) => doc.id).toList();

      if (followingIds.isEmpty) {
        setState(() {
          _followingFeed = [];
        });
        return;
      }

      // Load content from followed users
      final feedSnapshot = await _firestore
          .collection('content')
          .where('creatorId', whereIn: followingIds.take(10).toList())
          .orderBy('timestamp', descending: true)
          .limit(50)
          .get();

      setState(() {
        _followingFeed = feedSnapshot.docs
            .map((doc) => ContentItem.fromFirestore(doc))
            .toList();
      });
    } catch (e) {
      debugPrint('Error loading Following feed: $e');
    }
  }

  Future<void> _loadTrendingContent() async {
    try {
      // Load trending tags
      final tagsSnapshot = await _firestore
          .collection('trending')
          .doc('tags')
          .collection('items')
          .orderBy('score', descending: true)
          .limit(20)
          .get();

      // Load trending sounds
      final soundsSnapshot = await _firestore
          .collection('trending')
          .doc('sounds')
          .collection('items')
          .orderBy('score', descending: true)
          .limit(20)
          .get();

      // Load trending regions
      final regionsSnapshot = await _firestore
          .collection('trending')
          .doc('regions')
          .collection('items')
          .orderBy('score', descending: true)
          .limit(10)
          .get();

      setState(() {
        _trendingTags = tagsSnapshot.docs
            .map((doc) => TrendingItem.fromFirestore(doc))
            .toList();
        _trendingSounds = soundsSnapshot.docs
            .map((doc) => TrendingItem.fromFirestore(doc))
            .toList();
        _trendingRegions = regionsSnapshot.docs
            .map((doc) => TrendingItem.fromFirestore(doc))
            .toList();
      });
    } catch (e) {
      debugPrint('Error loading trending content: $e');
    }
  }

  Future<void> _loadNotifications() async {
    try {
      final notificationsSnapshot = await _firestore
          .collection('users')
          .doc(widget.userId)
          .collection('notifications')
          .orderBy('timestamp', descending: true)
          .limit(100)
          .get();

      final notifications = notificationsSnapshot.docs
          .map((doc) => NotificationItem.fromFirestore(doc))
          .toList();

      setState(() {
        _notifications = notifications;
        _unreadCount = notifications.where((n) => !n.isRead).length;
      });
    } catch (e) {
      debugPrint('Error loading notifications: $e');
    }
  }

  void _startBehaviorTracking() {
    // Track user behavior every 30 seconds
    Timer.periodic(const Duration(seconds: 30), (timer) {
      _updateUserBehavior();
    });
  }

  Future<void> _updateUserBehavior() async {
    try {
      await _firestore
          .collection('user_behavior')
          .doc(widget.userId)
          .set({
        'interests': _userInterests,
        'engagementHistory': _engagementHistory,
        'lastActiveTime': FieldValue.serverTimestamp(),
        'sessionDuration': DateTime.now().difference(_lastActiveTime ?? DateTime.now()).inMinutes,
      }, SetOptions(merge: true));
    } catch (e) {
      debugPrint('Error updating user behavior: $e');
    }
  }

  void _trackContentView(ContentItem item) {
    // Update user interests
    for (var tag in item.tags) {
      _userInterests[tag] = (_userInterests[tag] ?? 0.0) + 0.1;
    }

    // Update engagement history
    _engagementHistory[item.creatorId] = (_engagementHistory[item.creatorId] ?? 0) + 1;

    // Update content engagement score
    _firestore.collection('content').doc(item.id).update({
      'views': FieldValue.increment(1),
      'engagementScore': FieldValue.increment(1),
    });
  }

  void _trackContentInteraction(ContentItem item, String interactionType) {
    // Update user interests with higher weight
    for (var tag in item.tags) {
      double weight = interactionType == 'like' ? 0.5 : interactionType == 'share' ? 0.7 : 0.3;
      _userInterests[tag] = (_userInterests[tag] ?? 0.0) + weight;
    }

    // Update engagement history
    _engagementHistory[item.creatorId] = (_engagementHistory[item.creatorId] ?? 0) + 5;

    // Update content engagement score
    int scoreIncrement = interactionType == 'like' ? 5 : interactionType == 'share' ? 10 : 3;
    _firestore.collection('content').doc(item.id).update({
      interactionType: FieldValue.increment(1),
      'engagementScore': FieldValue.increment(scoreIncrement),
    });
  }

  Future<void> _markNotificationAsRead(NotificationItem notification) async {
    try {
      await _firestore
          .collection('users')
          .doc(widget.userId)
          .collection('notifications')
          .doc(notification.id)
          .update({'isRead': true});

      setState(() {
        notification.isRead = true;
        _unreadCount = max(0, _unreadCount - 1);
      });
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  Future<void> _markAllNotificationsAsRead() async {
    try {
      final batch = _firestore.batch();
      for (var notification in _notifications.where((n) => !n.isRead)) {
        batch.update(
          _firestore
              .collection('users')
              .doc(widget.userId)
              .collection('notifications')
              .doc(notification.id),
          {'isRead': true},
        );
      }
      await batch.commit();

      setState(() {
        for (var notification in _notifications) {
          notification.isRead = true;
        }
        _unreadCount = 0;
      });
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
    }
  }

  Widget _buildForYouTab() {
    if (_forYouFeed.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF00C6FF)),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadForYouFeed,
      color: const Color(0xFF00C6FF),
      child: ListView.builder(
        itemCount: _forYouFeed.length,
        itemBuilder: (context, index) {
          final item = _forYouFeed[index];
          return _buildContentCard(item);
        },
      ),
    );
  }

  Widget _buildFollowingTab() {
    if (_followingFeed.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.people_outline, size: 64, color: Colors.white54),
            const SizedBox(height: 16),
            const Text(
              'No content from followed users',
              style: TextStyle(color: Colors.white54, fontSize: 16),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                // Navigate to discover users
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C6FF),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Discover Users'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadFollowingFeed,
      color: const Color(0xFF00C6FF),
      child: ListView.builder(
        itemCount: _followingFeed.length,
        itemBuilder: (context, index) {
          final item = _followingFeed[index];
          return _buildContentCard(item);
        },
      ),
    );
  }

  Widget _buildContentCard(ContentItem item) {
    return GestureDetector(
      onTap: () {
        _trackContentView(item);
        // Navigate to content detail
      },
      child: Container(
        margin: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF0A0A0A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF00C6FF).withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Creator info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 20,
                    backgroundColor: Color(0xFF00C6FF),
                    child: Icon(Icons.person, color: Colors.white),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.creatorName,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          _formatTime(item.timestamp),
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.more_vert, color: Colors.white),
                    onPressed: () {
                      // Show options
                    },
                  ),
                ],
              ),
            ),

            // Content preview
            if (item.thumbnailUrl != null)
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black,
                    image: DecorationImage(
                      image: NetworkImage(item.thumbnailUrl!),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.5),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.play_arrow,
                        color: Colors.white,
                        size: 48,
                      ),
                    ),
                  ),
                ),
              ),

            // Content description
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.description,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: item.tags.take(3).map((tag) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00C6FF).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          '#$tag',
                          style: const TextStyle(
                            color: Color(0xFF00C6FF),
                            fontSize: 12,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

            // Engagement stats
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  _buildEngagementButton(
                    icon: Icons.favorite_border,
                    count: item.likes,
                    onTap: () => _trackContentInteraction(item, 'like'),
                  ),
                  const SizedBox(width: 24),
                  _buildEngagementButton(
                    icon: Icons.comment_outlined,
                    count: item.comments,
                    onTap: () => _trackContentInteraction(item, 'comment'),
                  ),
                  const SizedBox(width: 24),
                  _buildEngagementButton(
                    icon: Icons.share_outlined,
                    count: item.shares,
                    onTap: () => _trackContentInteraction(item, 'share'),
                  ),
                  const Spacer(),
                  Text(
                    '${item.views} views',
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEngagementButton({
    required IconData icon,
    required int count,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(width: 4),
          Text(
            _formatCount(count),
            style: const TextStyle(color: Colors.white, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildTrendingTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Region filter
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _regions.map((region) {
                final isSelected = region == _selectedRegion;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(region),
                    selected: isSelected,
                    onSelected: (selected) {
                      setState(() {
                        _selectedRegion = region;
                      });
                    },
                    backgroundColor: const Color(0xFF0A0A0A),
                    selectedColor: const Color(0xFF00C6FF),
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.white54,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 24),

          // Trending Tags
          const Text(
            'Trending Tags',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _buildTrendingList(_trendingTags, TrendingType.tag),

          const SizedBox(height: 24),

          // Trending Sounds
          const Text(
            'Trending Sounds',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _buildTrendingList(_trendingSounds, TrendingType.sound),

          const SizedBox(height: 24),

          // Trending Regions
          const Text(
            'Trending Regions',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _buildTrendingList(_trendingRegions, TrendingType.region),
        ],
      ),
    );
  }

  Widget _buildTrendingList(List<TrendingItem> items, TrendingType type) {
    if (items.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Text(
            'No trending items',
            style: TextStyle(color: Colors.white54),
          ),
        ),
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return _buildTrendingTile(item, index + 1, type);
      },
    );
  }

  Widget _buildTrendingTile(TrendingItem item, int rank, TrendingType type) {
    IconData icon;
    switch (type) {
      case TrendingType.tag:
        icon = Icons.tag;
        break;
      case TrendingType.sound:
        icon = Icons.music_note;
        break;
      case TrendingType.region:
        icon = Icons.location_on;
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0A0A),
        borderRadius: BorderRadius.circular(12),
        border: rank <= 3
            ? Border.all(color: const Color(0xFF00C6FF), width: 2)
            : null,
      ),
      child: Row(
        children: [
          // Rank
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: rank <= 3
                  ? const LinearGradient(
                      colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
                    )
                  : null,
              color: rank > 3 ? Colors.white.withOpacity(0.1) : null,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '#$rank',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: rank <= 3 ? 14 : 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),

          const SizedBox(width: 16),

          // Icon
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFF00C6FF).withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(0xFF00C6FF), size: 20),
          ),

          const SizedBox(width: 12),

          // Name and stats
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_formatCount(item.usageCount)} uses',
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
          ),

          // Trending indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              children: [
                const Icon(Icons.trending_up, color: Colors.white, size: 16),
                const SizedBox(width: 4),
                Text(
                  '+${item.growthRate.toStringAsFixed(0)}%',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationsTab() {
    return Column(
      children: [
        // Header with mark all as read
        if (_unreadCount > 0)
          Container(
            padding: const EdgeInsets.all(16),
            color: const Color(0xFF0A0A0A),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '$_unreadCount unread notifications',
                  style: const TextStyle(color: Colors.white, fontSize: 14),
                ),
                TextButton(
                  onPressed: _markAllNotificationsAsRead,
                  child: const Text(
                    'Mark all as read',
                    style: TextStyle(color: Color(0xFF00C6FF)),
                  ),
                ),
              ],
            ),
          ),

        // Notifications list
        Expanded(
          child: _notifications.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.notifications_none, size: 64, color: Colors.white54),
                      SizedBox(height: 16),
                      Text(
                        'No notifications yet',
                        style: TextStyle(color: Colors.white54, fontSize: 16),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  itemCount: _notifications.length,
                  itemBuilder: (context, index) {
                    return _buildNotificationTile(_notifications[index]);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildNotificationTile(NotificationItem notification) {
    IconData icon;
    Color iconColor;

    switch (notification.type) {
      case NotificationType.like:
        icon = Icons.favorite;
        iconColor = Colors.red;
        break;
      case NotificationType.comment:
        icon = Icons.comment;
        iconColor = Colors.blue;
        break;
      case NotificationType.mention:
        icon = Icons.alternate_email;
        iconColor = Colors.purple;
        break;
      case NotificationType.follow:
        icon = Icons.person

_add;
        iconColor = Colors.green;
        break;
      case NotificationType.gift:
        icon = Icons.card_giftcard;
        iconColor = Colors.orange;
        break;
      case NotificationType.ranking:
        icon = Icons.emoji_events;
        iconColor = const Color(0xFF00C6FF);
        break;
      default:
        icon = Icons.notifications;
        iconColor = Colors.grey;
    }

    return GestureDetector(
      onTap: () {
        _markNotificationAsRead(notification);
        // Navigate to relevant content
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: notification.isRead
              ? const Color(0xFF0A0A0A)
              : const Color(0xFF00C6FF).withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: notification.isRead
                ? Colors.transparent
                : const Color(0xFF00C6FF).withOpacity(0.3),
          ),
        ),
        child: Row(
          children: [
            // Icon
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: iconColor, size: 24),
            ),

            const SizedBox(width: 16),

            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: notification.isRead
                          ? FontWeight.normal
                          : FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.message,
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _formatTime(notification.timestamp),
                    style: const TextStyle(
                      color: Colors.white38,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

            // Unread indicator
            if (!notification.isRead)
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Color(0xFF00C6FF),
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return '${timestamp.day}/${timestamp.month}/${timestamp.year}';
    }
  }

  String _formatCount(int count) {
    if (count < 1000) {
      return count.toString();
    } else if (count < 1000000) {
      return '${(count / 1000).toStringAsFixed(1)}K';
    } else {
      return '${(count / 1000000).toStringAsFixed(1)}M';
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        title: const Text('Discover', style: TextStyle(color: Colors.white)),
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, color: Colors.white),
                onPressed: () {
                  _tabController.animateTo(3);
                },
              ),
              if (_unreadCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      _unreadCount > 99 ? '99+' : _unreadCount.toString(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.search, color: Colors.white),
            onPressed: () {
              // Navigate to search
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF00C6FF),
          labelColor: const Color(0xFF00C6FF),
          unselectedLabelColor: Colors.white54,
          tabs: const [
            Tab(text: 'For You'),
            Tab(text: 'Following'),
            Tab(text: 'Trending'),
            Tab(text: 'Notifications'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildForYouTab(),
          _buildFollowingTab(),
          _buildTrendingTab(),
          _buildNotificationsTab(),
        ],
      ),
    );
  }
}

// ========== DATA MODELS ==========

class ContentItem {
  final String id;
  final String creatorId;
  final String creatorName;
  final int creatorFollowers;
  final String description;
  final String? thumbnailUrl;
  final List<String> tags;
  final DateTime timestamp;
  final int likes;
  final int comments;
  final int shares;
  final int views;
  final double engagementScore;
  double personalizedScore;

  ContentItem({
    required this.id,
    required this.creatorId,
    required this.creatorName,
    required this.creatorFollowers,
    required this.description,
    this.thumbnailUrl,
    required this.tags,
    required this.timestamp,
    required this.likes,
    required this.comments,
    required this.shares,
    required this.views,
    required this.engagementScore,
    this.personalizedScore = 0.0,
  });

  factory ContentItem.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ContentItem(
      id: doc.id,
      creatorId: data['creatorId'] ?? '',
      creatorName: data['creatorName'] ?? 'Unknown',
      creatorFollowers: data['creatorFollowers'] ?? 0,
      description: data['description'] ?? '',
      thumbnailUrl: data['thumbnailUrl'],
      tags: List<String>.from(data['tags'] ?? []),
      timestamp: (data['timestamp'] as Timestamp).toDate(),
      likes: data['likes'] ?? 0,
      comments: data['comments'] ?? 0,
      shares: data['shares'] ?? 0,
      views: data['views'] ?? 0,
      engagementScore: (data['engagementScore'] ?? 0.0).toDouble(),
    );
  }
}

enum TrendingType {
  tag,
  sound,
  region,
}

class TrendingItem {
  final String id;
  final String name;
  final int usageCount;
  final double growthRate;
  final double score;

  TrendingItem({
    required this.id,
    required this.name,
    required this.usageCount,
    required this.growthRate,
    required this.score,
  });

  factory TrendingItem.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return TrendingItem(
      id: doc.id,
      name: data['name'] ?? '',
      usageCount: data['usageCount'] ?? 0,
      growthRate: (data['growthRate'] ?? 0.0).toDouble(),
      score: (data['score'] ?? 0.0).toDouble(),
    );
  }
}

enum NotificationType {
  like,
  comment,
  mention,
  follow,
  gift,
  ranking,
  system,
}

class NotificationItem {
  final String id;
  final NotificationType type;
  final String title;
  final String message;
  final DateTime timestamp;
  bool isRead;
  final String? relatedUserId;
  final String? relatedContentId;

  NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.timestamp,
    required this.isRead,
    this.relatedUserId,
    this.relatedContentId,
  });

  factory NotificationItem.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return NotificationItem(
      id: doc.id,
      type: NotificationType.values[data['type'] ?? 0],
      title: data['title'] ?? '',
      message: data['message'] ?? '',
      timestamp: (data['timestamp'] as Timestamp).toDate(),
      isRead: data['isRead'] ?? false,
      relatedUserId: data['relatedUserId'],
      relatedContentId: data['relatedContentId'],
    );
  }
}

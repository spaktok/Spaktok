import 'package:flutter/material.dart';
import '../services/challenge_service.dart';

class ChallengesScreen extends StatefulWidget {
  const ChallengesScreen({Key? key}) : super(key: key);

  @override
  State<ChallengesScreen> createState() => _ChallengesScreenState();
}

class _ChallengesScreenState extends State<ChallengesScreen>
    with SingleTickerProviderStateMixin {
  final ChallengeService _challengeService = ChallengeService();
  late TabController _tabController;
  List<Map<String, dynamic>> _trendingChallenges = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadTrendingChallenges();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadTrendingChallenges() async {
    setState(() => _isLoading = true);
    try {
      final challenges = await _challengeService.getTrendingChallenges(limit: 30);
      setState(() {
        _trendingChallenges = challenges;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading challenges: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        title: const Text(
          'Challenges',
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: Colors.white),
            onPressed: () => _showCreateChallengeDialog(),
          ),
          IconButton(
            icon: const Icon(Icons.search, color: Colors.white),
            onPressed: () async {
              final controller = TextEditingController();
              final query = await showDialog<String>(
                context: context,
                builder: (_) => AlertDialog(
                  backgroundColor: Colors.grey[900],
                  title: const Text('Search challenges', style: TextStyle(color: Colors.white)),
                  content: TextField(
                    controller: controller,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(hintText: 'Search by hashtag or title'),
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                    ElevatedButton(onPressed: () => Navigator.pop(context, controller.text.trim()), child: const Text('Search')),
                  ],
                ),
              );
              if (query != null && query.isNotEmpty) {
                final results = await _challengeService.searchChallenges(query);
                setState(() => _trendingChallenges = results);
              }
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.purple,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.grey,
          tabs: const [
            Tab(text: 'Trending 🔥'),
            Tab(text: 'My Challenges'),
            Tab(text: 'Completed'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildTrendingTab(),
          _buildMyChallengesTab(),
          _buildCompletedTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateChallengeDialog(),
        backgroundColor: Colors.purple,
        icon: const Icon(Icons.add),
        label: const Text('Create Challenge'),
      ),
    );
  }

  Widget _buildTrendingTab() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.purple),
      );
    }

    if (_trendingChallenges.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.emoji_events, size: 80, color: Colors.grey),
            const SizedBox(height: 16),
            const Text(
              'No challenges yet',
              style: TextStyle(color: Colors.white, fontSize: 18),
            ),
            const SizedBox(height: 8),
            const Text(
              'Be the first to create one!',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadTrendingChallenges,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _trendingChallenges.length,
        itemBuilder: (context, index) {
          final challenge = _trendingChallenges[index];
          return _buildChallengeCard(challenge);
        },
      ),
    );
  }

  Widget _buildMyChallengesTab() {
    return const Center(
      child: Text(
        'My Challenges',
        style: TextStyle(color: Colors.white),
      ),
    );
  }

  Widget _buildCompletedTab() {
    return const Center(
      child: Text(
        'Completed Challenges',
        style: TextStyle(color: Colors.white),
      ),
    );
  }

  Widget _buildChallengeCard(Map<String, dynamic> challenge) {
    return Card(
      color: Colors.grey[900],
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: () {
          showDialog(
            context: context,
            builder: (_) => AlertDialog(
              backgroundColor: Colors.grey[900],
              title: Text(challenge['title'] ?? '', style: const TextStyle(color: Colors.white)),
              content: Text(challenge['description'] ?? '', style: const TextStyle(color: Colors.white70)),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
              ],
            ),
          );
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Colors.purple, Colors.pink],
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '#${challenge['hashtag'] ?? ''}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const Spacer(),
                  const Icon(Icons.trending_up, color: Colors.orange, size: 20),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                challenge['title'] ?? '',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                challenge['description'] ?? '',
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 14,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  _buildStatChip(
                    Icons.people,
                    '${challenge['participantCount'] ?? 0}',
                    'Participants',
                  ),
                  const SizedBox(width: 12),
                  _buildStatChip(
                    Icons.visibility,
                    '${challenge['viewCount'] ?? 0}',
                    'Views',
                  ),
                  const SizedBox(width: 12),
                  _buildStatChip(
                    Icons.favorite,
                    '${challenge['likeCount'] ?? 0}',
                    'Likes',
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    // For demo: join with placeholder user and post id
                    await _challengeService.joinChallenge(
                      challenge['id'],
                      'demo_user',
                      'demo_post',
                    );
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Joined challenge!')),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purple,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Join Challenge',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatChip(IconData icon, String value, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.grey[800],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  void _showCreateChallengeDialog() {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();
    final hashtagController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.grey[900],
        title: const Text(
          'Create Challenge',
          style: TextStyle(color: Colors.white),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Challenge Title',
                  labelStyle: TextStyle(color: Colors.grey),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.purple),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descriptionController,
                style: const TextStyle(color: Colors.white),
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  labelStyle: TextStyle(color: Colors.grey),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.purple),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: hashtagController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  labelText: 'Hashtag (without #)',
                  labelStyle: TextStyle(color: Colors.grey),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.purple),
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () async {
              if (titleController.text.isNotEmpty &&
                  descriptionController.text.isNotEmpty &&
                  hashtagController.text.isNotEmpty) {
                try {
                  await _challengeService.createChallenge(
                    title: titleController.text,
                    description: descriptionController.text,
                    creatorId: 'current_user_id', // TODO: Get from auth
                    hashtag: hashtagController.text,
                  );
                  if (mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Challenge created successfully!'),
                      ),
                    );
                    _loadTrendingChallenges();
                  }
                } catch (e) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error: $e')),
                    );
                  }
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.purple,
            ),
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

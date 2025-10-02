import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';


class SearchScreen extends StatefulWidget {
  const SearchScreen({Key? key}) : super(key: key);

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  String _selectedFilter = 'All';

  final List<String> _filters = ['All', 'Users', 'Videos', 'Live', 'Hashtags'];

  final List<Map<String, dynamic>> _trendingHashtags = [
    {'tag': '#viral', 'posts': '1.2M', 'color': Colors.red},
    {'tag': '#trending', 'posts': '890K', 'color': Colors.orange},
    {'tag': '#fyp', 'posts': '2.5M', 'color': Colors.purple},
    {'tag': '#dance', 'posts': '650K', 'color': Colors.blue},
    {'tag': '#music', 'posts': '1.8M', 'color': Colors.green},
    {'tag': '#comedy', 'posts': '420K', 'color': Colors.yellow},
  ];

  final List<Map<String, dynamic>> _suggestedUsers = [
    {'name': 'John Doe', 'username': '@johndoe', 'followers': '125K', 'isVerified': true},
    {'name': 'Jane Smith', 'username': '@janesmith', 'followers': '89K', 'isVerified': false},
    {'name': 'Mike Johnson', 'username': '@mikej', 'followers': '250K', 'isVerified': true},
    {'name': 'Sarah Williams', 'username': '@sarahw', 'followers': '45K', 'isVerified': false},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchBar(context),
            if (_isSearching) _buildFilters(context),
            Expanded(
              child: _isSearching ? _buildSearchResults(context) : _buildDiscoverContent(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      child: TextField(
        controller: _searchController,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: 'Search users, videos, hashtags...',
          hintStyle: TextStyle(color: Colors.grey[600]),
          prefixIcon: const Icon(Icons.search, color: Colors.white),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, color: Colors.white),
                  onPressed: () {
                    setState(() {
                      _searchController.clear();
                      _isSearching = false;
                    });
                  },
                )
              : null,
          filled: true,
          fillColor: Colors.grey[900],
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 20),
        ),
        onChanged: (value) {
          setState(() {
            _isSearching = value.isNotEmpty;
          });
        },
      ),
    );
  }

  Widget _buildFilters(BuildContext context) {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 15),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _filters.length,
        itemBuilder: (context, index) {
          final filter = _filters[index];
          final isSelected = _selectedFilter == filter;
          
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedFilter = filter;
              });
            },
            child: Container(
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(
                color: isSelected ? Theme.of(context).primaryColor : Colors.grey[900],
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Text(
                  filter,
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.grey[400],
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSearchResults(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(15),
      children: [
        if (_selectedFilter == 'All' || _selectedFilter == 'Users') ...[
          _buildSectionHeader(context, 'Users'),
          ..._suggestedUsers.map((user) => _buildUserItem(context, user)).toList(),
        ],
        if (_selectedFilter == 'All' || _selectedFilter == 'Videos') ...[
          const SizedBox(height: 20),
          _buildSectionHeader(context, 'Videos'),
          _buildVideosGrid(context),
        ],
        if (_selectedFilter == 'All' || _selectedFilter == 'Hashtags') ...[
          const SizedBox(height: 20),
          _buildSectionHeader(context, 'Hashtags'),
          ..._trendingHashtags.map((tag) => _buildHashtagItem(context, tag)).toList(),
        ],
      ],
    );
  }

  Widget _buildDiscoverContent(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(15),
      children: [
        _buildSectionHeader(context, 'Trending Hashtags'),
        const SizedBox(height: 10),
        _buildHashtagsGrid(context),
        const SizedBox(height: 30),
        _buildSectionHeader(context, 'Suggested Users'),
        const SizedBox(height: 10),
        ..._suggestedUsers.map((user) => _buildUserItem(context, user)).toList(),
        const SizedBox(height: 30),
        _buildSectionHeader(context, 'Popular Videos'),
        const SizedBox(height: 10),
        _buildVideosGrid(context),
      ],
    );
  }

  Widget _buildSectionHeader(BuildContext context, String title) {
    return Text(
      title,
      style: const TextStyle(
        color: Colors.white,
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildHashtagsGrid(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 2,
      ),
      itemCount: _trendingHashtags.length,
      itemBuilder: (context, index) {
        final tag = _trendingHashtags[index];
        return Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                tag['color'].withOpacity(0.3),
                Colors.grey[900]!,
              ],
            ),
            borderRadius: BorderRadius.circular(15),
            border: Border.all(
              color: tag['color'].withOpacity(0.5),
              width: 1,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  tag['tag'],
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  '${tag['posts']} posts',
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHashtagItem(BuildContext context, Map<String, dynamic> tag) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(15),
      ),
      child: ListTile(
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                tag['color'],
                tag['color'].withOpacity(0.5),
              ],
            ),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Center(
            child: Icon(Icons.tag, color: Colors.white),
          ),
        ),
        title: Text(
          tag['tag'],
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          '${tag['posts']} posts',
          style: TextStyle(color: Colors.grey[400]),
        ),
        trailing: Icon(
          Icons.trending_up,
          color: tag['color'],
        ),
        onTap: () {
          // Navigate to hashtag page
        },
      ),
    );
  }

  Widget _buildUserItem(BuildContext context, Map<String, dynamic> user) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(15),
      ),
      child: ListTile(
        leading: Stack(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: Colors.grey[800],
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(Icons.person, color: Colors.white, size: 30),
              ),
            ),
            if (user['isVerified'])
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(
                    color: Colors.blue,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check,
                    size: 12,
                    color: Colors.white,
                  ),
                ),
              ),
          ],
        ),
        title: Row(
          children: [
            Text(
              user['name'],
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (user['isVerified']) ...[
              const SizedBox(width: 5),
              const Icon(
                Icons.verified,
                size: 16,
                color: Colors.blue,
              ),
            ],
          ],
        ),
        subtitle: Text(
          '${user['username']} • ${user['followers']} followers',
          style: TextStyle(color: Colors.grey[400]),
        ),
        trailing: ElevatedButton(
          onPressed: () {
            // Follow user
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Theme.of(context).primaryColor,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
          ),
          child: const Text('Follow'),
        ),
        onTap: () {
          // Navigate to user profile
        },
      ),
    );
  }

  Widget _buildVideosGrid(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 5,
        mainAxisSpacing: 5,
        childAspectRatio: 0.7,
      ),
      itemCount: 12,
      itemBuilder: (context, index) {
        return Container(
          decoration: BoxDecoration(
            color: Colors.grey[900],
            borderRadius: BorderRadius.circular(10),
          ),
          child: Stack(
            children: [
              Center(
                child: Icon(
                  Icons.play_circle_outline,
                  color: Colors.grey[700],
                  size: 40,
                ),
              ),
              Positioned(
                bottom: 5,
                left: 5,
                child: Row(
                  children: [
                    const Icon(
                      Icons.favorite,
                      size: 12,
                      color: Colors.white,
                    ),
                    const SizedBox(width: 3),
                    Text(
                      '${(index + 1) * 123}K',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }
}

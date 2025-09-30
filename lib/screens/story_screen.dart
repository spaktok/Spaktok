import 'package:flutter/material.dart';
import 'package:spaktok/lib/models/story.dart';
import 'package:spaktok/lib/services/story_service.dart';
import 'package:firebase_auth/firebase_auth.dart';

class StoryScreen extends StatefulWidget {
  const StoryScreen({Key? key}) : super(key: key);

  @override
  State<StoryScreen> createState() => _StoryScreenState();
}

class _StoryScreenState extends State<StoryScreen> {
  final StoryService _storyService = StoryService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _currentUser;

  @override
  void initState() {
    super.initState();
    _currentUser = _auth.currentUser;
    if (_currentUser == null) {
      _signInAnonymously();
    }
  }

  Future<void> _signInAnonymously() async {
    try {
      await _auth.signInAnonymously();
      setState(() {
        _currentUser = _auth.currentUser;
      });
      print("Signed in anonymously for StoryScreen with UID: ${_currentUser?.uid}");
    } catch (e) {
      print("Error signing in anonymously for StoryScreen: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUser == null) {
      return const Scaffold(
        appBar: AppBar(title: Text('Stories')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Stories')),
      body: StreamBuilder<List<Story>>(
        stream: _storyService.getAllStories(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final stories = snapshot.data ?? [];
          if (stories.isEmpty) {
            return const Center(child: Text('No stories available.'));
          }
          return ListView.builder(
            itemCount: stories.length,
            itemBuilder: (context, index) {
              final story = stories[index];
              return Card(
                margin: const EdgeInsets.all(8.0),
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('User ID: ${story.userId}'),
                      Text('Media Type: ${story.mediaType}'),
                      Image.network(story.mediaUrl, height: 200, fit: BoxFit.cover),
                      Text('Duration: ${story.duration}s'),
                      Text('Timestamp: ${story.timestamp.toDate()}'),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Implement story upload functionality
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Upload story functionality not yet implemented.')),
          );
        },
        child: const Icon(Icons.add_a_photo),
      ),
    );
  }
}


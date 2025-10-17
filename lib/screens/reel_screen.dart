import 'package:flutter/material.dart';
import 'package:spaktok/models/reel.dart';
import 'package:spaktok/services/reel_service.dart';
import 'package:firebase_auth/firebase_auth.dart';


class ReelScreen extends StatefulWidget {
  const ReelScreen({Key? key}) : super(key: key);

  @override
  State<ReelScreen> createState() => _ReelScreenState();
}

class _ReelScreenState extends State<ReelScreen> {
  final ReelService _reelService = ReelService();
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
      print("Signed in anonymously for ReelScreen with UID: ${_currentUser?.uid}");
    } catch (e) {
      print("Error signing in anonymously for ReelScreen: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUser == null) {
      return Scaffold(
        appBar: AppBar(title: const Text("Reels")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text("Reels")),
      body: StreamBuilder<List<Reel>>(
        stream: _reelService.getAllReels(),
        builder: (context, snapshot) {
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final reels = snapshot.data ?? [];
          if (reels.isEmpty) {
            return Center(child: const Text("No reels available"));
          }
          return ListView.builder(
            itemCount: reels.length,
            itemBuilder: (context, index) {
              final reel = reels[index];
              return Card(
                margin: const EdgeInsets.all(8.0),
                child: Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('User ID: ${reel.userId}'),
                      Text('Description: ${reel.description}'),
                      // هنا يمكن إضافة مشغل فيديو لعرض reel.videoUrl
                      Container(
                        height: 200,
                        color: Colors.black12,
                        child: Center(child: const Text("Video Player Placeholder")),
                      ),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.thumb_up),
                            onPressed: () {
                              _reelService.likeReel(reel.id, _currentUser!.uid);
                            },
                          ),
                          Text("Likes: ${reel.likesCount}"),
                          const SizedBox(width: 20),
                          IconButton(
                            icon: const Icon(Icons.comment),
                            onPressed: () async {
                              final controller = TextEditingController();
                              final text = await showDialog<String>(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Add Comment'),
                                  content: TextField(
                                    controller: controller,
                                    decoration: const InputDecoration(hintText: 'Write a comment'),
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('Cancel'),
                                    ),
                                    ElevatedButton(
                                      onPressed: () => Navigator.pop(context, controller.text.trim()),
                                      child: const Text('Post'),
                                    ),
                                  ],
                                ),
                              );
                              if (text != null && text.isNotEmpty) {
                                await _reelService.addComment(reel.id, _currentUser!.uid, text);
                              }
                            },
                          ),
                          Text("Comments: ${reel.commentsCount}"),
                        ],
                      ),
                      Text('Timestamp: ${reel.timestamp.toDate()}'),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final descriptionController = TextEditingController();
          final urlController = TextEditingController();
          final result = await showDialog<Map<String, String>>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Upload Reel'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: urlController,
                    decoration: const InputDecoration(hintText: 'Video URL'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: descriptionController,
                    decoration: const InputDecoration(hintText: 'Description'),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, {
                    'url': urlController.text.trim(),
                    'desc': descriptionController.text.trim(),
                  }),
                  child: const Text('Upload'),
                ),
              ],
            ),
          );
          if (result != null && result['url']!.isNotEmpty) {
            await _reelService.uploadReel(
              _currentUser!.uid,
              result['url']!,
              result['desc'] ?? '',
            );
          }
        },
        child: const Icon(Icons.video_call),
      ),
    );
  }
}


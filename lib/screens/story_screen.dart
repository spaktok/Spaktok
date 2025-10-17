import 'package:flutter/material.dart';
import 'package:spaktok/models/story.dart';
import 'package:spaktok/services/story_service.dart';
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
      return Scaffold(
        appBar: AppBar(title: const Text("Stories")),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text("Stories")),
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
            return Center(child: const Text("No stories available"));
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
        onPressed: () async {
          final urlController = TextEditingController();
          final durationController = TextEditingController(text: '10');
          final mediaType = ValueNotifier<String>('image');
          final result = await showDialog<Map<String, String>>(
            context: context,
            builder: (context) => AlertDialog(
              title: const Text('Upload Story'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButton<String>(
                    value: mediaType.value,
                    items: const [
                      DropdownMenuItem(value: 'image', child: Text('Image URL')),
                      DropdownMenuItem(value: 'video', child: Text('Video URL')),
                    ],
                    onChanged: (v) { mediaType.value = v ?? 'image'; (context as Element).markNeedsBuild(); },
                  ),
                  TextField(
                    controller: urlController,
                    decoration: const InputDecoration(hintText: 'Media URL'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: durationController,
                    decoration: const InputDecoration(hintText: 'Duration seconds'),
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
                    'type': mediaType.value,
                    'duration': durationController.text.trim(),
                  }),
                  child: const Text('Upload'),
                ),
              ],
            ),
          );
          if (result != null && result['url']!.isNotEmpty) {
            // استخدم واجهة أبسط: بما أن خدمة الرفع الحالية تتوقع ملفاً، سنحفظ فقط البيانات في Firestore للتجربة السريعة
            final story = Story(
              id: '',
              userId: _currentUser!.uid,
              mediaUrl: result['url']!,
              mediaType: result['type'] ?? 'image',
              timestamp: Timestamp.now(),
              duration: int.tryParse(result['duration'] ?? '10') ?? 10,
            );
            await FirebaseFirestore.instance.collection('stories').add(story.toJson());
          }
        },
        child: const Icon(Icons.add_a_photo),
      ),
    );
  }
}


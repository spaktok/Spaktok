import 'package:flutter/material.dart';
import 'package:spaktok/lib/models/reel.dart';
import 'package:spaktok/lib/services/reel_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

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
        appBar: AppBar(title: Text(AppLocalizations.of(context)!.reelsTitle)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(AppLocalizations.of(context)!.reelsTitle)),
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
            return Center(child: Text(AppLocalizations.of(context)!.noReelsAvailable));
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
                        child: Center(child: Text(AppLocalizations.of(context)!.videoPlayerPlaceholder)),
                      ),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.thumb_up),
                            onPressed: () {
                              _reelService.likeReel(reel.id, _currentUser!.uid);
                            },
                          ),
                          Text(AppLocalizations.of(context)!.likesCount(reel.likesCount)),
                          const SizedBox(width: 20),
                          IconButton(
                            icon: const Icon(Icons.comment),
                            onPressed: () {
                              // TODO: Implement comment functionality
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(AppLocalizations.of(context)!.commentsCount(0))), // Placeholder for comment functionality
                              );
                            },
                          ),
                          Text(AppLocalizations.of(context)!.commentsCount(reel.commentsCount)),
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
        onPressed: () {
          // TODO: Implement reel upload functionality
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(AppLocalizations.of(context)!.uploadReelNotImplemented)),
          );
        },
        child: const Icon(Icons.video_call),
      ),
    );
  }
}


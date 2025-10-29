import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/models/story.dart';
import 'dart:io';

class StoryService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Upload a new story (image or video)
  Future<void> uploadStory({
    required String userId,
    required File mediaFile,
    required String mediaType,
    required int duration, // Story duration in seconds
  }) async {
    try {
      final String storyId = _firestore.collection('stories').doc().id;
      final String filePath = 'stories/$userId/$storyId-${DateTime.now().millisecondsSinceEpoch}';
      final UploadTask uploadTask = _storage.ref().child(filePath).putFile(mediaFile);
      final TaskSnapshot snapshot = await uploadTask.whenComplete(() => null);
      final String mediaUrl = await snapshot.ref.getDownloadURL();

      final Story story = Story(
        id: storyId,
        userId: userId,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        timestamp: Timestamp.now(),
        duration: duration,
      );

      await _firestore.collection('stories').doc(storyId).set(story.toJson());
      print('Story uploaded successfully: $storyId');
    } catch (e) {
      print('Error uploading story: $e');
      rethrow;
    }
  }

  // Get stories grouped by user for the main story feed
  Stream<Map<String, List<Story>>> getGroupedStories() {
    // Fetch stories from the last 24 hours
    final twentyFourHoursAgo = Timestamp.fromDate(DateTime.now().subtract(const Duration(hours: 24)));

    return _firestore
        .collection('stories')
        .where('timestamp', isGreaterThan: twentyFourHoursAgo)
        .orderBy('timestamp', descending: false) // Fetch in chronological order
        .snapshots()
        .map((snapshot) {
      final Map<String, List<Story>> grouped = {};
      for (var doc in snapshot.docs) {
        final story = Story.fromJson(doc.data());
        if (grouped.containsKey(story.userId)) {
          grouped[story.userId]!.add(story);
        } else {
          grouped[story.userId] = [story];
        }
      }
      return grouped;
    });
  }

  // Delete a story
  Future<void> deleteStory(String storyId) async {
    try {
      // You might want to get the story data first to delete the file from storage
      await _firestore.collection('stories').doc(storyId).delete();
      print('Story deleted successfully: $storyId');
    } catch (e) {
      print('Error deleting story: $e');
      rethrow;
    }
  }
}


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
    required int duration, // duration of the story in seconds
    String privacy = 'public', // 'public', 'friends', 'private'
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
        privacy: privacy,
      );

      await _firestore.collection('stories').doc(storyId).set(story.toJson());
      print('Story uploaded successfully: $storyId');
    } catch (e) {
      print('Error uploading story: $e');
      rethrow;
    }
  }

  // Get user's stories (can be filtered later for recent stories only)
  Stream<List<Story>> getUserStories(String userId) {
    return _firestore
        .collection('stories')
        .where('userId', isEqualTo: userId)
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Story.fromJson(doc.data()))
            .toList());
  }

  // Get all stories (for the main stories page)
  Stream<List<Story>> getAllStories() {
    // Logic can be added here to filter expired stories
    return _firestore
        .collection('stories')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Story.fromJson(doc.data()))
            .toList());
  }

  // Update story privacy
  Future<void> updateStoryPrivacy(String storyId, String privacy) async {
    try {
      await _firestore.collection('stories').doc(storyId).update({
        'privacy': privacy,
      });
      print('Story privacy updated successfully for story: $storyId');
    } catch (e) {
      print('Error updating story privacy: $e');
      rethrow;
    }
  }

  // Delete a story
  Future<void> deleteStory(String storyId) async {
    try {
      await _firestore.collection('stories').doc(storyId).delete();
      // Logic can be added here to delete the file from Firebase Storage as well
      print('Story deleted successfully: $storyId');
    } catch (e) {
      print('Error deleting story: $e');
      rethrow;
    }
  }
}


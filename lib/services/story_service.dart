import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/models/story.dart';
import 'dart:io';

class StoryService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // Upload new story (image or video)
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

  // Fetch user stories (can be filtered later for recent stories only)
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

  // Fetch all stories (for main stories page)
  Stream<List<Story>> getAllStories() {
    // Can add logic to filter expired stories here
    return _firestore
        .collection('stories')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Story.fromJson(doc.data()))
            .toList());
  }

  // Delete story
  Future<void> deleteStory(String storyId) async {
    try {
      await _firestore.collection('stories').doc(storyId).delete();
      // Can add logic to delete file from Firebase Storage here as well
      print('Story deleted successfully: $storyId');
    } catch (e) {
      print('Error deleting story: $e');
      rethrow;
    }
  }
}


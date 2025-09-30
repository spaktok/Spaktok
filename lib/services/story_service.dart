import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/lib/models/story.dart';
import 'dart:io';

class StoryService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // رفع قصة جديدة (صورة أو فيديو)
  Future<void> uploadStory({
    required String userId,
    required File mediaFile,
    required String mediaType,
    required int duration, // مدة القصة بالثواني
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

  // جلب قصص المستخدمين (يمكن تصفيتها لاحقًا للقصص الحديثة فقط)
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

  // جلب جميع القصص (لصفحة القصص الرئيسية)
  Stream<List<Story>> getAllStories() {
    // يمكن إضافة منطق لتصفية القصص المنتهية الصلاحية هنا
    return _firestore
        .collection('stories')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Story.fromJson(doc.data()))
            .toList());
  }

  // حذف قصة
  Future<void> deleteStory(String storyId) async {
    try {
      await _firestore.collection('stories').doc(storyId).delete();
      // يمكن إضافة منطق لحذف الملف من Firebase Storage هنا أيضًا
      print('Story deleted successfully: $storyId');
    } catch (e) {
      print('Error deleting story: $e');
      rethrow;
    }
  }
}


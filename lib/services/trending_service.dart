import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/models/trending_content.dart';

class TrendingService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // جلب المحتوى الشائع (Explore/Trending)
  Stream<List<TrendingContent>> getTrendingContent() {
    return _firestore
        .collection('trending_content')
        .orderBy('viewsCount', descending: true) // يمكن تعديل معايير الترتيب
        .limit(20) // جلب أفضل 20 محتوى شائع
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => TrendingContent.fromJson(doc.data()))
            .toList());
  }

  // تحديث عدد المشاهدات لمحتوى معين (لزيادة شعبيته)
  Future<void> updateViewsCount(String contentId) async {
    try {
      final DocumentReference docRef = _firestore.collection('trending_content').doc(contentId);
      await docRef.update({
        'viewsCount': FieldValue.increment(1),
        'timestamp': FieldValue.serverTimestamp(), // تحديث وقت آخر مشاهدة
      });
    } catch (e) {
      print('Error updating views count: $e');
    }
  }

  // إضافة محتوى جديد إلى قائمة الشائع (للاستخدام الداخلي أو من خلال وظائف Firebase)
  Future<void> addTrendingContent(TrendingContent content) async {
    try {
      await _firestore.collection('trending_content').doc(content.id).set(content.toJson());
    } catch (e) {
      print('Error adding trending content: $e');
    }
  }
}


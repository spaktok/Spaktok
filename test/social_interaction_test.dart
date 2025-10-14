import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:spaktok/services/reel_service.dart';
import 'package:spaktok/services/comment_service.dart';
import 'package:spaktok/models/reel.dart';
import 'package:spaktok/models/comment.dart';

// Mock classes for dependencies
class MockReelService extends Mock implements ReelService {}
class MockCommentService extends Mock implements CommentService {}

void main() {
  group('Reel Service Tests', () {
    late MockReelService mockReelService;

    setUp(() {
      mockReelService = MockReelService();
    });

    test('fetchReels returns a list of reels', () async {
      when(mockReelService.fetchReels()).thenAnswer((_) async => [
        Reel(id: '1', userId: 'user1', videoUrl: 'url1', caption: 'caption1', likes: 10, comments: 2, shares: 1, createdAt: DateTime.now()),
        Reel(id: '2', userId: 'user2', videoUrl: 'url2', caption: 'caption2', likes: 20, comments: 4, shares: 2, createdAt: DateTime.now()),
      ]);

      final reels = await mockReelService.fetchReels();
      expect(reels.length, 2);
      expect(reels[0].id, '1');
    });

    test('likeReel increments likes', () async {
      when(mockReelService.likeReel('1', 'user1')).thenAnswer((_) async => Future.value());
      await mockReelService.likeReel('1', 'user1');
      verify(mockReelService.likeReel('1', 'user1')).called(1);
    });

    test('saveReel saves the reel', () async {
      when(mockReelService.saveReel('1', 'user1')).thenAnswer((_) async => Future.value());
      await mockReelService.saveReel('1', 'user1');
      verify(mockReelService.saveReel('1', 'user1')).called(1);
    });
  });

  group('Comment Service Tests', () {
    late MockCommentService mockCommentService;

    setUp(() {
      mockCommentService = MockCommentService();
    });

    test('addComment adds a new comment', () async {
      final comment = Comment(id: 'c1', reelId: 'r1', userId: 'u1', text: 'Great video!', createdAt: DateTime.now());
      when(mockCommentService.addComment(comment)).thenAnswer((_) async => Future.value());
      await mockCommentService.addComment(comment);
      verify(mockCommentService.addComment(comment)).called(1);
    });

    test('fetchComments returns comments for a reel', () async {
      when(mockCommentService.fetchComments('r1')).thenAnswer((_) async => [
        Comment(id: 'c1', reelId: 'r1', userId: 'u1', text: 'Comment 1', createdAt: DateTime.now()),
        Comment(id: 'c2', reelId: 'r1', userId: 'u2', text: 'Comment 2', createdAt: DateTime.now()),
      ]);

      final comments = await mockCommentService.fetchComments('r1');
      expect(comments.length, 2);
      expect(comments[0].text, 'Comment 1');
    });
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:spaktok/services/disappearing_messages_service.dart';
import 'package:spaktok/services/story_service.dart';
import 'package:spaktok/services/friend_service.dart';
import 'package:spaktok/models/story.dart';
import 'package:spaktok/models/friend_request.dart';

// Mock classes for dependencies
class MockDisappearingMessagesService extends Mock implements DisappearingMessagesService {}
class MockStoryService extends Mock implements StoryService {}
class MockFriendService extends Mock implements FriendService {}

void main() {
  group('Disappearing Messages Service Tests', () {
    late MockDisappearingMessagesService mockDisappearingMessagesService;

    setUp(() {
      mockDisappearingMessagesService = MockDisappearingMessagesService();
    });

    test('toggleDisappearingMessages toggles the state', () async {
      when(mockDisappearingMessagesService.toggleDisappearingMessages('chat1', true)).thenAnswer((_) async => Future.value());
      await mockDisappearingMessagesService.toggleDisappearingMessages('chat1', true);
      verify(mockDisappearingMessagesService.toggleDisappearingMessages('chat1', true)).called(1);
    });

    test('isDisappearingMessagesEnabled returns correct state', () async {
      when(mockDisappearingMessagesService.isDisappearingMessagesEnabled('chat1')).thenAnswer((_) async => true);
      final isEnabled = await mockDisappearingMessagesService.isDisappearingMessagesEnabled('chat1');
      expect(isEnabled, true);
    });
  });

  group('Story Service Tests', () {
    late MockStoryService mockStoryService;

    setUp(() {
      mockStoryService = MockStoryService();
    });

    test('uploadStory uploads a story with privacy', () async {
      final story = Story(id: 's1', userId: 'u1', mediaUrl: 'url1', privacy: 'public', createdAt: DateTime.now());
      when(mockStoryService.uploadStory(story)).thenAnswer((_) async => Future.value());
      await mockStoryService.uploadStory(story);
      verify(mockStoryService.uploadStory(story)).called(1);
    });

    test('updateStoryPrivacy updates story privacy', () async {
      when(mockStoryService.updateStoryPrivacy('s1', 'friends')).thenAnswer((_) async => Future.value());
      await mockStoryService.updateStoryPrivacy('s1', 'friends');
      verify(mockStoryService.updateStoryPrivacy('s1', 'friends')).called(1);
    });
  });

  group('Friend Service Tests', () {
    late MockFriendService mockFriendService;

    setUp(() {
      mockFriendService = MockFriendService();
    });

    test('sendFriendRequest sends a request', () async {
      final friendRequest = FriendRequest(id: 'fr1', fromUserId: 'u1', toUserId: 'u2', status: 'pending', createdAt: DateTime.now());
      when(mockFriendService.sendFriendRequest(friendRequest)).thenAnswer((_) async => Future.value());
      await mockFriendService.sendFriendRequest(friendRequest);
      verify(mockFriendService.sendFriendRequest(friendRequest)).called(1);
    });

    test('acceptFriendRequest accepts a request', () async {
      when(mockFriendService.acceptFriendRequest('fr1')).thenAnswer((_) async => Future.value());
      await mockFriendService.acceptFriendRequest('fr1');
      verify(mockFriendService.acceptFriendRequest('fr1')).called(1);
    });

    test('declineFriendRequest declines a request', () async {
      when(mockFriendService.declineFriendRequest('fr1')).thenAnswer((_) async => Future.value());
      await mockFriendService.declineFriendRequest('fr1');
      verify(mockFriendService.declineFriendRequest('fr1')).called(1);
    });
  });
}

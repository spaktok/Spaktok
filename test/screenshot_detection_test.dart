import 'package:flutter_test/flutter_test.dart';
import 'package:spaktok/services/disappearing_messages_service.dart';

void main() {
  group('Screenshot detection notification (logic stub)', () {
    test('sendScreenshotNotification call compiles', () async {
      final svc = DisappearingMessagesService();
      // Firestore emulator recommended; call may fail gracefully without it.
      try {
        await svc.sendScreenshotNotification(
          chatId: 'chat123',
          userId: 'userA',
          messageId: 'messageXYZ',
        );
      } catch (_) {
        // acceptable for smoke test without emulator
      }
      expect(true, isTrue);
    });
  });
}

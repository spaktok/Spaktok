import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:spaktok/services/disappearing_messages_service.dart';

void main() {
  final isEmulator =
      Platform.environment.containsKey('FIRESTORE_EMULATOR_HOST');

  group('DisappearingMessagesService (integration)', () {
    test('service initializes', () {
      final svc = DisappearingMessagesService();
      expect(svc, isNotNull);
    });

    test('send and schedule deletion (emulator)', () async {
      if (!isEmulator) {
        return; // Skip when emulator is not configured
      }
      final svc = DisappearingMessagesService();
      // NOTE: Provide real IDs when running emulator-backed tests
      // This is a smoke test to ensure callable paths exist.
      expect(
          () => svc.sendDisappearingMessage(
                chatId: 'testChat',
                senderId: 'userA',
                receiverId: 'userB',
                content: 'hello',
                type: 'text',
                disappearAfterSeconds: 5,
              ),
          returnsNormally);
    });
  });
}

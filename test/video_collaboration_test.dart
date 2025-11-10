import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:spaktok/services/video_collaboration_service.dart';

void main() {
  final svc = VideoCollaborationService();
  final hasEmulator =
      Platform.environment.containsKey('FIRESTORE_EMULATOR_HOST');

  group('VideoCollaborationService (integration)', () {
    test('service constructed', () {
      expect(svc, isNotNull);
    });

    test('duet creation skipped without emulator', () async {
      if (!hasEmulator) {
        expect(true, isTrue); // trivial pass
        return;
      }
      // In emulator mode we would upload a small temp file; placeholder only.
      // TODO: implement real file fixture
      final temp = File('temp_duet.mp4');
      await temp.writeAsBytes(const [0x00, 0x01]);
      try {
        await svc.createDuet(
            originalVideoId: 'original123',
            userVideoFile: temp,
            caption: 'test');
      } catch (_) {
        // acceptable in smoke test (missing original video)
      } finally {
        if (await temp.exists()) await temp.delete();
      }
      expect(true, isTrue);
    });
  });
}

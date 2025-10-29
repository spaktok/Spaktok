import 'package:flutter_test/flutter_test.dart';
import 'package:spaktok/services/agora_token_service.dart';
import 'package:spaktok/config/app_config.dart';

void main() {
  group('Agora Integration Tests', () {
    
    test('AgoraTokenService initializes', () {
      final service = AgoraTokenService();
      expect(service, isNotNull);
    });

    test('AppConfig contains required endpoints', () {
      expect(AppConfig.backendBaseUrl, isNotEmpty);
      expect(AppConfig.agoraTokenEndpoint, contains('token'));
      expect(AppConfig.agoraRenewEndpoint, contains('renew'));
    });

    test('Token service is singleton', () {
      final service1 = AgoraTokenService();
      final service2 = AgoraTokenService();
      expect(service1, equals(service2));
    });

    test('AppConfig token expiry buffer is valid', () {
      expect(AppConfig.tokenExpiryBuffer, greaterThan(0));
      expect(AppConfig.tokenExpiryBuffer, lessThan(3600)); // Less than 1 hour
    });

    test('AppConfig debug mode setting exists', () {
      expect(AppConfig.enableDebugLogging, isA<bool>());
    });
  });
}

import 'package:cloud_functions/cloud_functions.dart';
import 'dart:developer' as developer;

class AgoraTokenService {
  // Singleton pattern
  static final AgoraTokenService _instance = AgoraTokenService._internal();
  static AgoraTokenService get instance => _instance;

  AgoraTokenService._internal();

  factory AgoraTokenService() {
    return _instance;
  }

  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  /// Fetch an Agora token from the server (Cloud Function)
  Future<String> getToken(String channelName) async {
    try {
      final callable = _functions.httpsCallable('getAgoraToken');
      final response = await callable.call<Map<String, dynamic>>({
        'channelName': channelName,
      });

      final token = response.data['token'];
      if (token == null) {
        throw Exception('Failed to get a valid token from the server.');
      }
      return token;
    } catch (e) {
      developer.log('Error fetching Agora token: $e', name: 'agora_token_service');
      rethrow;
    }
  }
}

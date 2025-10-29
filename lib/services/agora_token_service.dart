import 'package:cloud_functions/cloud_functions.dart';

class AgoraTokenService {
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
      print('Error fetching Agora token: $e');
      rethrow;
    }
  }
}

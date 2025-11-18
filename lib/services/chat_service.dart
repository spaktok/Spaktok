import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:spaktok/models/chat_message.dart';
import 'cloudflare_api_service.dart';

class ChatService {
  static const String _base = CloudflareApiService.baseUrl;

  /// Get or create a chat room ID for two users
  Future<String> getChatRoomId(String userId1, String userId2) async {
    final ids = [userId1, userId2]..sort();
    return ids.join('_');
  }

  /// Get a stream of messages for a chat room
  Stream<List<ChatMessage>> getMessages(String chatRoomId) {
    // Polling-based stream via Workers (can be upgraded to DO websockets)
    final controller = StreamController<List<ChatMessage>>();
    Timer? timer;
    Future<void> fetch() async {
      try {
        final res = await http
            .get(Uri.parse('$_base/chat/messages?roomId=$chatRoomId'));
        if (res.statusCode < 300) {
          final list = (jsonDecode(res.body) as List<dynamic>)
              .map((e) => ChatMessage.fromJson(e as Map<String, dynamic>))
              .toList();
          controller.add(list);
        }
      } catch (_) {}
    }

    // initial
    fetch();
    timer = Timer.periodic(const Duration(seconds: 2), (_) => fetch());
    controller.onCancel = () => timer?.cancel();
    return controller.stream;
  }

  /// Send a message
  Future<void> sendMessage(ChatMessage message) async {
    await http.post(
      Uri.parse('$_base/chat/send'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(message.toJson()),
    );
  }

  /// Upload a media file (image, video, audio) to Firebase Storage
  Future<String> uploadMedia(
      File file, String chatRoomId, String fileName) async {
    final bytes = await file.readAsBytes();
    final res = await http.put(
      Uri.parse('$_base/r2/upload?path=chat_media/$chatRoomId/$fileName'),
      headers: {'Content-Type': 'application/octet-stream'},
      body: bytes,
    );
    if (res.statusCode >= 300) {
      throw Exception('Failed to upload media: ${res.body}');
    }
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    return data['url'] as String;
  }

  /// Update the status of a message
  Future<void> updateMessageStatus(
      String chatRoomId, String messageId, MessageStatus status) async {
    await http.post(
      Uri.parse('$_base/chat/status'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'chatRoomId': chatRoomId,
        'messageId': messageId,
        'status': status.name,
      }),
    );
  }

  /// Set the typing status for a user in a chat room
  Future<void> setTypingStatus(
      String chatRoomId, String userId, bool isTyping) async {
    await http.post(
      Uri.parse('$_base/chat/typing'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'chatRoomId': chatRoomId,
        'userId': userId,
        'isTyping': isTyping,
      }),
    );
  }

  /// Get the typing status stream for a user in a chat room
  Stream<bool> getTypingStatus(String chatRoomId, String otherUserId) {
    // Poll KV via Workers
    return Stream.periodic(const Duration(seconds: 2)).asyncMap((_) async {
      try {
        final res = await http.get(Uri.parse(
            '$_base/chat/typing?chatRoomId=$chatRoomId&userId=$otherUserId'));
        if (res.statusCode < 300) {
          final data = jsonDecode(res.body) as Map<String, dynamic>;
          return data['isTyping'] == true;
        }
      } catch (_) {}
      return false;
    });
  }
}

import 'dart:convert';
import 'package:http/http.dart' as http;

/// CloudflareApiService - Ultra-Low-Cost Backend Client
///
/// Replaces expensive Firebase/Agora calls with Cloudflare Workers
/// Cost reduction: 90-95%
class CloudflareApiService {
  static const String baseUrl = 'https://spaktok-edge.workers.dev/api';

  // Singleton pattern
  static final CloudflareApiService _instance =
      CloudflareApiService._internal();
  factory CloudflareApiService() => _instance;
  CloudflareApiService._internal();

  final http.Client _client = http.Client();
  String? _authToken;

  void setAuthToken(String token) {
    _authToken = token;
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_authToken != null) 'Authorization': 'Bearer $_authToken',
      };

  // ========== VIDEO UPLOAD (Chunked) ==========

  /// Upload video in chunks to R2 (99% cheaper than Firebase Storage)
  Future<Map<String, dynamic>> uploadVideoChunk({
    required String uploadId,
    required int chunkIndex,
    required List<int> chunkData,
    required String userId,
  }) async {
    final url = Uri.parse(
      '$baseUrl/video/chunk?uploadId=$uploadId&chunkIndex=$chunkIndex&userId=$userId',
    );

    final response = await _client.post(
      url,
      headers: {'Content-Type': 'application/octet-stream'},
      body: chunkData,
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to upload chunk: ${response.body}');
    }
  }

  /// Finalize video upload and trigger transcoding
  Future<Map<String, dynamic>> finalizeVideoUpload({
    required String uploadId,
    required String userId,
    required int totalChunks,
    Map<String, dynamic>? metadata,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/video/finalize'),
      headers: _headers,
      body: json.encode({
        'uploadId': uploadId,
        'userId': userId,
        'totalChunks': totalChunks,
        'metadata': metadata,
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to finalize upload: ${response.body}');
    }
  }

  // ========== WEBRTC LIVE STREAMING (Replaces Agora) ==========

  /// Create WebRTC session for live streaming (P2P, near-zero cost)
  Future<Map<String, dynamic>> createWebRTCSession({
    required String streamId,
    required String userId,
    required String role, // 'host' or 'viewer'
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/webrtc/session'),
      headers: _headers,
      body: json.encode({
        'streamId': streamId,
        'userId': userId,
        'role': role,
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to create WebRTC session: ${response.body}');
    }
  }

  /// Send WebRTC signaling data
  Future<Map<String, dynamic>> sendWebRTCSignal({
    required String streamId,
    required String userId,
    required Map<String, dynamic> signal,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/webrtc/signal'),
      headers: _headers,
      body: json.encode({
        'streamId': streamId,
        'userId': userId,
        'signal': signal,
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to send WebRTC signal: ${response.body}');
    }
  }

  // ========== CONTENT MODERATION (Workers AI) ==========

  /// Moderate content using Workers AI (free tier available)
  Future<Map<String, dynamic>> moderateContent({
    String? imageUrl,
    String? text,
    String? videoId,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/moderate'),
      headers: _headers,
      body: json.encode({
        if (imageUrl != null) 'imageUrl': imageUrl,
        if (text != null) 'text': text,
        if (videoId != null) 'videoId': videoId,
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to moderate content: ${response.body}');
    }
  }

  // ========== AUTO CAPTIONS (Workers AI - Whisper) ==========

  /// Generate captions using Workers AI (99% cheaper than Google Speech-to-Text)
  Future<Map<String, dynamic>> generateCaptions({
    required String audioUrl,
    required String videoId,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/captions'),
      headers: _headers,
      body: json.encode({
        'audioUrl': audioUrl,
        'videoId': videoId,
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to generate captions: ${response.body}');
    }
  }

  // ========== GIFTS & COINS ==========

  /// Send virtual gift (D1 transaction)
  Future<Map<String, dynamic>> sendGift({
    required String giftId,
    required String receiverId,
    required String senderId,
    required int coins,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/gift/send'),
      headers: _headers,
      body: json.encode({
        'giftId': giftId,
        'receiverId': receiverId,
        'senderId': senderId,
        'coins': coins,
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to send gift: ${response.body}');
    }
  }

  // ========== PAYMENTS (Stripe) ==========

  /// Create Stripe payment intent
  Future<Map<String, dynamic>> createPaymentIntent({
    required int amount,
    String currency = 'usd',
    Map<String, dynamic>? metadata,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/payment-intent'),
      headers: _headers,
      body: json.encode({
        'amount': amount,
        'currency': currency,
        'metadata': metadata,
      }),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to create payment intent: ${response.body}');
    }
  }

  void dispose() {
    _client.close();
  }

  // ========== VIDEO METADATA ==========
  Future<Map<String, dynamic>?> getVideoById(String id) async {
    final resp = await _client.get(Uri.parse('$baseUrl/video/$id'));
    if (resp.statusCode == 200) {
      return json.decode(resp.body) as Map<String, dynamic>;
    }
    return null;
  }

  // ========== CHAT ==========
  Future<List<Map<String, dynamic>>> getChatMessages(String roomId) async {
    final resp =
        await _client.get(Uri.parse('$baseUrl/chat/messages?roomId=$roomId'));
    if (resp.statusCode == 200) {
      final list = json.decode(resp.body) as List<dynamic>;
      return list.cast<Map<String, dynamic>>();
    }
    return [];
  }

  Future<void> sendChatMessage(Map<String, dynamic> message) async {
    await _client.post(
      Uri.parse('$baseUrl/chat/send'),
      headers: _headers,
      body: json.encode(message),
    );
  }

  Future<Map<String, dynamic>> getTyping(String roomId, String userId) async {
    final resp = await _client.get(
        Uri.parse('$baseUrl/chat/typing?chatRoomId=$roomId&userId=$userId'));
    if (resp.statusCode == 200) {
      return json.decode(resp.body) as Map<String, dynamic>;
    }
    return {'isTyping': false};
  }

  Future<void> setTyping(String roomId, String userId, bool isTyping) async {
    await _client.post(
      Uri.parse('$baseUrl/chat/typing'),
      headers: _headers,
      body: json.encode(
          {'chatRoomId': roomId, 'userId': userId, 'isTyping': isTyping}),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:uuid/uuid.dart';
import '../models/chat_message.dart';
import '../theme/app_theme.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:permission_handler/permission_handler.dart';
import 'package:camera/camera.dart';

// Placeholder for Agora SDK integration - actual implementation would be more complex
// import 'package:agora_rtc_engine/agora_rtc_engine.dart';

class SmartChatScreen extends StatefulWidget {
  final String chatId;
  final String recipientId;

  const SmartChatScreen({
    super.key,
    required this.chatId,
    required this.recipientId,
  });

  @override
  State<SmartChatScreen> createState() => _SmartChatScreenState();
}

class _SmartChatScreenState extends State<SmartChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final Uuid _uuid = const Uuid();

  // Placeholder for smart reply and translation services
  // late final SmartReply _smartReply;
  // late final Translator _translator;

  // Placeholder for Agora integration
  // RtcEngine? _agoraEngine;
  // bool _isInCall = false;
  // bool _isVideoCall = false;

  List<ChatMessage> _messages = [];
  bool _autoTranslateEnabled = false;
  bool _disappearingMessagesEnabled = false;
  Duration _disappearingDuration = const Duration(seconds: 10);
  bool _cameraBgEnabled = false;
  CameraController? _bgCameraController;
  List<CameraDescription>? _cameras;

  @override
  void initState() {
    super.initState();
    _messageController.addListener(_onMessageChanged);
    _listenForMessages();
    // Initialize smart reply and translator here if available
    // _smartReply = SmartReply.instance;
    // _translator = Translator.instance;
    // _initializeAgora();
  }

  @override
  void dispose() {
    _messageController.removeListener(_onMessageChanged);
    _messageController.dispose();
    _scrollController.dispose();
    _bgCameraController?.dispose();
    // _agoraEngine?.release();
    super.dispose();
  }

  void _listenForMessages() {
    _firestore
        .collection('chats')
        .doc(widget.chatId)
        .collection('messages')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .listen((snapshot) {
      setState(() {
        _messages = snapshot.docs
            .map((doc) => ChatMessage.fromFirestore(doc))
            .toList();
      });
      _scrollToBottom();
    });
  }

  void _onMessageChanged() {
    // Implement logic for smart replies or other real-time features as user types
    // For now, it's a placeholder.
    // if (_messageController.text.isNotEmpty) {
    //   _generateSmartReplies();
    // }
  }

  Future<String> _translateIfNeeded(String text) async {
    if (!_autoTranslateEnabled) return text;
    try {
      final uri = Uri.parse('/api/ai/translate');
      final resp = await http.post(
        uri,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'text': text,
          'targetLang': 'ar',
        }),
      );
      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body) as Map<String, dynamic>;
        return (data['translatedText'] as String?) ?? text;
      }
    } catch (_) {}
    return text;
  }

  Future<void> _sendMessage({
    String? text,
    String? audioUrl,
    String? videoUrl,
    String? imageUrl,
    MessageType type = MessageType.text,
  }) async {
    if (text == null && audioUrl == null && videoUrl == null && imageUrl == null) {
      return;
    }

    final currentUser = _auth.currentUser;
    if (currentUser == null) {
      // Handle not logged in user
      return;
    }

    final messageId = _uuid.v4();
    final message = ChatMessage(
      id: messageId,
      senderId: currentUser.uid,
      content: text ?? '',
      type: type,
      timestamp: DateTime.now(),
      read: false,
      reactions: {},
      disappearingAt: _disappearingMessagesEnabled
          ? DateTime.now().add(_disappearingDuration)
          : null,
    );

    await _firestore
        .collection('chats')
        .doc(widget.chatId)
        .collection('messages')
        .doc(messageId)
        .set(message.toFirestore());

    if (_disappearingMessagesEnabled) {
      await _expirePreviousMessage(currentUser.uid);
    }

    _messageController.clear();
    _scrollToBottom();
  }

  Future<void> _expirePreviousMessage(String senderId) async {
    try {
      final snap = await _firestore
          .collection('chats')
          .doc(widget.chatId)
          .collection('messages')
          .where('senderId', isEqualTo: senderId)
          .orderBy('timestamp', descending: true)
          .limit(2)
          .get();
      if (snap.docs.length == 2) {
        final prevDoc = snap.docs[1];
        await prevDoc.reference.update({'expired': true});
      }
    } catch (_) {}
  }

  Future<void> _toggleCameraBackground() async {
    if (_cameraBgEnabled) {
      setState(() => _cameraBgEnabled = false);
      await _bgCameraController?.dispose();
      _bgCameraController = null;
      return;
    }
    try {
      final statuses = await [Permission.camera].request();
      if (statuses[Permission.camera] != PermissionStatus.granted) return;
      _cameras ??= await availableCameras();
      if (_cameras == null || _cameras!.isEmpty) return;
      final back = _cameras!.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => _cameras!.first,
      );
      final ctrl = CameraController(back, ResolutionPreset.high, enableAudio: false);
      await ctrl.initialize();
      setState(() {
        _bgCameraController = ctrl;
        _cameraBgEnabled = true;
      });
    } catch (_) {}
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0.0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  // Placeholder for Agora initialization
  // Future<void> _initializeAgora() async {
  //   await [Permission.microphone, Permission.camera].request();
  //   _agoraEngine = createAgoraRtcEngine();
  //   await _agoraEngine?.initialize(RtcEngineContext(appId: 'YOUR_AGORA_APP_ID'));
  //   _agoraEngine?.registerEventHandler(RtcEngineEventHandler(
  //     onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
  //       setState(() { _isInCall = true; });
  //     },
  //     onLeaveChannel: (RtcConnection connection, RtcStats stats) {
  //       setState(() { _isInCall = false; });
  //     },
  //     onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {},
  //     onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {},
  //   ));
  // }

  // Placeholder for starting a call
  // Future<void> _startCall({bool isVideo = false}) async {
  //   if (_agoraEngine == null) return;
  //   setState(() { _isVideoCall = isVideo; });
  //   await _agoraEngine?.setChannelProfile(ChannelProfileType.channelProfileLiveBroadcasting);
  //   await _agoraEngine?.startPreview();
  //   await _agoraEngine?.joinChannel(
  //     token: 'YOUR_AGORA_TOKEN',
  //     channelId: widget.chatId,
  //     uid: 0,
  //     options: const ChannelMediaOptions(),
  //   );
  // }

  // Placeholder for ending a call
  // Future<void> _endCall() async {
  //   await _agoraEngine?.leaveChannel();
  //   setState(() { _isInCall = false; _isVideoCall = false; });
  // }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Chat with ${widget.recipientId}'),
        actions: [
          IconButton(
            icon: Icon(_autoTranslateEnabled ? Icons.translate : Icons.translate_off),
            onPressed: () {
              setState(() {
                _autoTranslateEnabled = !_autoTranslateEnabled;
              });
              // Implement translation toggle logic
            },
            tooltip: 'Toggle Auto-Translation',
          ),
          IconButton(
            icon: Icon(_disappearingMessagesEnabled ? Icons.visibility_off : Icons.visibility),
            onPressed: () {
              setState(() {
                _disappearingMessagesEnabled = !_disappearingMessagesEnabled;
              });
              // Implement disappearing messages toggle logic
            },
            tooltip: 'Toggle Disappearing Messages',
          ),
          // Call buttons (placeholders)
          // if (!_isInCall)
          //   IconButton(
          //     icon: const Icon(Icons.call),
          //     onPressed: () => _startCall(isVideo: false),
          //     tooltip: 'Start Audio Call',
          //   ),
          // if (!_isInCall)
          //   IconButton(
          //     icon: const Icon(Icons.video_call),
          //     onPressed: () => _startCall(isVideo: true),
          //     tooltip: 'Start Video Call',
          //   ),
          // if (_isInCall)
          //   IconButton(
          //     icon: const Icon(Icons.call_end),
          //     onPressed: _endCall,
          //     tooltip: 'End Call',
          //   ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              controller: _scrollController,
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isCurrentUser = message.senderId == _auth.currentUser?.uid;
                return Align(
                  alignment: isCurrentUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 8.0),
                    padding: const EdgeInsets.all(12.0),
                    decoration: BoxDecoration(
                      color: isCurrentUser ? AppTheme.electricBlue : AppTheme.darkSurface,
                      borderRadius: BorderRadius.circular(16.0),
                    ),
                    child: Text(
                      message.content,
                      style: const TextStyle(color: AppTheme.pureWhite),
                    ),
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...', 
                      filled: true,
                      fillColor: AppTheme.darkSurface,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24.0),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8.0),
                FloatingActionButton(
                  onPressed: () => _sendMessage(text: _messageController.text),
                  backgroundColor: AppTheme.electricBlue,
                  child: const Icon(Icons.send, color: AppTheme.pureWhite),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


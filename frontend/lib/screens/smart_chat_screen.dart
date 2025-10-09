import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_mlkit_translation/google_mlkit_translation.dart';
import 'package:google_mlkit_smart_reply/google_mlkit_smart_reply.dart';
import 'package:record/record.dart';
import 'package:just_audio/just_audio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:emoji_picker_flutter/emoji_picker_flutter.dart';
import 'package:uuid/uuid.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';

/// Smart Chat & Voice Interaction Screen
/// - Seamless real-time chat with media support (text, audio, video, disappearing messages)
/// - AI auto-translate and smart reply suggestions
/// - Voice and video call integration
/// - Group chat and voice channels
/// - Emoji reactions and in-chat gifting system
class SmartChatScreen extends StatefulWidget {
  final String chatId;
  final String recipientId;
  final String recipientName;
  final bool isGroupChat;

  const SmartChatScreen({
    Key? key,
    required this.chatId,
    required this.recipientId,
    required this.recipientName,
    this.isGroupChat = false,
  }) : super(key: key);

  @override
  State<SmartChatScreen> createState() => _SmartChatScreenState();
}

class _SmartChatScreenState extends State<SmartChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // ML Kit services
  late OnDeviceTranslator _translator;
  final SmartReply _smartReply = SmartReply();
  
  // Audio recording
  final AudioRecorder _audioRecorder = AudioRecorder();
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isRecording = false;
  String? _recordingPath;
  
  // Agora for voice/video calls
  RtcEngine? _agoraEngine;
  bool _isInCall = false;
  bool _isVideoCall = false;
  
  // UI state
  bool _showEmojiPicker = false;
  bool _showSmartReplies = false;
  List<String> _smartReplySuggestions = [];
  bool _autoTranslateEnabled = false;
  TranslateLanguage _targetLanguage = TranslateLanguage.spanish;
  
  // Message state
  List<ChatMessage> _messages = [];
  Map<String, String> _messageReactions = {};
  
  // Disappearing messages
  bool _disappearingMessagesEnabled = false;
  Duration _disappearingDuration = const Duration(hours: 24);

  @override
  void initState() {
    super.initState();
    _initializeTranslator();
    _loadMessages();
    _messageController.addListener(_onMessageChanged);
  }

  Future<void> _initializeTranslator() async {
    _translator = OnDeviceTranslator(
      sourceLanguage: TranslateLanguage.english,
      targetLanguage: _targetLanguage,
    );
  }

  Future<void> _loadMessages() async {
    _firestore
        .collection('chats')
        .doc(widget.chatId)
        .collection('messages')
        .orderBy('timestamp', descending: true)
        .limit(50)
        .snapshots()
        .listen((snapshot) {
      setState(() {
        _messages = snapshot.docs
            .map((doc) => ChatMessage.fromFirestore(doc))
            .toList();
      });
      _generateSmartReplies();
    });
  }

  void _onMessageChanged() {
    // Generate smart replies as user types
    if (_messageController.text.isNotEmpty) {
      _generateSmartReplies();
    }
  }

  Future<void> _generateSmartReplies() async {
    if (_messages.isEmpty) return;

    try {
      // Build conversation history
      final conversation = _messages.take(10).map((msg) {
        return TextMessage(
          text: msg.content,
          timestamp: msg.timestamp.millisecondsSinceEpoch,
          userId: msg.senderId,
          isLocalUser: msg.senderId == 'current_user_id', // Replace with actual user ID
        );
      }).toList();

      final response = await _smartReply.suggestReplies(conversation);
      
      setState(() {
        _smartReplySuggestions = response.suggestions;
        _showSmartReplies = _smartReplySuggestions.isNotEmpty;
      });
    } catch (e) {
      debugPrint('Error generating smart replies: $e');
    }
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

    final messageId = const Uuid().v4();
    final message = ChatMessage(
      id: messageId,
      senderId: 'current_user_id', // Replace with actual user ID
      content: text ?? '',
      type: type,
      timestamp: DateTime.now(),
      audioUrl: audioUrl,
      videoUrl: videoUrl,
      imageUrl: imageUrl,
      isDisappearing: _disappearingMessagesEnabled,
      disappearAt: _disappearingMessagesEnabled
          ? DateTime.now().add(_disappearingDuration)
          : null,
    );

    // Translate if auto-translate is enabled
    String? translatedText;
    if (_autoTranslateEnabled && text != null) {
      translatedText = await _translator.translateText(text);
    }

    // Save to Firestore
    await _firestore
        .collection('chats')
        .doc(widget.chatId)
        .collection('messages')
        .doc(messageId)
        .set({
      ...message.toMap(),
      if (translatedText != null) 'translatedText': translatedText,
    });

    _messageController.clear();
    _scrollToBottom();
  }

  Future<void> _startVoiceRecording() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        final path = '/tmp/voice_message_${DateTime.now().millisecondsSinceEpoch}.m4a';
        await _audioRecorder.start(
          const RecordConfig(encoder: AudioEncoder.aacLc),
          path: path,
        );
        setState(() {
          _isRecording = true;
          _recordingPath = path;
        });
      }
    } catch (e) {
      debugPrint('Error starting recording: $e');
    }
  }

  Future<void> _stopVoiceRecording() async {
    try {
      final path = await _audioRecorder.stop();
      setState(() {
        _isRecording = false;
      });

      if (path != null) {
        // TODO: Upload audio file to Firebase Storage
        // For now, send with local path
        await _sendMessage(
          text: 'Voice message',
          audioUrl: path,
          type: MessageType.audio,
        );
      }
    } catch (e) {
      debugPrint('Error stopping recording: $e');
    }
  }

  Future<void> _pickMedia(MessageType type) async {
    try {
      FilePickerResult? result;
      
      if (type == MessageType.image) {
        result = await FilePicker.platform.pickFiles(
          type: FileType.image,
        );
      } else if (type == MessageType.video) {
        result = await FilePicker.platform.pickFiles(
          type: FileType.video,
        );
      }

      if (result != null && result.files.single.path != null) {
        final filePath = result.files.single.path!;
        // TODO: Upload to Firebase Storage
        await _sendMessage(
          text: type == MessageType.image ? 'Image' : 'Video',
          imageUrl: type == MessageType.image ? filePath : null,
          videoUrl: type == MessageType.video ? filePath : null,
          type: type,
        );
      }
    } catch (e) {
      debugPrint('Error picking media: $e');
    }
  }

  Future<void> _startVoiceCall() async {
    await _initializeAgoraCall(isVideo: false);
  }

  Future<void> _startVideoCall() async {
    await _initializeAgoraCall(isVideo: true);
  }

  Future<void> _initializeAgoraCall({required bool isVideo}) async {
    try {
      _agoraEngine = createAgoraRtcEngine();
      await _agoraEngine!.initialize(const RtcEngineContext(
        appId: 'YOUR_AGORA_APP_ID',
        channelProfile: ChannelProfileType.channelProfileCommunication,
      ));

      _agoraEngine!.registerEventHandler(
        RtcEngineEventHandler(
          onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
            setState(() {
              _isInCall = true;
              _isVideoCall = isVideo;
            });
          },
          onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
            debugPrint('Remote user $remoteUid joined');
          },
          onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
            debugPrint('Remote user $remoteUid left');
          },
        ),
      );

      if (isVideo) {
        await _agoraEngine!.enableVideo();
      }
      await _agoraEngine!.enableAudio();

      await _agoraEngine!.joinChannel(
        token: '',
        channelId: widget.chatId,
        uid: 0,
        options: ChannelMediaOptions(
          publishCameraTrack: isVideo,
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
          autoSubscribeVideo: isVideo,
        ),
      );
    } catch (e) {
      debugPrint('Error starting call: $e');
    }
  }

  Future<void> _endCall() async {
    await _agoraEngine?.leaveChannel();
    await _agoraEngine?.release();
    setState(() {
      _isInCall = false;
      _isVideoCall = false;
      _agoraEngine = null;
    });
  }

  void _addReaction(String messageId, String emoji) {
    setState(() {
      _messageReactions[messageId] = emoji;
    });
    
    // Save reaction to Firestore
    _firestore
        .collection('chats')
        .doc(widget.chatId)
        .collection('messages')
        .doc(messageId)
        .update({
      'reactions.current_user_id': emoji,
    });
  }

  void _sendGift(String messageId, String giftType) {
    // TODO: Implement in-chat gifting
    _firestore
        .collection('chats')
        .doc(widget.chatId)
        .collection('messages')
        .doc(messageId)
        .update({
      'gifts': FieldValue.arrayUnion([
        {
          'type': giftType,
          'from': 'current_user_id',
          'timestamp': DateTime.now().toIso8601String(),
        }
      ]),
    });
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Widget _buildMessageBubble(ChatMessage message) {
    final isMe = message.senderId == 'current_user_id';
    
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: GestureDetector(
        onLongPress: () => _showMessageOptions(message),
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: isMe
                ? const LinearGradient(
                    colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
                  )
                : null,
            color: isMe ? null : const Color(0xFF0A0A0A),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isMe ? Colors.transparent : const Color(0xFF00C6FF).withOpacity(0.3),
            ),
          ),
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.7,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Message content based on type
              if (message.type == MessageType.text)
                Text(
                  message.content,
                  style: const TextStyle(color: Colors.white, fontSize: 16),
                ),
              if (message.type == MessageType.audio)
                _buildAudioPlayer(message.audioUrl!),
              if (message.type == MessageType.image)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.file(
                    File(message.imageUrl!),
                    width: 200,
                    fit: BoxFit.cover,
                  ),
                ),
              if (message.type == MessageType.video)
                _buildVideoThumbnail(message.videoUrl!),
              
              const SizedBox(height: 4),
              
              // Timestamp
              Text(
                _formatTime(message.timestamp),
                style: TextStyle(
                  color: Colors.white.withOpacity(0.6),
                  fontSize: 12,
                ),
              ),
              
              // Reaction
              if (_messageReactions.containsKey(message.id))
                Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(
                    _messageReactions[message.id]!,
                    style: const TextStyle(fontSize: 20),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAudioPlayer(String audioUrl) {
    return Row(
      children: [
        IconButton(
          icon: const Icon(Icons.play_arrow, color: Colors.white),
          onPressed: () async {
            await _audioPlayer.setFilePath(audioUrl);
            await _audioPlayer.play();
          },
        ),
        const Expanded(
          child: LinearProgressIndicator(
            value: 0.5,
            backgroundColor: Colors.white24,
            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
          ),
        ),
        const SizedBox(width: 8),
        const Text(
          '

0:30',
          style: TextStyle(color: Colors.white, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildVideoThumbnail(String videoUrl) {
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 200,
          height: 150,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.videocam, color: Colors.white, size: 48),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.5),
            shape: BoxShape.circle,
          ),
          child: const IconButton(
            icon: Icon(Icons.play_arrow, color: Colors.white, size: 32),
            onPressed: null,
          ),
        ),
      ],
    );
  }

  void _showMessageOptions(ChatMessage message) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0A0A0A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.emoji_emotions, color: Color(0xFF00C6FF)),
                title: const Text('React', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  _showReactionPicker(message.id);
                },
              ),
              ListTile(
                leading: const Icon(Icons.translate, color: Color(0xFF00C6FF)),
                title: const Text('Translate', style: TextStyle(color: Colors.white)),
                onTap: () async {
                  Navigator.pop(context);
                  final translated = await _translator.translateText(message.content);
                  _showTranslation(translated);
                },
              ),
              ListTile(
                leading: const Icon(Icons.card_giftcard, color: Color(0xFF00C6FF)),
                title: const Text('Send Gift', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  _showGiftPicker(message.id);
                },
              ),
              ListTile(
                leading: const Icon(Icons.reply, color: Color(0xFF00C6FF)),
                title: const Text('Reply', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  _messageController.text = '@${message.senderId} ';
                },
              ),
              if (message.senderId == 'current_user_id')
                ListTile(
                  leading: const Icon(Icons.delete, color: Colors.red),
                  title: const Text('Delete', style: TextStyle(color: Colors.red)),
                  onTap: () {
                    Navigator.pop(context);
                    _deleteMessage(message.id);
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  void _showReactionPicker(String messageId) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF0A0A0A),
          title: const Text('React', style: TextStyle(color: Colors.white)),
          content: Wrap(
            spacing: 16,
            children: ['❤️', '😂', '😮', '😢', '🔥', '👍', '👏', '🎉'].map((emoji) {
              return GestureDetector(
                onTap: () {
                  Navigator.pop(context);
                  _addReaction(messageId, emoji);
                },
                child: Text(emoji, style: const TextStyle(fontSize: 32)),
              );
            }).toList(),
          ),
        );
      },
    );
  }

  void _showTranslation(String translatedText) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF0A0A0A),
          title: const Text('Translation', style: TextStyle(color: Colors.white)),
          content: Text(translatedText, style: const TextStyle(color: Colors.white)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close', style: TextStyle(color: Color(0xFF00C6FF))),
            ),
          ],
        );
      },
    );
  }

  void _showGiftPicker(String messageId) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0A0A0A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Send a Gift',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 24),
              GridView.count(
                crossAxisCount: 4,
                shrinkWrap: true,
                children: [
                  _buildGiftOption('Heart', '❤️', 10, messageId),
                  _buildGiftOption('Star', '⭐', 50, messageId),
                  _buildGiftOption('Diamond', '💎', 100, messageId),
                  _buildGiftOption('Crown', '👑', 500, messageId),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildGiftOption(String name, String emoji, int coins, String messageId) {
    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        _sendGift(messageId, name.toLowerCase());
      },
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(emoji, style: const TextStyle(fontSize: 40)),
          const SizedBox(height: 4),
          Text(name, style: const TextStyle(color: Colors.white, fontSize: 12)),
          Text('$coins 🪙', style: const TextStyle(color: Color(0xFF00C6FF), fontSize: 10)),
        ],
      ),
    );
  }

  Future<void> _deleteMessage(String messageId) async {
    await _firestore
        .collection('chats')
        .doc(widget.chatId)
        .collection('messages')
        .doc(messageId)
        .delete();
  }

  String _formatTime(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return '${timestamp.day}/${timestamp.month}/${timestamp.year}';
    }
  }

  Widget _buildSmartReplies() {
    if (!_showSmartReplies || _smartReplySuggestions.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _smartReplySuggestions.length,
        itemBuilder: (context, index) {
          final suggestion = _smartReplySuggestions[index];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ElevatedButton(
              onPressed: () {
                _messageController.text = suggestion;
                setState(() {
                  _showSmartReplies = false;
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0A0A0A),
                foregroundColor: const Color(0xFF00C6FF),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: const BorderSide(color: Color(0xFF00C6FF)),
                ),
              ),
              child: Text(suggestion),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0A0A),
        border: Border(
          top: BorderSide(color: const Color(0xFF00C6FF).withOpacity(0.3)),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Smart replies
          _buildSmartReplies(),
          
          const SizedBox(height: 8),
          
          // Input row
          Row(
            children: [
              // Media buttons
              IconButton(
                icon: const Icon(Icons.add_circle_outline, color: Color(0xFF00C6FF)),
                onPressed: _showMediaOptions,
              ),
              
              // Text input
              Expanded(
                child: TextField(
                  controller: _messageController,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.1),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.emoji_emotions_outlined, color: Color(0xFF00C6FF)),
                      onPressed: () {
                        setState(() {
                          _showEmojiPicker = !_showEmojiPicker;
                        });
                      },
                    ),
                  ),
                  maxLines: null,
                ),
              ),
              
              const SizedBox(width: 8),
              
              // Send/Voice button
              _messageController.text.isEmpty
                  ? GestureDetector(
                      onLongPressStart: (_) => _startVoiceRecording(),
                      onLongPressEnd: (_) => _stopVoiceRecording(),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
                          ),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _isRecording ? Icons.stop : Icons.mic,
                          color: Colors.white,
                        ),
                      ),
                    )
                  : GestureDetector(
                      onTap: () => _sendMessage(text: _messageController.text),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
                          ),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.send, color: Colors.white),
                      ),
                    ),
            ],
          ),
          
          // Emoji picker
          if (_showEmojiPicker)
            SizedBox(
              height: 250,
              child: EmojiPicker(
                onEmojiSelected: (category, emoji) {
                  _messageController.text += emoji.emoji;
                },
                config: const Config(
                  emojiViewConfig: EmojiViewConfig(
                    backgroundColor: Color(0xFF0A0A0A),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showMediaOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0A0A0A),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.image, color: Color(0xFF00C6FF)),
                title: const Text('Image', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  _pickMedia(MessageType.image);
                },
              ),
              ListTile(
                leading: const Icon(Icons.videocam, color: Color(0xFF00C6FF)),
                title: const Text('Video', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  _pickMedia(MessageType.video);
                },
              ),
              ListTile(
                leading: const Icon(Icons.phone, color: Color(0xFF00C6FF)),
                title: const Text('Voice Call', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  _startVoiceCall();
                },
              ),
              ListTile(
                leading: const Icon(Icons.video_call, color: Color(0xFF00C6FF)),
                title: const Text('Video Call', style: TextStyle(color: Colors.white)),
                onTap: () {
                  Navigator.pop(context);
                  _startVideoCall();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCallOverlay() {
    if (!_isInCall) return const SizedBox.shrink();

    return Container(
      color: Colors.black,
      child: Stack(
        children: [
          // Video views
          if (_isVideoCall && _agoraEngine != null)
            Center(
              child: AgoraVideoView(
                controller: VideoViewController(
                  rtcEngine: _agoraEngine!,
                  canvas: const VideoCanvas(uid: 0),
                ),
              ),
            ),
          
          // Call controls
          Positioned(
            bottom: 50,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                if (_isVideoCall)
                  _buildCallButton(
                    icon: Icons.flip_camera_ios,
                    onTap: () => _agoraEngine?.switchCamera(),
                  ),
                _buildCallButton(
                  icon: Icons.mic_off,
                  onTap: () {
                    // Toggle mute
                  },
                ),
                _buildCallButton(
                  icon: Icons.call_end,
                  color: Colors.red,
                  onTap: _endCall,
                ),
                if (_isVideoCall)
                  _buildCallButton(
                    icon: Icons.videocam_off,
                    onTap: () {
                      // Toggle video
                    },
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCallButton({
    required IconData icon,
    required VoidCallback onTap,
    Color color = const Color(0xFF00C6FF),
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 32),
      ),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _translator.close();
    _smartReply.close();
    _audioRecorder.dispose();
    _audioPlayer.dispose();
    _agoraEngine?.release();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: _isInCall
          ? null
          : AppBar(
              backgroundColor: const Color(0xFF0A0A0A),
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.recipientName,
                    style: const TextStyle(color: Colors.white, fontSize: 18),
                  ),
                  Text(
                    widget.isGroupChat ? '${_messages.length} members' : 'Online',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.6),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.phone, color: Color(0xFF00C6FF)),
                  onPressed: _startVoiceCall,
                ),
                IconButton(
                  icon: const Icon(Icons.video_call, color: Color(0xFF00C6FF)),
                  onPressed: _startVideoCall,
                ),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, color: Color(0xFF00C6FF)),
                  color: const Color(0xFF0A0A0A),
                  onSelected: (value) {
                    if (value == 'translate') {
                      setState(() {
                        _autoTranslateEnabled = !_autoTranslateEnabled;
                      });
                    } else if (value == 'disappearing') {
                      setState(() {
                        _disappearingMessagesEnabled = !_disappearingMessagesEnabled;
                      });
                    }
                  },
                  itemBuilder: (context) => [
                    PopupMenuItem(
                      value: 'translate',
                      child: Row(
                        children: [
                          Icon(
                            _autoTranslateEnabled ? Icons.check_box : Icons.check_box_outline_blank,
                            color: const Color(0xFF00C6FF),
                          ),
                          const SizedBox(width: 8),
                          const Text('Auto-translate', style: TextStyle(color: Colors.white)),
                        ],
                      ),
                    ),
                    PopupMenuItem(
                      value: 'disappearing',
                      child: Row(
                        children: [
                          Icon(
                            _disappearingMessagesEnabled ? Icons.check_box : Icons.check_box_outline_blank,
                            color: const Color(0xFF00C6FF),
                          ),
                          const SizedBox(width: 8),
                          const Text('Disappearing messages', style: TextStyle(color: Colors.white)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
      body: _isInCall
          ? _buildCallOverlay()
          : Column(
              children: [
                // Messages list
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    reverse: true,
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      return _buildMessageBubble(_messages[index]);
                    },
                  ),
                ),
                
                // Input bar
                _buildInputBar(),
              ],
            ),
    );
  }
}

// ========== DATA MODELS ==========

enum MessageType {
  text,
  audio,
  video,
  image,
}

class ChatMessage {
  final String id;
  final String senderId;
  final String content;
  final MessageType type;
  final DateTime timestamp;
  final String? audioUrl;
  final String? videoUrl;
  final String? imageUrl;
  final bool isDisappearing;
  final DateTime? disappearAt;

  ChatMessage({
    required this.id,
    required this.senderId,
    required this.content,
    required this.type,
    required this.timestamp,
    this.audioUrl,
    this.videoUrl,
    this.imageUrl,
    this.isDisappearing = false,
    this.disappearAt,
  });

  factory ChatMessage.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return ChatMessage(
      id: doc.id,
      senderId: data['senderId'] ?? '',
      content: data['content'] ?? '',
      type: MessageType.values[data['type'] ?? 0],
      timestamp: (data['timestamp'] as Timestamp).toDate(),
      audioUrl: data['audioUrl'],
      videoUrl: data['videoUrl'],
      imageUrl: data['imageUrl'],
      isDisappearing: data['isDisappearing'] ?? false,
      disappearAt: data['disappearAt'] != null
          ? (data['disappearAt'] as Timestamp).toDate()
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'senderId': senderId,
      'content': content,
      'type': type.index,
      'timestamp': Timestamp.fromDate(timestamp),
      if (audioUrl != null) 'audioUrl': audioUrl,
      if (videoUrl != null) 'videoUrl': videoUrl,
      if (imageUrl != null) 'imageUrl': imageUrl,
      'isDisappearing': isDisappearing,
      if (disappearAt != null) 'disappearAt': Timestamp.fromDate(disappearAt!),
    };
  }
}

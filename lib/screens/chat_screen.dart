
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import 'package:spaktok/models/chat_message.dart';
import 'package:spaktok/services/enhanced_chat_service.dart';
<<<<<<< HEAD
import 'package:spaktok/services/location_service.dart'; // New import
import 'package:flutter_screenshot_detect/flutter_screenshot_detect.dart';
import 'package:spaktok/widgets/location_sharing_bottom_sheet.dart'; // New import
=======
import 'package:spaktok/services/disappearing_messages_service.dart';
>>>>>>> origin/cursor/send-arabic-greeting-070f

class ChatScreen extends StatefulWidget {
  final String receiverId; // معرف المستلم
  final String receiverName; // اسم المستلم

  const ChatScreen({Key? key, required this.receiverId, required this.receiverName}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final EnhancedChatService _chatService = EnhancedChatService.instance;
<<<<<<< HEAD
  final LocationService _locationService = LocationService.instance; // New instance
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _currentUser; // المستخدم الحالي
  String? _chatRoomId;
  bool _isDisappearingEnabled = false;
  final FlutterScreenshotDetect _screenshotDetect = FlutterScreenshotDetect();
  final ImagePicker _picker = ImagePicker();
=======
  final DisappearingMessagesService _disappearingMessagesService = DisappearingMessagesService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _currentUser; // المستخدم الحالي
  String? _chatRoomId;
  bool _isDisappearingModeEnabled = false;
>>>>>>> origin/cursor/send-arabic-greeting-070f

  @override
  void initState() {
    super.initState();
    _currentUser = _auth.currentUser; // الحصول على المستخدم الحالي
    if (_currentUser == null) {
      _signInAnonymously();
    } else {
      _createChatRoom();
    }
    _screenshotDetect.startScreenshotListening((filePath) {
      _onScreenshotDetected();
    });
  }

  @override
  void dispose() {
    _screenshotDetect.stopScreenshotListening();
    _messageController.dispose();
    super.dispose();
  }

  void _onScreenshotDetected() {
    if (_chatRoomId != null && _currentUser != null) {
      // In a real app, you'd need to know which message was on screen.
      // For now, we'll send a generic notification.
      _chatService.sendScreenshotNotification(
        chatId: _chatRoomId!,
        userId: _currentUser!.uid,
        messageId: 'unknown_message_id', // This would ideally be the ID of the message being screenshotted
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Screenshot detected! Notification sent.")),
      );
    }
  }

  Future<void> _signInAnonymously() async {
    try {
      await _auth.signInAnonymously();
      setState(() {
        _currentUser = _auth.currentUser;
      });
      print("Signed in anonymously with UID: ${_currentUser?.uid}");
      _createChatRoom();
    } catch (e) {
      print("Error signing in anonymously: $e");
    }
  }

  Future<void> _createChatRoom() async {
    if (_currentUser != null && widget.receiverId != 'default') {
<<<<<<< HEAD
      _chatRoomId = await _chatService.createChatRoom(
        _currentUser!.uid,
        widget.receiverId,
      );
=======
      _chatRoomId = await _chatService.createChatRoom(widget.receiverId);
      if (_chatRoomId != null) {
        _loadDisappearingModeStatus();
      }
>>>>>>> origin/cursor/send-arabic-greeting-070f
      setState(() {});
    }
  }

  Future<void> _loadDisappearingModeStatus() async {
    if (_chatRoomId != null) {
      final bool enabled = await _disappearingMessagesService.isDisappearingMessagesEnabled(_chatRoomId!);
      setState(() {
        _isDisappearingModeEnabled = enabled;
      });
    }
  }

  Future<void> _toggleDisappearingMode(bool value) async {
    if (_chatRoomId != null) {
      await _disappearingMessagesService.toggleDisappearingMessages(
        chatId: _chatRoomId!,
        enabled: value,
      );
      setState(() {
        _isDisappearingModeEnabled = value;
      });
    }
  }

  void _sendMessage() async {
    if (_messageController.text.isNotEmpty && _currentUser != null && _chatRoomId != null) {
<<<<<<< HEAD
      await _chatService.sendMessage(
        chatRoomId: _chatRoomId!,
        senderId: _currentUser!.uid,
        text: _messageController.text,
        isEphemeral: _isDisappearingEnabled,
      );
=======
      if (_isDisappearingModeEnabled) {
        await _disappearingMessagesService.sendDisappearingMessage(
          chatId: _chatRoomId!,
          senderId: _currentUser!.uid,
          receiverId: widget.receiverId,
          content: _messageController.text,
          type: 'text',
          disappearAfterSeconds: 10, // Example: messages disappear after 10 seconds
        );
      } else {
        await _chatService.sendMessage(
          chatRoomId: _chatRoomId!,
          message: _messageController.text,
        );
      }
>>>>>>> origin/cursor/send-arabic-greeting-070f
      _messageController.clear();
    }
  }

  Future<void> _sendMedia(ImageSource source) async {
    final XFile? file = await _picker.pickImage(source: source);
    if (file != null && _currentUser != null && _chatRoomId != null) {
      // Upload media to Firebase Storage and get URL
      final String? mediaUrl = await _chatService.uploadChatMedia(file.path, _currentUser!.uid);
      if (mediaUrl != null) {
        await _chatService.sendMessage(
          chatRoomId: _chatRoomId!,
          senderId: _currentUser!.uid,
          mediaUrl: mediaUrl,
          mediaType: file.mimeType?.startsWith('image') == true ? 'image' : 'video', // Basic type detection
          isEphemeral: _isDisappearingEnabled,
        );
      }
    }
  }

  void _showLocationSharingBottomSheet() {
    showModalBottomSheet(
      context: context,
      builder: (context) => LocationSharingBottomSheet(
        onShareLocation: (privacy, friends, isLive, expiresAt) async {
          // Call the Cloud Function to update location
          await _locationService.updateUserLocation(
            latitude: 0.0, // Placeholder, actual location from device
            longitude: 0.0, // Placeholder, actual location from device
            locationPrivacy: privacy,
            sharedWithFriends: friends,
            isLiveLocationSharing: isLive,
            liveLocationExpiresAt: expiresAt,
          );
          Navigator.pop(context);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Location sharing settings updated.")),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUser == null || _chatRoomId == null) {
      return Scaffold(
        appBar: AppBar(title: Text('Chat with ${widget.receiverName}')), 
        body: const Center(child: CircularProgressIndicator()),
      ); 
    }

    return Scaffold(
      appBar: AppBar(
        title: Text('Chat with ${widget.receiverName}'),
        actions: [
<<<<<<< HEAD
          IconButton(
            icon: Icon(_isDisappearingEnabled ? Icons.visibility_off : Icons.visibility),
            onPressed: () {
              setState(() {
                _isDisappearingEnabled = !_isDisappearingEnabled;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text("Disappearing messages: ${_isDisappearingEnabled ? 'ON' : 'OFF'}")),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.location_on),
            onPressed: _showLocationSharingBottomSheet,
=======
          Row(
            children: [
              const Text('Disappearing Mode'),
              Switch(
                value: _isDisappearingModeEnabled,
                onChanged: _toggleDisappearingMode,
              ),
            ],
>>>>>>> origin/cursor/send-arabic-greeting-070f
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              stream: _chatService.getMessages(_chatRoomId!),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final messages = snapshot.data!.docs.map((doc) => ChatMessage.fromJson(doc.data() as Map<String, dynamic>)).toList();
                return ListView.builder(
                  reverse: true,
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    final isMe = message.senderId == _currentUser!.uid;
                    
                    // Mark message as read if it's a disappearing message and not sent by current user
                    if (message.isDisappearing && !isMe && !message.isRead) {
                      _disappearingMessagesService.markAsRead(_chatRoomId!, message.id);
                    }

                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 5, horizontal: 10),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isMe ? Colors.blueAccent : Colors.grey[300],
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: Column(
<<<<<<< HEAD
                          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                          children: [
                            if (message.text != null) Text(
                              message.text!,
                              style: TextStyle(color: isMe ? Colors.white : Colors.black),
                            ),
                            if (message.mediaUrl != null) Image.network(
                              message.mediaUrl!,
                              width: 150,
                              height: 150,
                              fit: BoxFit.cover,
                            ),
                            Text(
                              '${message.timestamp?.toDate().toLocal().hour}:${message.timestamp?.toDate().toLocal().minute}',
                              style: TextStyle(fontSize: 10, color: isMe ? Colors.white70 : Colors.black54),
                            ),
                            if (message.isEphemeral == true) const Text(
                              'Disappearing message',
                              style: TextStyle(fontSize: 10, color: Colors.redAccent),
                            ),
=======
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              message.content,
                              style: TextStyle(color: isMe ? Colors.white : Colors.black),
                            ),
                            if (message.isDisappearing) 
                              Text(
                                'Disappearing message' + (message.disappearsAt != null ? ' until ${message.disappearsAt!.toDate().toLocal().hour}:${message.disappearsAt!.toDate().toLocal().minute}' : ''),
                                style: TextStyle(fontSize: 10, color: isMe ? Colors.white70 : Colors.black54),
                              ),
>>>>>>> origin/cursor/send-arabic-greeting-070f
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.photo),
                  onPressed: () => _sendMedia(ImageSource.gallery),
                ),
                IconButton(
                  icon: const Icon(Icons.camera_alt),
                  onPressed: () => _sendMedia(ImageSource.camera),
                ),
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: const InputDecoration(
                      hintText: "Enter message",
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


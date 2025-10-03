import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:spaktok/models/chat_message.dart';
import 'package:spaktok/services/enhanced_chat_service.dart';
import 'package:flutter_screenshot_detect/flutter_screenshot_detect.dart';


class ChatScreen extends StatefulWidget {
  final String receiverId; // معرف المستلم
  final String receiverName; // اسم المستلم

  const ChatScreen({Key? key, this.receiverId = 'default', this.receiverName = 'Chat'}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final EnhancedChatService _chatService = EnhancedChatService.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _currentUser; // المستخدم الحالي
  String? _chatRoomId;
  bool _isDisappearingEnabled = false;
  final FlutterScreenshotDetect _screenshotDetect = FlutterScreenshotDetect();

  @override
  void initState() {
    super.initState();
    _currentUser = _auth.currentUser; // الحصول على المستخدم الحالي
    if (_currentUser == null) {
      // إذا لم يكن هناك مستخدم مسجل الدخول، قم بتسجيل الدخول كمستخدم تجريبي
      _signInAnonymously();
    } else {
      _createChatRoom();
    }
    _screenshotDetect.addListener(_onScreenshotDetected);
  }

  @override
  void dispose() {
    _screenshotDetect.removeListener(_onScreenshotDetected);
    super.dispose();
  }

  void _onScreenshotDetected() {
    if (_chatRoomId != null && _currentUser != null) {
      // This is a placeholder. In a real app, you'd need to know which message was on screen.
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
      _chatRoomId = await _chatService.createChatRoom(widget.receiverId);
      setState(() {});
    }
  }

  void _sendMessage() async {
    if (_messageController.text.isNotEmpty && _currentUser != null && _chatRoomId != null) {
      await _chatService.sendMessage(
        chatRoomId: _chatRoomId!,
        message: _messageController.text,
      );
      _messageController.clear();
    }
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
      appBar: AppBar(title: Text('Chat with ${widget.receiverName}')),
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
                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 5, horizontal: 10),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: isMe ? Colors.blueAccent : Colors.grey[300],
                          borderRadius: BorderRadius.circular(15),
                        ),
                        child: Text(
                          message.content,
                          style: TextStyle(color: isMe ? Colors.white : Colors.black),
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
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: "Enter message",
                      border: const OutlineInputBorder(),
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


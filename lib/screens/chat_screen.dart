import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:spaktok/lib/models/chat_message.dart';
import 'package:spaktok/lib/services/chat_service.dart';

class ChatScreen extends StatefulWidget {
  final String receiverId; // معرف المستلم
  final String receiverName; // اسم المستلم

  const ChatScreen({Key? key, required this.receiverId, required this.receiverName}) : super(key: key);

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ChatService _chatService = ChatService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _currentUser; // المستخدم الحالي

  @override
  void initState() {
    super.initState();
    _currentUser = _auth.currentUser; // الحصول على المستخدم الحالي
    if (_currentUser == null) {
      // إذا لم يكن هناك مستخدم مسجل الدخول، قم بتسجيل الدخول كمستخدم تجريبي
      _signInAnonymously();
    }
  }

  Future<void> _signInAnonymously() async {
    try {
      await _auth.signInAnonymously();
      setState(() {
        _currentUser = _auth.currentUser;
      });
      print("Signed in anonymously with UID: ${_currentUser?.uid}");
    } catch (e) {
      print("Error signing in anonymously: $e");
    }
  }

  void _sendMessage() async {
    if (_messageController.text.isNotEmpty && _currentUser != null) {
      await _chatService.sendMessage(
        senderId: _currentUser!.uid,
        receiverId: widget.receiverId,
        content: _messageController.text,
        isDisappearing: false, // يمكن تغييرها لاحقًا
      );
      _messageController.clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUser == null) {
      return const Scaffold(
        appBar: AppBar(title: Text('Chat')), 
        body: Center(child: CircularProgressIndicator()),
      ); 
    }

    return Scaffold(
      appBar: AppBar(title: Text('Chat with ${widget.receiverName}')),
      body: Column(
        children: [
          Expanded(
            child: StreamBuilder<List<ChatMessage>>(
              stream: _chatService.getChatMessages(_currentUser!.uid, widget.receiverId),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                final messages = snapshot.data ?? [];
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
                    decoration: const InputDecoration(
                      hintText: 'Enter message',
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


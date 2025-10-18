import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Placeholder for current user ID
  final String _currentUserId = 'user123'; 
  final String _currentUsername = 'TestUser';

  void _sendMessage() async {
    if (_messageController.text.trim().isEmpty) {
      return;
    }
    try {
      await _firestore.collection('messages').add({
        'text': _messageController.text.trim(),
        'senderId': _currentUserId,
        'senderUsername': _currentUsername,
        'timestamp': Timestamp.now(),
      });
      _messageController.clear();
    } catch (e) {
      print('Error sending message: $e');
      // Optionally show an error to the user
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: StreamBuilder<QuerySnapshot>(
            stream: _firestore.collection('messages').orderBy('timestamp', descending: true).snapshots(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }
              final messages = snapshot.data!.docs;
              return ListView.builder(
                reverse: true,
                itemCount: messages.length,
                itemBuilder: (context, index) {
                  final message = messages[index];
                  final messageText = message['text'];
                  final messageSender = message['senderUsername'];
                  final isMe = message['senderId'] == _currentUserId;

                  return Align(
                    alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 8.0),
                      padding: const EdgeInsets.all(10.0),
                      decoration: BoxDecoration(
                        color: isMe ? Colors.blueAccent : Colors.grey[300],
                        borderRadius: BorderRadius.circular(12.0),
                      ),
                      child: Column(
                        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                        children: [
                          Text(
                            messageSender,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isMe ? Colors.white : Colors.black,
                            ),
                          ),
                          Text(
                            messageText,
                            style: TextStyle(color: isMe ? Colors.white : Colors.black),
                          ),
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
              Expanded(
                child: TextField(
                  controller: _messageController,
                  decoration: InputDecoration(
                    hintText: 'Enter your message...', 
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(20.0)),
                  ),
                  onSubmitted: (_) => _sendMessage(),
                ),
              ),
              const SizedBox(width: 8.0),
              FloatingActionButton(
                onPressed: _sendMessage,
                child: const Icon(Icons.send),
              ),
            ],
          ),
        ),
      ],
    );
  }
}


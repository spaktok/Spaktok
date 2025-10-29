import 'dart:async';
import 'package:flutter/material.dart';
import 'package:spaktok/models/chat_message.dart';
import 'package:spaktok/services/chat_service.dart';
import 'package:spaktok/services/auth_service.dart';

class ChatScreen extends StatefulWidget {
  final String receiverId;
  final String receiverName;

  const ChatScreen({super.key, required this.receiverId, required this.receiverName});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ChatService _chatService = ChatService();
  final AuthService _authService = AuthService();
  final TextEditingController _textController = TextEditingController();
  String? _chatRoomId;
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _setupChat();
    _textController.addListener(_handleTyping);
  }

  void _setupChat() async {
    final currentUserId = _authService.currentUser?.uid;
    if (currentUserId == null) return;
    final chatRoomId = await _chatService.getChatRoomId(currentUserId, widget.receiverId);
    setState(() => _chatRoomId = chatRoomId);
  }

  void _handleTyping() {
    if (_chatRoomId == null) return;
    final currentlyTyping = _textController.text.isNotEmpty;
    if (_isTyping != currentlyTyping) {
      setState(() => _isTyping = currentlyTyping);
      _chatService.setTypingStatus(_chatRoomId!, _authService.currentUser!.uid, _isTyping);
    }
  }

  @override
  void dispose() {
    _textController.removeListener(_handleTyping);
    _textController.dispose();
    if (_chatRoomId != null) {
      _chatService.setTypingStatus(_chatRoomId!, _authService.currentUser!.uid, false);
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.receiverName),
            _buildTypingIndicator(),
          ],
        ),
      ),
      body: _chatRoomId == null
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(child: _buildMessagesList()),
                _buildInputField(),
              ],
            ),
    );
  }

  Widget _buildTypingIndicator() {
    return StreamBuilder<bool>(
      stream: _chatService.getTypingStatus(_chatRoomId!, widget.receiverId),
      builder: (context, snapshot) {
        if (snapshot.data == true) {
          return const Text('typing...', style: TextStyle(fontSize: 12, color: Colors.grey));
        }
        return const SizedBox.shrink();
      },
    );
  }

  Widget _buildMessagesList() {
    return StreamBuilder<List<ChatMessage>>(
      stream: _chatService.getMessages(_chatRoomId!),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
        final messages = snapshot.data!;
        return ListView.builder(
          reverse: true,
          padding: const EdgeInsets.all(8.0),
          itemCount: messages.length,
          itemBuilder: (context, index) {
            final message = messages[index];
            final isMe = message.senderId == _authService.currentUser?.uid;
            return MessageBubble(message: message, isMe: isMe);
          },
        );
      },
    );
  }

  Widget _buildInputField() {
    return Container(
      padding: const EdgeInsets.all(8.0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _textController,
              decoration: InputDecoration(hintText: 'Message...', border: OutlineInputBorder(borderRadius: BorderRadius.circular(20))),
            ),
          ),
          IconButton(
            icon: Icon(_isTyping ? Icons.send : Icons.mic),
            onPressed: _isTyping ? _sendTextMessage : _sendAudioMessage,
          ),
        ],
      ),
    );
  }

  void _sendTextMessage() {
    if (_textController.text.isEmpty) return;
    final message = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      chatRoomId: _chatRoomId!,
      senderId: _authService.currentUser!.uid,
      type: MessageType.text,
      text: _textController.text,
      timestamp: Timestamp.now(),
    );
    _chatService.sendMessage(message);
    _textController.clear();
  }

  void _sendAudioMessage() {
    // Placeholder for audio recording logic
  }
}

// A separate widget for the message bubble for cleaner code
class MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;

  const MessageBubble({super.key, required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isMe ? Theme.of(context).primaryColor : Colors.grey[300],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message.text ?? '', style: TextStyle(color: isMe ? Colors.white : Colors.black)),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(message.timestamp.toDate().toLocal().toString().substring(11, 16), style: TextStyle(fontSize: 10, color: isMe ? Colors.white70 : Colors.black54)),
                if (isMe) ...[const SizedBox(width: 4), _buildStatusIcon(message.status)],
              ],
            )
          ],
        ),
      ),
    );
  }

  Widget _buildStatusIcon(MessageStatus status) {
    switch (status) {
      case MessageStatus.read:
        return const Icon(Icons.done_all, size: 14, color: Colors.blue);
      case MessageStatus.delivered:
        return const Icon(Icons.done_all, size: 14, color: Colors.white70);
      case MessageStatus.sent:
        return const Icon(Icons.done, size: 14, color: Colors.white70);
      default: // sending
        return const Icon(Icons.watch_later_outlined, size: 12, color: Colors.white70);
    }
  }
}

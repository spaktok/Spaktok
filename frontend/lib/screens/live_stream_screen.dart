import 'package:flutter/material.dart';
import 'package:flutter_webrtc/flutter_webrtc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'dart:convert';
import 'package:permission_handler/permission_handler.dart';

class LiveStreamScreen extends StatefulWidget {
  const LiveStreamScreen({super.key});

  @override
  State<LiveStreamScreen> createState() => _LiveStreamScreenState();
}

class _LiveStreamScreenState extends State<LiveStreamScreen> {
  final _localRenderer = RTCVideoRenderer();
  MediaStream? _localStream;
  late IO.Socket _socket;

  @override
  void initState() {
    super.initState();
    initRenderers();
    _startLiveStream();
    _initSocket();
  }

  @override
  void dispose() {
    _socket.dispose();
    _localRenderer.dispose();
    _localStream?.dispose();
    super.dispose();
  }

  Future<void> initRenderers() async {
    await _localRenderer.initialize();
  }

  Future<void> _startLiveStream() async {
    // Request permissions
    await _handleCameraAndMicPermissions();

    // Get local media stream
    _localStream = await navigator.mediaDevices.getUserMedia({
      'audio': true,
      'video': {
        'facingMode': 'user',
      },
    });

    _localRenderer.srcObject = _localStream;
    setState(() {});
  }

  Future<void> _handleCameraAndMicPermissions() async {
    await [Permission.camera, Permission.microphone].request();
  }

  void _initSocket() {
    _socket = IO.io(
      const String.fromEnvironment('BACKEND_URL', defaultValue: 'http://localhost:5000'),
      IO.OptionBuilder().setTransports(['websocket']).disableAutoConnect().build(),
    );
    _socket.connect();
  }

  void _sendGift(String giftType, int value) {
    final roomId = 'test-room';
    final payload = {
      'roomId': roomId,
      'senderId': 'user123',
      'senderName': 'TestUser',
      'giftType': giftType,
      'giftValue': value,
    };
    _socket.emit('live:gift', payload);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Stream'),
      ),
      body: Stack(
        children: [
          Center(child: RTCVideoView(_localRenderer)),
          Positioned(
            bottom: 24,
            right: 24,
            child: Column(
              children: [
                FloatingActionButton.extended(
                  onPressed: () => _sendGift('heart', 10),
                  label: const Text('Send Heart'),
                  icon: const Icon(Icons.favorite),
                ),
                const SizedBox(height: 12),
                FloatingActionButton.extended(
                  onPressed: () => _sendGift('star', 25),
                  label: const Text('Send Star'),
                  icon: const Icon(Icons.star),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}


import 'package:flutter/material.dart';
import 'package:spaktok/services/live_stream_service.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/screens/live_stream_screen.dart';

class StartStreamScreen extends StatefulWidget {
  const StartStreamScreen({super.key});

  @override
  State<StartStreamScreen> createState() => _StartStreamScreenState();
}

class _StartStreamScreenState extends State<StartStreamScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final AuthService _authService = AuthService();
  
  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  Future<void> _startStream() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final currentUser = _authService.currentUser;
    if (currentUser == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('You must be logged in to start a stream.')));
        return;
    }

    setState(() => _isLoading = true);

    try {
      final channelName = currentUser.uid; // Use user ID as a unique channel name
      final liveStreamService = LiveStreamService(channelName: channelName);

      // Set initial stream data in Firestore
      await liveStreamService.createStream(title: _titleController.text.trim());

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => LiveStreamScreen(
              channelName: channelName,
              broadcasterId: currentUser.uid,
              isBroadcaster: true,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to start stream: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Go Live'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(
                  Icons.live_tv_rounded,
                  size: 80,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 24),
                
                TextFormField(
                  controller: _titleController,
                  decoration: InputDecoration(
                    labelText: 'Stream Title',
                    hintText: 'e.g., Playing guitar and singing!',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a title for your stream';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 32),
                
                ElevatedButton.icon(
                  onPressed: _isLoading ? null : _startStream,
                  icon: const Icon(Icons.play_circle_fill),
                  label: const Text('Start Streaming', style: TextStyle(fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                if (_isLoading) ...[
                  const SizedBox(height: 16),
                  const Center(child: CircularProgressIndicator()),
                ],
                const SizedBox(height: 32),
                
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Tips for a great stream:', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 12),
                        _buildTip('Ensure good lighting and clear audio.'),
                        _buildTip('Maintain a stable internet connection.'),
                        _buildTip('Engage with your viewers and have fun!'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTip(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Row(
        children: [const Text('• '), Expanded(child: Text(text))],
      ),
    );
  }
}

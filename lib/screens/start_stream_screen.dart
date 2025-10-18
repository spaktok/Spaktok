import 'package:flutter/material.dart';
import 'package:spaktok/services/stream_service.dart';
import 'package:spaktok/screens/enhanced_live_stream_screen.dart';

class StartStreamScreen extends StatefulWidget {
  const StartStreamScreen({Key? key}) : super(key: key);

  @override
  State<StartStreamScreen> createState() => _StartStreamScreenState();
}

class _StartStreamScreenState extends State<StartStreamScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _streamService = StreamService();
  
  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _startStream() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Generate a unique channel name
      final channelName = 'stream_${DateTime.now().millisecondsSinceEpoch}';
      
      // Create stream in Firestore
      final streamId = await _streamService.createStream(
        title: _titleController.text.trim(),
        channelName: channelName,
        description: _descriptionController.text.trim(),
      );

      if (mounted) {
        // Navigate to live stream screen
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => EnhancedLiveStreamScreen(
              streamId: streamId,
              channelName: channelName,
              isHost: true,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to start stream: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Start Live Stream'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Icon
                Icon(
                  Icons.videocam_rounded,
                  size: 80,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: 24),
                
                Text(
                  'Go Live!',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                
                Text(
                  'Share your moments with the world',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                
                // Title field
                TextFormField(
                  controller: _titleController,
                  decoration: InputDecoration(
                    labelText: 'Stream Title',
                    hintText: 'What are you streaming?',
                    prefixIcon: const Icon(Icons.title),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a title';
                    }
                    if (value.length < 3) {
                      return 'Title must be at least 3 characters';
                    }
                    return null;
                  },
                  maxLength: 50,
                ),
                const SizedBox(height: 16),
                
                // Description field
                TextFormField(
                  controller: _descriptionController,
                  decoration: InputDecoration(
                    labelText: 'Description (Optional)',
                    hintText: 'Tell viewers what to expect',
                    prefixIcon: const Icon(Icons.description),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  maxLines: 3,
                  maxLength: 200,
                ),
                const SizedBox(height: 32),
                
                // Start stream button
                ElevatedButton(
                  onPressed: _isLoading ? null : _startStream,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.play_circle_fill),
                            SizedBox(width: 8),
                            Text(
                              'Start Streaming',
                              style: TextStyle(fontSize: 16),
                            ),
                          ],
                        ),
                ),
                const SizedBox(height: 16),
                
                // Tips card
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.lightbulb_outline,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Tips for a great stream',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildTip('Make sure you have good lighting'),
                        _buildTip('Check your internet connection'),
                        _buildTip('Interact with your viewers'),
                        _buildTip('Be yourself and have fun!'),
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
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 16)),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

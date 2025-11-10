import 'dart:io';
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:spaktok/services/reel_service.dart';
import 'package:spaktok/services/story_service.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:firebase_auth/firebase_auth.dart';

class PreviewScreen extends StatefulWidget {
  final String filePath;
  final String fileType; // 'photo' or 'video'
  final String captureMode; // 'Reel' or 'Story'

  const PreviewScreen({
    super.key,
    required this.filePath,
    required this.fileType,
    required this.captureMode,
  });

  @override
  State<PreviewScreen> createState() => _PreviewScreenState();
}

class _PreviewScreenState extends State<PreviewScreen> {
  VideoPlayerController? _videoController;
  final ReelService _reelService = ReelService();
  final StoryService _storyService = StoryService();
  final AuthService _authService = AuthService();
  final TextEditingController _descriptionController = TextEditingController();

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.fileType == 'video') {
      _videoController = VideoPlayerController.file(File(widget.filePath))
        ..initialize().then((_) {
          setState(() {});
          _videoController!.play();
          _videoController!.setLooping(true);
        });
    }
  }

  @override
  void dispose() {
    _videoController?.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handlePost() async {
    final User? currentUser = _authService.currentUser;
    if (currentUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('You must be logged in to post.')));
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final File mediaFile = File(widget.filePath);
      
      if (widget.captureMode == 'Reel') {
        await _reelService.uploadReel(
          userId: currentUser.uid,
          videoFile: mediaFile,
          description: _descriptionController.text,
        );
      } else if (widget.captureMode == 'Story') {
        int duration = 5; // Default for images
        if (widget.fileType == 'video' && _videoController != null) {
          duration = _videoController!.value.duration.inSeconds;
        }
        await _storyService.uploadStory(
          userId: currentUser.uid,
          mediaFile: mediaFile,
          mediaType: widget.fileType,
          duration: duration,
        );
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${widget.captureMode} posted successfully!')),
        );
        // Pop all the way back to the main navigation screen
        Navigator.of(context).popUntil((route) => route.isFirst);
      }

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error posting: $e')),
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
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Center(
            child: widget.fileType == 'photo'
                ? Image.file(File(widget.filePath))
                : _videoController != null && _videoController!.value.isInitialized
                    ? AspectRatio(
                        aspectRatio: _videoController!.value.aspectRatio,
                        child: VideoPlayer(_videoController!),
                      )
                    : const CircularProgressIndicator(),
          ),
          _buildTopControls(),
          _buildBottomContent(),
          if (_isLoading)
            Container(
              color: Colors.black.withValues(alpha: 0.5),
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }

  Widget _buildTopControls() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.close, color: Colors.white, size: 30),
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBottomContent() {
    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [Colors.black.withValues(alpha: 0.7), Colors.transparent],
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.captureMode == 'Reel')
              TextField(
                controller: _descriptionController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  hintText: 'Add a description...',
                  hintStyle: TextStyle(color: Colors.grey[400]),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey[600]!),
                  ),
                  filled: true,
                  fillColor: Colors.black.withValues(alpha: 0.5),
                ),
              ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _isLoading ? null : _handlePost,
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                padding: const EdgeInsets.symmetric(horizontal: 50, vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: _isLoading 
                  ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white))
                  : Text('Post ${widget.captureMode}', style: const TextStyle(fontSize: 16, color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }
}

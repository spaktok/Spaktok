import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/duet_stitch_service.dart';
import '../services/cloudflare_api_service.dart';

class DuetStitchScreen extends StatefulWidget {
  final String originalVideoId;
  final String mode; // 'duet' or 'stitch'

  const DuetStitchScreen({
    Key? key,
    required this.originalVideoId,
    required this.mode,
  }) : super(key: key);

  @override
  State<DuetStitchScreen> createState() => _DuetStitchScreenState();
}

class _DuetStitchScreenState extends State<DuetStitchScreen> {
  final DuetStitchService _duetStitchService = DuetStitchService();
  final FirebaseAuth _auth = FirebaseAuth.instance;

  VideoPlayerController? _originalController;
  bool _isLoading = true;
  bool _isProcessing = false;
  Map<String, dynamic>? _originalVideo;
  String? _userVideoPath;
  VideoPlayerController? _userController;

  // Stitch settings
  double _stitchStartTime = 0;
  double _stitchDuration = 5;
  double _maxStitchDuration = 15;

  @override
  void initState() {
    super.initState();
    _loadOriginalVideo();
  }

  Future<void> _loadOriginalVideo() async {
    try {
      // Fetch video metadata from Cloudflare D1 via Workers
      final video =
          await CloudflareApiService().getVideoById(widget.originalVideoId);
      if (video == null) {
        throw Exception('Video not found');
      }

      // Check permissions
      if (widget.mode == 'duet') {
        final canDuet =
            await _duetStitchService.canDuet(widget.originalVideoId);
        if (!canDuet) {
          throw Exception('Duets not allowed for this video');
        }
      } else {
        final canStitch =
            await _duetStitchService.canStitch(widget.originalVideoId);
        if (!canStitch) {
          throw Exception('Stitches not allowed for this video');
        }
      }

      _originalController = VideoPlayerController.network(video['videoUrl']);
      await _originalController!.initialize();
      await _originalController!.setLooping(true);
      await _originalController!.play();

      setState(() {
        _originalVideo = video;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
        Navigator.pop(context);
      }
    }
  }

  Future<void> _recordVideo() async {
    // Navigate to camera screen to record
    // For now, use image picker for demo
    try {
      // TODO: Navigate to camera recording screen
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Open camera to record your video')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _createDuetOrStitch() async {
    if (_userVideoPath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please record your video first')),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      String? outputPath;

      final userId = _auth.currentUser?.uid ?? 'unknown';

      if (widget.mode == 'duet') {
        // Create duet
        outputPath = await _duetStitchService.createDuet(
          originalVideoUrl: _originalVideo!['videoUrl'],
          duetVideoPath: _userVideoPath!,
          userId: userId,
        );
      } else {
        // Create stitch
        outputPath = await _duetStitchService.createStitch(
          originalVideoUrl: _originalVideo!['videoUrl'],
          stitchVideoPath: _userVideoPath!,
          userId: userId,
          clipStartTime: _stitchStartTime,
          clipDuration: _stitchDuration,
        );
      }

      // Upload
      Map<String, dynamic>? result;
      if (widget.mode == 'duet') {
        result = await _duetStitchService.uploadDuet(
          duetVideoPath: outputPath,
          userId: userId,
          originalVideoId: widget.originalVideoId,
          caption: 'Duet with @${_originalVideo!['username']}',
        );
      } else {
        result = await _duetStitchService.uploadStitch(
          stitchVideoPath: outputPath,
          userId: userId,
          originalVideoId: widget.originalVideoId,
          caption: 'Stitch with @${_originalVideo!['username']}',
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(
                  '${widget.mode == 'duet' ? 'Duet' : 'Stitch'} created successfully!')),
        );
        Navigator.pop(context, result['id']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text(widget.mode == 'duet' ? 'Create Duet' : 'Create Stitch'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Video preview section
                Expanded(
                  child: widget.mode == 'duet'
                      ? _buildDuetPreview()
                      : _buildStitchPreview(),
                ),

                // Controls section
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey[900],
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(20),
                    ),
                  ),
                  child: SafeArea(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (widget.mode == 'stitch') _buildStitchControls(),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: _isProcessing ? null : _recordVideo,
                                icon: const Icon(Icons.videocam),
                                label: Text(_userVideoPath == null
                                    ? 'Record Video'
                                    : 'Re-record'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.grey[800],
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed:
                                    _isProcessing || _userVideoPath == null
                                        ? null
                                        : _createDuetOrStitch,
                                icon: _isProcessing
                                    ? const SizedBox(
                                        width: 20,
                                        height: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Icon(Icons.check),
                                label: Text(widget.mode == 'duet'
                                    ? 'Create Duet'
                                    : 'Create Stitch'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.pink,
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 16),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildDuetPreview() {
    return Row(
      children: [
        // Original video (left)
        Expanded(
          child: Stack(
            alignment: Alignment.center,
            children: [
              if (_originalController != null &&
                  _originalController!.value.isInitialized)
                AspectRatio(
                  aspectRatio: 9 / 16,
                  child: VideoPlayer(_originalController!),
                ),
              Positioned(
                bottom: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '@${_originalVideo!['username']}',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),

        // Divider
        Container(width: 2, color: Colors.white24),

        // User video (right)
        Expanded(
          child: _userController != null
              ? AspectRatio(
                  aspectRatio: 9 / 16,
                  child: VideoPlayer(_userController!),
                )
              : Container(
                  color: Colors.grey[900],
                  child: const Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.videocam, size: 64, color: Colors.white54),
                        SizedBox(height: 16),
                        Text(
                          'Your video\nwill appear here',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.white54),
                        ),
                      ],
                    ),
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildStitchPreview() {
    return Stack(
      alignment: Alignment.center,
      children: [
        if (_originalController != null &&
            _originalController!.value.isInitialized)
          AspectRatio(
            aspectRatio: 9 / 16,
            child: VideoPlayer(_originalController!),
          ),
        Positioned(
          top: 16,
          left: 16,
          right: 16,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Clip: ${_stitchStartTime.toStringAsFixed(1)}s - ${(_stitchStartTime + _stitchDuration).toStringAsFixed(1)}s',
                  style: const TextStyle(color: Colors.white),
                ),
                const SizedBox(height: 4),
                Text(
                  'Your video will play after this clip',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStitchControls() {
    final maxDuration =
        _originalController?.value.duration.inSeconds.toDouble() ?? 60;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Select clip to stitch',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            const Text('Start:', style: TextStyle(color: Colors.white70)),
            Expanded(
              child: Slider(
                value: _stitchStartTime,
                max: maxDuration - _stitchDuration,
                onChanged: (value) {
                  setState(() => _stitchStartTime = value);
                  _originalController?.seekTo(Duration(seconds: value.toInt()));
                },
                activeColor: Colors.pink,
              ),
            ),
            Text(
              '${_stitchStartTime.toStringAsFixed(1)}s',
              style: const TextStyle(color: Colors.white),
            ),
          ],
        ),
        Row(
          children: [
            const Text('Length:', style: TextStyle(color: Colors.white70)),
            Expanded(
              child: Slider(
                value: _stitchDuration,
                min: 1,
                max: _maxStitchDuration,
                onChanged: (value) {
                  setState(() => _stitchDuration = value);
                },
                activeColor: Colors.pink,
              ),
            ),
            Text(
              '${_stitchDuration.toStringAsFixed(1)}s',
              style: const TextStyle(color: Colors.white),
            ),
          ],
        ),
      ],
    );
  }

  @override
  void dispose() {
    _originalController?.dispose();
    _userController?.dispose();
    super.dispose();
  }
}

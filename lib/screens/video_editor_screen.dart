import 'package:flutter/material.dart';
import 'package:ffmpeg_kit_flutter_min/ffmpeg_kit.dart';
import 'package:ffmpeg_kit_flutter_min/return_code.dart';

class VideoEditorScreen extends StatefulWidget {
  final String videoPath;
  const VideoEditorScreen({super.key, required this.videoPath});

  @override
  State<VideoEditorScreen> createState() => _VideoEditorScreenState();
}

class _VideoEditorScreenState extends State<VideoEditorScreen> {
  // Player is removed, we'll use a simple VideoPlayer for playback
  // For actual editing, we use FFmpegKit
  double _trimStart = 0.0;
  double _trimEnd = 10.0; // Placeholder for video duration
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    // In a real app, you would initialize a VideoPlayerController here
    // and get the video duration to set _trimEnd.
  }

  @override
  void dispose() {
    // Dispose VideoPlayerController here
    super.dispose();
  }

  Future<void> _trimAndConvertVideo() async {
    setState(() {
      _isProcessing = true;
    });

    final inputPath = widget.videoPath;
    final outputPath = inputPath.replaceAll('.mp4', '_trimmed.mp4');
    
    // FFmpeg command to trim the video: -ss (start time) -to (end time)
    final command = '-i $inputPath -ss $_trimStart -to $_trimEnd -c copy $outputPath';

    final session = await FFmpegKit.execute(command);
    final returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تم قص الفيديو بنجاح! المسار: $outputPath')),
      );
      // يمكنك الآن استخدام outputPath للمعاينة أو الرفع
    } else {
      final output = await session.getOutput();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل قص الفيديو: $output')),
      );
    }

    setState(() {
      _isProcessing = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Video Editor'),
        actions: [
          IconButton(
            icon: const Icon(Icons.check),
            onPressed: () {
              // Finalize and upload logic goes here
              Navigator.pop(context, widget.videoPath);
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          children: [
            // Placeholder for Video Player (replace with actual VideoPlayer widget)
            Expanded(
              child: Container(
                color: Colors.black,
                child: Center(
                  child: Text(
                    'Video Player Placeholder\nPath: ${widget.videoPath}',
                    style: TextStyle(color: Colors.white),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  // Placeholder for Trim Slider
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('${_trimStart.toStringAsFixed(1)}s'),
                        Expanded(
                          child: RangeSlider(
                            values: RangeValues(_trimStart, _trimEnd),
                            min: 0.0,
                            max: 30.0, // Should be video duration
                            onChanged: (RangeValues values) {
                              setState(() {
                                _trimStart = values.start;
                                _trimEnd = values.end;
                              });
                            },
                          ),
                        ),
                        Text('${_trimEnd.toStringAsFixed(1)}s'),
                      ],
                    ),
                  ),
                  _isProcessing
                      ? const CircularProgressIndicator()
                      : ElevatedButton.icon(
                          onPressed: _trimAndConvertVideo,
                          icon: const Icon(Icons.cut),
                          label: const Text('Trim Video'),
                        ),
                  // Add more editing tools here (trim, text, music)
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

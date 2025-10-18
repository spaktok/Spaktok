import 'package:flutter/material.dart';
import 'package:camerawesome/camerawesome_plugin.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' show join;

class FilteredCameraScreen extends StatefulWidget {
  const FilteredCameraScreen({super.key});

  @override
  State<FilteredCameraScreen> createState() => _FilteredCameraScreenState();
}

class _FilteredCameraScreenState extends State<FilteredCameraScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CameraAwesomeBuilder.awesome(
        saveConfig: SaveConfig.photoAndVideo(
          initialCaptureMode: CaptureMode.photo,
          mirrorFrontCamera: true,
          // Define the path where the photo/video will be saved
          photoPathBuilder: (sensors) async {
            final Directory extDir = await getTemporaryDirectory();
            final String dirPath = join(extDir.path, 'Spaktok/media');
            await Directory(dirPath).create(recursive: true);
            final String filePath = join(dirPath, '${DateTime.now().millisecondsSinceEpoch}.jpg');
            return filePath;
          },
          videoPathBuilder: (sensors) async {
            final Directory extDir = await getTemporaryDirectory();
            final String dirPath = join(extDir.path, 'Spaktok/media');
            await Directory(dirPath).create(recursive: true);
            final String filePath = join(dirPath, '${DateTime.now().millisecondsSinceEpoch}.mp4');
            return filePath;
          },
        ),
        // Implement a simple black and white filter using AwesomeFilter
        filter: AwesomeFilter.BlackAndWhite,
        
        // Build the UI elements for the camera
        builder: (cameraState, preview) {
          return cameraState.when(
            onPhotoMode: (state) => PhotoUI(state),
            onVideoMode: (state) => VideoUI(state),
            onVideoRecordingMode: (state) => VideoRecordingUI(state),
            onPreparingCamera: (state) => const Center(child: CircularProgressIndicator()),
            onCameraNotReady: (state) => const Center(child: Text('Camera not ready')),
          );
        },
      ),
    );
  }
}

// --- UI Components (Simplified for demonstration) ---

class PhotoUI extends StatelessWidget {
  final PhotoCameraState state;

  const PhotoUI(this.state, {super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        // Capture button
        AwesomeCaptureButton(
          state: state,
          onTap: (state) => state.takePhoto(),
        ),
        // Switch to video mode
        TextButton(
          onPressed: () => state.switchCameraMode(CaptureMode.video),
          child: const Text('Video Mode', style: TextStyle(color: Colors.white)),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}

class VideoUI extends StatelessWidget {
  final VideoCameraState state;

  const VideoUI(this.state, {super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        // Start recording button
        AwesomeCaptureButton(
          state: state,
          onTap: (state) => state.startRecording(),
        ),
        // Switch to photo mode
        TextButton(
          onPressed: () => state.switchCameraMode(CaptureMode.photo),
          child: const Text('Photo Mode', style: TextStyle(color: Colors.white)),
        ),
        const SizedBox(height: 20),
      ],
    );
  }
}

class VideoRecordingUI extends StatelessWidget {
  final VideoRecordingCameraState state;

  const VideoRecordingUI(this.state, {super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        // Stop recording button
        AwesomeStopButton(
          onTap: (state) => state.stopRecordingAndSave(),
        ),
        const Text('Recording...', style: TextStyle(color: Colors.red)),
        const SizedBox(height: 20),
      ],
    );
  }
}

// --- End of UI Components ---

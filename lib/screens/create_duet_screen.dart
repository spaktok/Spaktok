import 'package:flutter/material.dart';

class CreateDuetScreen extends StatefulWidget {
  final String originalVideoId;
  const CreateDuetScreen({super.key, required this.originalVideoId});

  @override
  State<CreateDuetScreen> createState() => _CreateDuetScreenState();
}

class _CreateDuetScreenState extends State<CreateDuetScreen> {
  bool _isRecording = false;
  bool _isMuted = false;
  bool _showCountdown = false;
  int _countdownValue = 3;
  bool _frontCamera = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      backgroundColor: const Color(0xFF101317),
      appBar: AppBar(
        title: const Text('Create Duet'),
        backgroundColor: const Color(0xFF1A1F24),
      ),
      body: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                Expanded(child: _buildOriginalPreview()),
                Container(width: 2, color: Colors.black54),
                Expanded(child: _buildUserRecordingView()),
              ],
            ),
          ),
          _buildEffectsScroller(),
          _buildBottomBar(theme),
        ],
      ),
    );
  }

  Widget _buildOriginalPreview() {
    return Container(
      color: const Color(0xFF232A31),
      child: const Center(
        child: Text(
          'Original Video Preview',
          style: TextStyle(color: Colors.white70),
          textAlign: TextAlign.center,
        ),
      ),
    );
  }

  Widget _buildUserRecordingView() {
    return Stack(
      children: [
        Container(
          color: const Color(0xFF1F252B),
          child: const Center(
            child: Text(
              'Your Camera View',
              style: TextStyle(color: Colors.white70),
              textAlign: TextAlign.center,
            ),
          ),
        ),
        if (_showCountdown) Positioned.fill(child: _buildCountdownOverlay()),
        Positioned(
            top: 12,
            right: 12,
            child: Column(
              children: [
                _roundIconButton(
                  icon: Icons.flip_camera_android,
                  label: _frontCamera ? 'Front' : 'Back',
                  onTap: () => setState(() => _frontCamera = !_frontCamera),
                ),
              ],
            )),
      ],
    );
  }

  Widget _buildCountdownOverlay() {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Text(
          _countdownValue.toString(),
          style: const TextStyle(
              fontSize: 72, color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildEffectsScroller() {
    final dummyEffects = List.generate(10, (i) => 'Effect ${i + 1}');
    return Container(
      height: 90,
      decoration: const BoxDecoration(
        color: Color(0xFF1A1F24),
        border: Border(top: BorderSide(color: Colors.black38, width: 1)),
      ),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        itemBuilder: (context, index) {
          return Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFF232A31),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white12),
                ),
                child: Center(
                  child: Text(
                    (index + 1).toString(),
                    style: const TextStyle(color: Colors.white70),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                dummyEffects[index],
                style: const TextStyle(color: Colors.white60, fontSize: 12),
              ),
            ],
          );
        },
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemCount: dummyEffects.length,
      ),
    );
  }

  Widget _buildBottomBar(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: const BoxDecoration(
        color: Color(0xFF1A1F24),
        boxShadow: [
          BoxShadow(color: Colors.black54, blurRadius: 8, offset: Offset(0, -2))
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _toolbarButton(
              icon: Icons.timer,
              label: 'Countdown',
              active: _showCountdown,
              onTap: () {
                setState(() {
                  _showCountdown = !_showCountdown;
                  _countdownValue = 3;
                });
              }),
          _toolbarButton(
              icon: _isMuted ? Icons.volume_off : Icons.volume_up,
              label: 'Mute',
              active: _isMuted,
              onTap: () {
                setState(() => _isMuted = !_isMuted);
              }),
          _recordButton(),
          _toolbarButton(
              icon: Icons.remove_red_eye,
              label: 'Preview',
              active: false,
              onTap: () {}),
          _toolbarButton(
              icon: Icons.check_circle,
              label: 'Finish',
              active: false,
              onTap: () {}),
        ],
      ),
    );
  }

  Widget _recordButton() {
    return GestureDetector(
      onTap: () {
        setState(() => _isRecording = !_isRecording);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        width: 72,
        height: 72,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color:
              _isRecording ? const Color(0xFFFF4457) : const Color(0xFF5A31F4),
          boxShadow: const [
            BoxShadow(
                color: Colors.black87, blurRadius: 10, offset: Offset(0, 4)),
          ],
        ),
        child: Center(
          child: Icon(
            _isRecording ? Icons.stop : Icons.fiber_manual_record,
            color: Colors.white,
            size: 34,
          ),
        ),
      ),
    );
  }

  Widget _toolbarButton(
      {required IconData icon,
      required String label,
      required bool active,
      required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: active ? const Color(0xFF5A31F4) : const Color(0xFF232A31),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(height: 6),
          Text(label,
              style: const TextStyle(color: Colors.white70, fontSize: 11)),
        ],
      ),
    );
  }

  Widget _roundIconButton(
      {required IconData icon,
      required String label,
      required VoidCallback onTap}) {
    return Column(
      children: [
        InkWell(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF232A31),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: Colors.white, size: 22),
          ),
        ),
        const SizedBox(height: 4),
        Text(label,
            style: const TextStyle(color: Colors.white60, fontSize: 10)),
      ],
    );
  }
}

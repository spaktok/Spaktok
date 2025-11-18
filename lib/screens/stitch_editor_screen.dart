import 'package:flutter/material.dart';

class StitchEditorScreen extends StatefulWidget {
  final String originalVideoId;
  const StitchEditorScreen({super.key, required this.originalVideoId});

  @override
  State<StitchEditorScreen> createState() => _StitchEditorScreenState();
}

class _StitchEditorScreenState extends State<StitchEditorScreen> {
  double _start = 0.0;
  double _end = 5.0;
  final double _videoDuration = 30.0; // placeholder duration seconds
  bool _isGenerating = false;
  final List<Map<String, double>> _clips = []; // {start, end}

  @override
  void initState() {
    super.initState();
    _clips.add({'start': _start, 'end': _end});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF101317),
      appBar: AppBar(
        title: const Text('Create Stitch'),
        backgroundColor: const Color(0xFF1A1F24),
      ),
      body: Column(
        children: [
          _buildTimeline(),
          const SizedBox(height: 12),
          _buildClipList(),
          const SizedBox(height: 12),
          _buildPreviewPlaceholder(),
          const Spacer(),
          _buildActionBar(),
        ],
      ),
    );
  }

  Widget _buildTimeline() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Clip Range',
              style: TextStyle(color: Colors.white70, fontSize: 14)),
          const SizedBox(height: 8),
          Container(
            height: 56,
            decoration: BoxDecoration(
              color: const Color(0xFF1F252B),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Stack(
              children: [
                // Full timeline bar
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          const Color(0xFF5A31F4).withOpacity(0.15),
                          const Color(0xFF00D3A9).withOpacity(0.15),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                // Selected range overlay
                Positioned(
                  left: (_start / _videoDuration) *
                      MediaQuery.of(context).size.width *
                      0.9,
                  right: ((1 - _end / _videoDuration) *
                      MediaQuery.of(context).size.width *
                      0.9),
                  top: 0,
                  bottom: 0,
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF5A31F4).withOpacity(0.35),
                      borderRadius: BorderRadius.circular(12),
                      border:
                          Border.all(color: const Color(0xFF5A31F4), width: 2),
                    ),
                  ),
                ),
                // Start handle
                _rangeHandle(isStart: true),
                // End handle
                _rangeHandle(isStart: false),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _timeChip('Start: ${_start.toStringAsFixed(1)}s'),
              _timeChip('End: ${_end.toStringAsFixed(1)}s'),
              _timeChip('Length: ${(_end - _start).toStringAsFixed(1)}s'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _rangeHandle({required bool isStart}) {
    final positionFraction = (isStart ? _start : _end) / _videoDuration;
    return Positioned(
      left: positionFraction * MediaQuery.of(context).size.width * 0.9 - 14,
      top: 0,
      bottom: 0,
      child: GestureDetector(
        behavior: HitTestBehavior.translucent,
        onHorizontalDragUpdate: (details) {
          setState(() {
            final deltaFraction =
                details.delta.dx / (MediaQuery.of(context).size.width * 0.9);
            final newValue =
                (isStart ? _start : _end) + deltaFraction * _videoDuration;
            if (isStart) {
              _start = newValue.clamp(0.0, _end - 0.5);
              _clips[0]['start'] = _start;
            } else {
              _end = newValue.clamp(_start + 0.5, _videoDuration);
              _clips[0]['end'] = _end;
            }
          });
        },
        child: Align(
          alignment: Alignment.center,
          child: Container(
            width: 28,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFF5A31F4),
              borderRadius: BorderRadius.circular(8),
              boxShadow: const [
                BoxShadow(color: Colors.black87, blurRadius: 6)
              ],
            ),
            child: Icon(isStart ? Icons.chevron_left : Icons.chevron_right,
                color: Colors.white, size: 20),
          ),
        ),
      ),
    );
  }

  Widget _timeChip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF232A31),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white12),
      ),
      child: Text(label,
          style: const TextStyle(color: Colors.white70, fontSize: 12)),
    );
  }

  Widget _buildClipList() {
    return SizedBox(
      height: 76,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _clips.length,
        itemBuilder: (context, index) {
          final clip = _clips[index];
          final selected = index == 0;
          return Container(
            width: 120,
            margin: const EdgeInsets.only(right: 12),
            decoration: BoxDecoration(
              color:
                  selected ? const Color(0xFF5A31F4) : const Color(0xFF1F252B),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                  color: selected ? const Color(0xFF00D3A9) : Colors.white12),
            ),
            padding: const EdgeInsets.all(10),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Clip ${index + 1}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('Start: ${clip['start']!.toStringAsFixed(1)}s',
                    style:
                        const TextStyle(color: Colors.white70, fontSize: 11)),
                Text('End: ${clip['end']!.toStringAsFixed(1)}s',
                    style:
                        const TextStyle(color: Colors.white70, fontSize: 11)),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildPreviewPlaceholder() {
    return Container(
      height: 160,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1F252B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white12),
      ),
      child: const Center(
        child: Text('Preview Combined Result',
            style: TextStyle(color: Colors.white54)),
      ),
    );
  }

  Widget _buildActionBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      decoration: const BoxDecoration(
        color: Color(0xFF1A1F24),
        boxShadow: [
          BoxShadow(color: Colors.black54, blurRadius: 8, offset: Offset(0, -2))
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: _isGenerating ? null : _generateStitch,
              icon: _isGenerating
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.movie_edit),
              label: Text(_isGenerating ? 'Generating...' : 'Generate Stitch'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF5A31F4),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: _addClip,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF232A31),
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 16),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14)),
            ),
            child:
                const Text('+ Clip', style: TextStyle(color: Colors.white70)),
          ),
        ],
      ),
    );
  }

  void _addClip() {
    setState(() {
      final newStart =
          (_clips.last['end']! + 0.5).clamp(0.0, _videoDuration - 1.0);
      final newEnd = (newStart + 3.0).clamp(newStart + 0.5, _videoDuration);
      _clips.add({'start': newStart, 'end': newEnd});
    });
  }

  Future<void> _generateStitch() async {
    setState(() => _isGenerating = true);
    await Future.delayed(const Duration(seconds: 2)); // placeholder
    if (mounted) {
      setState(() => _isGenerating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Stitch generated (placeholder)')),
      );
    }
  }
}

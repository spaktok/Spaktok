import 'package:flutter/material.dart';

class ScreenshotIndicator extends StatefulWidget {
  final String message;
  final bool critical;
  const ScreenshotIndicator(
      {super.key, required this.message, this.critical = false});

  @override
  State<ScreenshotIndicator> createState() => _ScreenshotIndicatorState();
}

class _ScreenshotIndicatorState extends State<ScreenshotIndicator>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offset;
  bool _visible = true;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 350));
    _offset = Tween(begin: const Offset(0, -0.4), end: const Offset(0, 0))
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _controller.forward();
    Future.delayed(const Duration(seconds: 4), _dismiss);
  }

  void _dismiss() {
    if (!_visible) return;
    setState(() => _visible = false);
    _controller.reverse().then((_) {
      if (mounted) {
        // Remove widget from tree by calling callback or using OverlayEntry externally.
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_visible) return const SizedBox.shrink();
    final color =
        widget.critical ? const Color(0xFFFF4457) : const Color(0xFF5A31F4);
    return SafeArea(
      child: Align(
        alignment: Alignment.topRight,
        child: SlideTransition(
          position: _offset,
          child: Padding(
            padding: const EdgeInsets.only(top: 12, right: 12),
            child: Material(
              color: Colors.transparent,
              child: Container(
                width: 240,
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(
                        color: Colors.black54,
                        blurRadius: 10,
                        offset: Offset(0, 4))
                  ],
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        widget.message,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            fontWeight: FontWeight.w500),
                      ),
                    ),
                    GestureDetector(
                      onTap: _dismiss,
                      child: const Icon(Icons.close,
                          color: Colors.white70, size: 18),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

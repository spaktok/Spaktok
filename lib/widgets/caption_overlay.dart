import 'package:flutter/material.dart';

class CaptionOverlay extends StatelessWidget {
  final String? captionText;
  final bool dense;
  const CaptionOverlay(
      {super.key, required this.captionText, this.dense = false});

  @override
  Widget build(BuildContext context) {
    if (captionText == null || captionText!.isEmpty) {
      return const SizedBox.shrink();
    }
    return Align(
      alignment: Alignment.bottomCenter,
      child: Padding(
        padding: EdgeInsets.only(bottom: dense ? 8 : 24, left: 12, right: 12),
        child: AnimatedOpacity(
          opacity: 1.0,
          duration: const Duration(milliseconds: 300),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 500),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.62),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white12),
            ),
            child: Text(
              captionText!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: dense ? 12 : 14,
                height: 1.28,
                fontWeight: FontWeight.w500,
                shadows: const [Shadow(color: Colors.black87, blurRadius: 4)],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

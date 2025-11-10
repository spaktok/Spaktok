import 'package:flutter/services.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:vibration/vibration.dart';
import 'dart:developer' as developer;

/// خدمة الأصوات والحركات الاهتزازية
/// تدعم: مكتبة أصوات كاملة، اهتزازات مخصصة، haptic feedback
class SoundAndHapticService {
  static final SoundAndHapticService _instance =
      SoundAndHapticService._internal();
  factory SoundAndHapticService() => _instance;
  SoundAndHapticService._internal();

  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _soundEnabled = true;
  bool _vibrationEnabled = true;
  bool _hapticEnabled = true;
  double _volume = 0.7;

  bool get soundEnabled => _soundEnabled;
  bool get vibrationEnabled => _vibrationEnabled;
  bool get hapticEnabled => _hapticEnabled;
  double get volume => _volume;

  /// تفعيل/تعطيل الأصوات
  void setSoundEnabled(bool enabled) {
    _soundEnabled = enabled;
  }

  /// تفعيل/تعطيل الاهتزازات
  void setVibrationEnabled(bool enabled) {
    _vibrationEnabled = enabled;
  }

  /// تفعيل/تعطيل Haptic Feedback
  void setHapticEnabled(bool enabled) {
    _hapticEnabled = enabled;
  }

  /// تغيير مستوى الصوت
  void setVolume(double volume) {
    _volume = volume.clamp(0.0, 1.0);
    _audioPlayer.setVolume(_volume);
  }

  /// ═══════════════════════════════════════════════════════════
  /// 🔊 مكتبة الأصوات
  /// ═══════════════════════════════════════════════════════════

  /// صوت إرسال رسالة
  Future<void> playSendMessage() async {
    await _playSound('assets/sounds/send_message.mp3');
    await _lightHaptic();
  }

  /// صوت استقبال رسالة
  Future<void> playReceiveMessage() async {
    await _playSound('assets/sounds/receive_message.mp3');
    await _mediumHaptic();
  }

  /// صوت إشعار
  Future<void> playNotification() async {
    await _playSound('assets/sounds/notification.mp3');
    await _heavyHaptic();
  }

  /// صوت إرسال هدية
  Future<void> playGiftSent() async {
    await _playSound('assets/sounds/gift_sent.mp3');
    await _successHaptic();
  }

  /// صوت لايك
  Future<void> playLike() async {
    await _playSound('assets/sounds/like.mp3');
    await _selectionHaptic();
  }

  /// صوت كاميرا
  Future<void> playCameraShutter() async {
    await _playSound('assets/sounds/camera_shutter.mp3');
    await _mediumHaptic();
  }

  /// صوت خطأ
  Future<void> playError() async {
    await _playSound('assets/sounds/error.mp3');
    await _errorHaptic();
  }

  /// صوت نجاح
  Future<void> playSuccess() async {
    await _playSound('assets/sounds/success.mp3');
    await _successHaptic();
  }

  /// صوت تحذير
  Future<void> playWarning() async {
    await _playSound('assets/sounds/warning.mp3');
    await _warningHaptic();
  }

  /// صوت النقر
  Future<void> playTap() async {
    await _playSound('assets/sounds/tap.mp3');
    await _lightHaptic();
  }

  /// صوت السحب
  Future<void> playSwipe() async {
    await _playSound('assets/sounds/swipe.mp3');
    await _selectionHaptic();
  }

  /// صوت القفل
  Future<void> playLock() async {
    await _playSound('assets/sounds/lock.mp3');
    await _heavyHaptic();
  }

  /// صوت الفتح
  Future<void> playUnlock() async {
    await _playSound('assets/sounds/unlock.mp3');
    await _heavyHaptic();
  }

  /// تشغيل صوت مخصص
  Future<void> playCustomSound(String path) async {
    await _playSound(path);
  }

  /// ═══════════════════════════════════════════════════════════
  /// 📳 الاهتزازات المخصصة
  /// ═══════════════════════════════════════════════════════════

  /// اهتزاز خفيف
  Future<void> vibrateLight() async {
    if (!_vibrationEnabled) return;

    if (await Vibration.hasVibrator() ?? false) {
      Vibration.vibrate(duration: 50);
    }
  }

  /// اهتزاز متوسط
  Future<void> vibrateMedium() async {
    if (!_vibrationEnabled) return;

    if (await Vibration.hasVibrator() ?? false) {
      Vibration.vibrate(duration: 100);
    }
  }

  /// اهتزاز قوي
  Future<void> vibrateHeavy() async {
    if (!_vibrationEnabled) return;

    if (await Vibration.hasVibrator() ?? false) {
      Vibration.vibrate(duration: 200);
    }
  }

  /// اهتزاز نبضات
  Future<void> vibratePulse() async {
    if (!_vibrationEnabled) return;

    if (await Vibration.hasCustomVibrationsSupport() ?? false) {
      Vibration.vibrate(
        pattern: [0, 100, 50, 100],
        intensities: [0, 128, 0, 255],
      );
    }
  }

  /// اهتزاز نجاح (نبضتين سريعتين)
  Future<void> vibrateSuccess() async {
    if (!_vibrationEnabled) return;

    if (await Vibration.hasCustomVibrationsSupport() ?? false) {
      Vibration.vibrate(
        pattern: [0, 50, 50, 50],
        intensities: [0, 128, 0, 128],
      );
    } else {
      await vibrateMedium();
    }
  }

  /// اهتزاز خطأ (اهتزاز طويل)
  Future<void> vibrateError() async {
    if (!_vibrationEnabled) return;

    if (await Vibration.hasCustomVibrationsSupport() ?? false) {
      Vibration.vibrate(
        pattern: [0, 300],
        intensities: [0, 255],
      );
    } else {
      await vibrateHeavy();
    }
  }

  /// اهتزاز تحذير (3 نبضات)
  Future<void> vibrateWarning() async {
    if (!_vibrationEnabled) return;

    if (await Vibration.hasCustomVibrationsSupport() ?? false) {
      Vibration.vibrate(
        pattern: [0, 50, 50, 50, 50, 50],
        intensities: [0, 128, 0, 128, 0, 128],
      );
    } else {
      await vibrateMedium();
    }
  }

  /// اهتزاز مخصص
  Future<void> vibrateCustom({
    required List<int> pattern,
    List<int>? intensities,
  }) async {
    if (!_vibrationEnabled) return;

    if (await Vibration.hasCustomVibrationsSupport() ?? false) {
      Vibration.vibrate(
        pattern: pattern,
        intensities: intensities ?? [],
      );
    }
  }

  /// ═══════════════════════════════════════════════════════════
  /// 🎯 Haptic Feedback
  /// ═══════════════════════════════════════════════════════════

  /// Haptic خفيف
  Future<void> _lightHaptic() async {
    if (!_hapticEnabled) return;

    HapticFeedback.lightImpact();
  }

  /// Haptic متوسط
  Future<void> _mediumHaptic() async {
    if (!_hapticEnabled) return;

    HapticFeedback.mediumImpact();
  }

  /// Haptic قوي
  Future<void> _heavyHaptic() async {
    if (!_hapticEnabled) return;

    HapticFeedback.heavyImpact();
  }

  /// Haptic اختيار
  Future<void> _selectionHaptic() async {
    if (!_hapticEnabled) return;

    HapticFeedback.selectionClick();
  }

  /// Haptic نجاح
  Future<void> _successHaptic() async {
    if (!_hapticEnabled) return;

    HapticFeedback.mediumImpact();
  }

  /// Haptic خطأ
  Future<void> _errorHaptic() async {
    if (!_hapticEnabled) return;

    HapticFeedback.heavyImpact();
  }

  /// Haptic تحذير
  Future<void> _warningHaptic() async {
    if (!_hapticEnabled) return;

    HapticFeedback.vibrate();
  }

  /// ═══════════════════════════════════════════════════════════
  /// 🎵 وظائف مساعدة
  /// ═══════════════════════════════════════════════════════════

  /// تشغيل ملف صوت
  Future<void> _playSound(String path) async {
    if (!_soundEnabled) return;

    try {
      await _audioPlayer.stop();
      await _audioPlayer.play(AssetSource(path.replaceFirst('assets/', '')));
    } catch (e) {
      developer.log('Error playing sound: $e', name: 'sound_haptic_service');
    }
  }

  /// إيقاف جميع الأصوات
  Future<void> stopAllSounds() async {
    await _audioPlayer.stop();
  }

  /// تنظيف الموارد
  void dispose() {
    _audioPlayer.dispose();
  }
}

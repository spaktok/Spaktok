import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';
import '../services/theme_service.dart';
import '../services/app_theme_service.dart';
import '../services/chat_background_service.dart';
import '../services/sound_haptic_service.dart';
import '../core/theme_mode.dart';
import 'theme_selection_screen.dart';

/// شاشة إعدادات المظهر والتخصيص
class AppearanceSettingsScreen extends StatefulWidget {
  const AppearanceSettingsScreen({super.key});

  @override
  State<AppearanceSettingsScreen> createState() =>
      _AppearanceSettingsScreenState();
}

class _AppearanceSettingsScreenState extends State<AppearanceSettingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _soundService = SoundAndHapticService();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('المظهر والتخصيص'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.palette), text: 'الثيم'),
            Tab(icon: Icon(Icons.wallpaper), text: 'الخلفيات'),
            Tab(icon: Icon(Icons.color_lens), text: 'الألوان'),
            Tab(icon: Icon(Icons.volume_up), text: 'الأصوات'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildThemeTab(),
          _buildBackgroundsTab(),
          _buildColorsTab(),
          _buildSoundsTab(),
        ],
      ),
    );
  }

  /// ═══════════════════════════════════════════════════════════
  /// تبويب الثيم
  /// ═══════════════════════════════════════════════════════════
  Widget _buildThemeTab() {
    return Consumer2<ThemeService, AppThemeService>(
      builder: (context, themeService, appThemeService, child) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Modern theme selector card
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const ThemeSelectionScreen(),
                    ),
                  );
                },
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Theme.of(context)
                              .colorScheme
                              .primary
                              .withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.palette,
                          color: Theme.of(context).colorScheme.primary,
                          size: 32,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Theme Selection',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Current: ${appThemeService.currentTheme.name}',
                              style: TextStyle(
                                fontSize: 14,
                                color: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.color,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, size: 20),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),

            const Text(
              'اختر الثيم',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // ثيم نهاري
            _ThemeCard(
              title: 'النهاري',
              subtitle: 'ثيم فاتح مريح للعين',
              icon: Icons.wb_sunny,
              gradient: const LinearGradient(
                colors: [Color(0xFF6200EE), Color(0xFF8E24AA)],
              ),
              isSelected: themeService.appThemeType == AppThemeType.light,
              onTap: () {
                themeService.setTheme(AppThemeType.light);
                _soundService.playTap();
              },
            ),

            const SizedBox(height: 12),

            // ثيم ليلي
            _ThemeCard(
              title: 'الليلي',
              subtitle: 'ثيم داكن يحافظ على البطارية',
              icon: Icons.nightlight_round,
              gradient: const LinearGradient(
                colors: [Color(0xFF1E1E1E), Color(0xFF424242)],
              ),
              isSelected: themeService.appThemeType == AppThemeType.dark,
              onTap: () {
                themeService.setTheme(AppThemeType.dark);
                _soundService.playTap();
              },
            ),

            const SizedBox(height: 12),

            // ثيم أنمي
            _ThemeCard(
              title: 'الأنمي',
              subtitle: 'ثيم مستوحى من عالم الأنمي',
              icon: Icons.auto_awesome,
              gradient: const LinearGradient(
                colors: [Color(0xFFFF69B4), Color(0xFF00CED1)],
              ),
              isSelected: themeService.appThemeType == AppThemeType.anime,
              onTap: () {
                themeService.setTheme(AppThemeType.anime);
                _soundService.playTap();
              },
            ),

            const SizedBox(height: 24),

            const Text(
              'ملاحظة: الثيم لا يؤثر على واجهة البرنامج الأساسية',
              style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic),
              textAlign: TextAlign.center,
            ),
          ],
        );
      },
    );
  }

  /// ═══════════════════════════════════════════════════════════
  /// تبويب الخلفيات
  /// ═══════════════════════════════════════════════════════════
  Widget _buildBackgroundsTab() {
    return Consumer<ChatBackgroundService>(
      builder: (context, bgService, child) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'خلفيات الدردشة',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // التدرجات
            _buildBackgroundSection(
              'تدرجات لونية',
              ChatBackgroundType.gradient,
              AvailableBackgrounds.gradients,
              bgService,
            ),

            // الكاميرا الخلفية
            const SizedBox(height: 24),
            const Text(
              'كاميرا مباشرة',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _BackgroundCard(
              title: 'الكاميرا الخلفية',
              subtitle: 'استخدم الكاميرا الخلفية كخلفية حية',
              icon: Icons.camera_rear,
              isSelected: bgService.currentType == ChatBackgroundType.camera,
              onTap: () {
                bgService.setBackground(ChatBackgroundType.camera, 'camera');
                _soundService.playTap();
              },
              preview: Container(
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(8),
                ),
                child:
                    const Icon(Icons.videocam, color: Colors.white, size: 40),
              ),
            ),

            // الألوان الصلبة
            const SizedBox(height: 24),
            const Text(
              'ألوان صلبة',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: AvailableBackgrounds.solids.map((solid) {
                return _ColorCircle(
                  color: solid['color'] as Color,
                  name: solid['name'] as String,
                  isSelected:
                      bgService.currentType == ChatBackgroundType.solid &&
                          bgService.currentValue == solid['id'],
                  onTap: () {
                    bgService.setBackground(
                      ChatBackgroundType.solid,
                      solid['id'] as String,
                    );
                    _soundService.playTap();
                  },
                );
              }).toList(),
            ),
          ],
        );
      },
    );
  }

  Widget _buildBackgroundSection(
    String title,
    ChatBackgroundType type,
    List<Map<String, dynamic>> items,
    ChatBackgroundService bgService,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        ...items.map((item) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _BackgroundCard(
              title: item['name'] as String,
              subtitle: 'اضغط لتطبيق',
              icon: Icons.gradient,
              isSelected: bgService.currentType == type &&
                  bgService.currentValue == item['id'],
              onTap: () {
                bgService.setBackground(type, item['id'] as String);
                _soundService.playTap();
              },
              preview: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: (item['colors'] as List<Color>?) ?? [],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  /// ═══════════════════════════════════════════════════════════
  /// تبويب الألوان المخصصة
  /// ═══════════════════════════════════════════════════════════
  Widget _buildColorsTab() {
    return Consumer<ThemeService>(
      builder: (context, themeService, child) {
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'تخصيص الألوان',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'قم بتخصيص ألوان التطبيق حسب ذوقك\n(لا يؤثر على الواجهة الرئيسية)',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 24),
            _ColorPickerTile(
              title: 'اللون الأساسي',
              currentColor: themeService.customColors?.primary ?? Colors.purple,
              onColorChanged: (color) {
                final current = themeService.customColors ??
                    CustomColors(
                      primary: Colors.purple,
                      secondary: Colors.teal,
                      background: Colors.white,
                      surface: Colors.grey[100]!,
                      error: Colors.red,
                      text: Colors.black,
                    );

                themeService.setCustomColors(CustomColors(
                  primary: color,
                  secondary: current.secondary,
                  background: current.background,
                  surface: current.surface,
                  error: current.error,
                  text: current.text,
                ));
              },
            ),
            _ColorPickerTile(
              title: 'اللون الثانوي',
              currentColor: themeService.customColors?.secondary ?? Colors.teal,
              onColorChanged: (color) {
                final current = themeService.customColors ??
                    CustomColors(
                      primary: Colors.purple,
                      secondary: Colors.teal,
                      background: Colors.white,
                      surface: Colors.grey[100]!,
                      error: Colors.red,
                      text: Colors.black,
                    );

                themeService.setCustomColors(CustomColors(
                  primary: current.primary,
                  secondary: color,
                  background: current.background,
                  surface: current.surface,
                  error: current.error,
                  text: current.text,
                ));
              },
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                themeService.resetCustomColors();
                _soundService.playSuccess();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('تم إعادة تعيين الألوان')),
                );
              },
              icon: const Icon(Icons.refresh),
              label: const Text('إعادة التعيين'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(16),
              ),
            ),
          ],
        );
      },
    );
  }

  /// ═══════════════════════════════════════════════════════════
  /// تبويب الأصوات
  /// ═══════════════════════════════════════════════════════════
  Widget _buildSoundsTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'إعدادات الأصوات والحركات',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),
        SwitchListTile(
          title: const Text('الأصوات'),
          subtitle: const Text('تفعيل أصوات التطبيق'),
          value: _soundService.soundEnabled,
          onChanged: (value) {
            setState(() {
              _soundService.setSoundEnabled(value);
            });
            if (value) _soundService.playSuccess();
          },
        ),
        SwitchListTile(
          title: const Text('الاهتزازات'),
          subtitle: const Text('تفعيل الاهتزازات'),
          value: _soundService.vibrationEnabled,
          onChanged: (value) {
            setState(() {
              _soundService.setVibrationEnabled(value);
            });
            if (value) _soundService.vibrateMedium();
          },
        ),
        SwitchListTile(
          title: const Text('ردود اللمس الحسية'),
          subtitle: const Text('Haptic Feedback'),
          value: _soundService.hapticEnabled,
          onChanged: (value) {
            setState(() {
              _soundService.setHapticEnabled(value);
            });
          },
        ),
        const SizedBox(height: 24),
        const Text(
          'مستوى الصوت',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        Slider(
          value: _soundService.volume,
          onChanged: (value) {
            setState(() {
              _soundService.setVolume(value);
            });
          },
          onChangeEnd: (value) {
            _soundService.playTap();
          },
        ),
        const SizedBox(height: 24),
        const Text(
          'اختبار الأصوات',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            _SoundTestButton(
              label: 'إرسال',
              icon: Icons.send,
              onPressed: () => _soundService.playSendMessage(),
            ),
            _SoundTestButton(
              label: 'استقبال',
              icon: Icons.mail,
              onPressed: () => _soundService.playReceiveMessage(),
            ),
            _SoundTestButton(
              label: 'إشعار',
              icon: Icons.notifications,
              onPressed: () => _soundService.playNotification(),
            ),
            _SoundTestButton(
              label: 'هدية',
              icon: Icons.card_giftcard,
              onPressed: () => _soundService.playGiftSent(),
            ),
            _SoundTestButton(
              label: 'لايك',
              icon: Icons.favorite,
              onPressed: () => _soundService.playLike(),
            ),
            _SoundTestButton(
              label: 'كاميرا',
              icon: Icons.camera,
              onPressed: () => _soundService.playCameraShutter(),
            ),
          ],
        ),
      ],
    );
  }
}

/// ═══════════════════════════════════════════════════════════
/// Widgets مساعدة
/// ═══════════════════════════════════════════════════════════

class _ThemeCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Gradient gradient;
  final bool isSelected;
  final VoidCallback onTap;

  const _ThemeCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.gradient,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: isSelected ? 8 : 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: isSelected
                ? Border.all(color: Theme.of(context).primaryColor, width: 3)
                : null,
          ),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  gradient: gradient,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.white, size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              if (isSelected)
                const Icon(Icons.check_circle, color: Colors.green, size: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _BackgroundCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;
  final Widget preview;

  const _BackgroundCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.isSelected,
    required this.onTap,
    required this.preview,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              SizedBox(
                width: 60,
                height: 60,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: preview,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(subtitle,
                        style:
                            TextStyle(fontSize: 12, color: Colors.grey[600])),
                  ],
                ),
              ),
              if (isSelected)
                const Icon(Icons.check_circle, color: Colors.green),
            ],
          ),
        ),
      ),
    );
  }
}

class _ColorCircle extends StatelessWidget {
  final Color color;
  final String name;
  final bool isSelected;
  final VoidCallback onTap;

  const _ColorCircle({
    required this.color,
    required this.name,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: isSelected
                  ? Border.all(color: Colors.green, width: 3)
                  : Border.all(color: Colors.grey, width: 1),
            ),
            child: isSelected
                ? const Icon(Icons.check, color: Colors.white)
                : null,
          ),
          const SizedBox(height: 4),
          Text(name, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}

class _ColorPickerTile extends StatelessWidget {
  final String title;
  final Color currentColor;
  final ValueChanged<Color> onColorChanged;

  const _ColorPickerTile({
    required this.title,
    required this.currentColor,
    required this.onColorChanged,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(title),
      trailing: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: currentColor,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.grey),
        ),
      ),
      onTap: () {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: Text('اختر $title'),
            content: SingleChildScrollView(
              child: ColorPicker(
                pickerColor: currentColor,
                onColorChanged: onColorChanged,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('تم'),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SoundTestButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  const _SoundTestButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/app_theme_service.dart';
import '../core/theme_mode.dart';
import '../spaktok/theme/app_theme.dart';

/// Theme selection screen with Light, Dark, and Anime modes
class ThemeSelectionScreen extends StatelessWidget {
  const ThemeSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Theme Selection'),
        elevation: 0,
      ),
      body: Consumer<AppThemeService>(
        builder: (context, themeService, child) {
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Choose Your Theme',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Select a visual style that suits your mood',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppTheme.getSecondaryTextColor(context),
                          ),
                    ),
                  ],
                ),
              ),

              // Light Theme Card
              _ThemeCard(
                title: 'Light Mode',
                description: 'Pure white bright theme for daylight',
                icon: Icons.light_mode,
                gradientColors: const [
                  Color(0xFFFFFFFF),
                  Color(0xFFF5F5F5),
                ],
                accentColor: const Color(0xFF001BFF),
                isSelected: themeService.isLight,
                onTap: () => themeService.setTheme(AppThemeMode.light),
              ),

              const SizedBox(height: 16),

              // Dark Theme Card
              _ThemeCard(
                title: 'Dark Mode',
                description: 'Vantablack with electric blue accents',
                icon: Icons.dark_mode,
                gradientColors: const [
                  Color(0xFF000000),
                  Color(0xFF0A0A0A),
                ],
                accentColor: const Color(0xFF001BFF),
                isSelected: themeService.isDark,
                onTap: () => themeService.setTheme(AppThemeMode.dark),
              ),

              const SizedBox(height: 16),

              // Anime Theme Card
              _ThemeCard(
                title: 'Anime Mode',
                description: 'Vibrant anime-inspired theme with pastel colors',
                icon: Icons.auto_awesome,
                gradientColors: const [
                  Color(0xFFFFF5F7),
                  Color(0xFFFFE4E9),
                ],
                accentColor: const Color(0xFFFF6B9D),
                isSelected: themeService.isAnime,
                onTap: () => themeService.setTheme(AppThemeMode.anime),
                extraAccents: const [
                  Color(0xFF87CEEB), // Sky blue
                  Color(0xFFB19CD9), // Soft purple
                  Color(0xFFFFB6C1), // Light pink
                ],
              ),

              const SizedBox(height: 32),

              // Quick cycle button
              Center(
                child: OutlinedButton.icon(
                  onPressed: () => themeService.cycleTheme(),
                  icon: const Icon(Icons.shuffle),
                  label: const Text('Cycle Themes'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 16,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Info card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Your theme preference is saved and will be applied across all screens',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ThemeCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final List<Color> gradientColors;
  final Color accentColor;
  final bool isSelected;
  final VoidCallback onTap;
  final List<Color>? extraAccents;

  const _ThemeCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.gradientColors,
    required this.accentColor,
    required this.isSelected,
    required this.onTap,
    this.extraAccents,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: isSelected ? 8 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: isSelected
            ? BorderSide(color: accentColor, width: 3)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  // Theme preview
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: gradientColors,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: accentColor.withValues(alpha: 0.3),
                        width: 2,
                      ),
                    ),
                    child: Center(
                      child: Icon(
                        icon,
                        color: accentColor,
                        size: 40,
                      ),
                    ),
                  ),

                  const SizedBox(width: 16),

                  // Theme info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              title,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.w700,
                                  ),
                            ),
                            if (isSelected) ...[
                              const SizedBox(width: 8),
                              Icon(
                                Icons.check_circle,
                                color: accentColor,
                                size: 24,
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          description,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppTheme.getSecondaryTextColor(
                                      context,
                                    ),
                                  ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              // Extra accent colors for anime theme
              if (extraAccents != null) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    Text(
                      'Accent Colors:',
                      style: Theme.of(context).textTheme.labelSmall,
                    ),
                    const SizedBox(width: 8),
                    ...extraAccents!.map((color) => Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: Container(
                            width: 28,
                            height: 28,
                            decoration: BoxDecoration(
                              color: color,
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white,
                                width: 2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: color.withValues(alpha: 0.4),
                                  blurRadius: 4,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                          ),
                        )),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

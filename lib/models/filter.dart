import 'package:flutter/material.dart';

class Filter {
  final String id;
  final String name;
  final String displayName;
  final ColorFilter colorFilter;
  final String? description;
  final String? thumbnailPath;
  final bool isPremium;
  final FilterCategory category;

  const Filter({
    required this.id,
    required this.name,
    required this.displayName,
    required this.colorFilter,
    this.description,
    this.thumbnailPath,
    this.isPremium = false,
    this.category = FilterCategory.basic,
  });

  // Predefined filters
  static const Filter none = Filter(
    id: 'none',
    name: 'none',
    displayName: 'Original',
    colorFilter: ColorFilter.matrix([
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
    ]),
    description: 'No filter applied',
    category: FilterCategory.basic,
  );

  static const Filter blackAndWhite = Filter(
    id: 'bw',
    name: 'black_white',
    displayName: 'B&W',
    colorFilter: ColorFilter.matrix([
      0.2126, 0.7152, 0.0722, 0, 0,
      0.2126, 0.7152, 0.0722, 0, 0,
      0.2126, 0.7152, 0.0722, 0, 0,
      0, 0, 0, 1, 0,
    ]),
    description: 'Classic black and white filter',
    category: FilterCategory.classic,
  );

  static const Filter sepia = Filter(
    id: 'sepia',
    name: 'sepia',
    displayName: 'Sepia',
    colorFilter: ColorFilter.matrix([
      0.393, 0.769, 0.189, 0, 0,
      0.349, 0.686, 0.168, 0, 0,
      0.272, 0.534, 0.131, 0, 0,
      0, 0, 0, 1, 0,
    ]),
    description: 'Vintage sepia tone effect',
    category: FilterCategory.vintage,
  );

  static const Filter vintage = Filter(
    id: 'vintage',
    name: 'vintage',
    displayName: 'Vintage',
    colorFilter: ColorFilter.matrix([
      0.9, 0.5, 0.1, 0, 0,
      0.3, 0.8, 0.1, 0, 0,
      0.2, 0.3, 0.5, 0, 0,
      0, 0, 0, 1, 0,
    ]),
    description: 'Retro vintage look',
    category: FilterCategory.vintage,
  );

  static const Filter warm = Filter(
    id: 'warm',
    name: 'warm',
    displayName: 'Warm',
    colorFilter: ColorFilter.matrix([
      1.2, 0, 0, 0, 0,
      0, 1.0, 0, 0, 0,
      0, 0, 0.8, 0, 0,
      0, 0, 0, 1, 0,
    ]),
    description: 'Warm color temperature',
    category: FilterCategory.temperature,
  );

  static const Filter cool = Filter(
    id: 'cool',
    name: 'cool',
    displayName: 'Cool',
    colorFilter: ColorFilter.matrix([
      0.8, 0, 0, 0, 0,
      0, 1.0, 0, 0, 0,
      0, 0, 1.2, 0, 0,
      0, 0, 0, 1, 0,
    ]),
    description: 'Cool color temperature',
    category: FilterCategory.temperature,
  );

  static const Filter dramatic = Filter(
    id: 'dramatic',
    name: 'dramatic',
    displayName: 'Dramatic',
    colorFilter: ColorFilter.matrix([
      1.5, 0, 0, 0, 0,
      0, 1.5, 0, 0, 0,
      0, 0, 1.5, 0, 0,
      0, 0, 0, 1, 0,
    ]),
    description: 'High contrast dramatic effect',
    category: FilterCategory.artistic,
    isPremium: true,
  );

  static const Filter soft = Filter(
    id: 'soft',
    name: 'soft',
    displayName: 'Soft',
    colorFilter: ColorFilter.matrix([
      0.8, 0.1, 0.1, 0, 0,
      0.1, 0.8, 0.1, 0, 0,
      0.1, 0.1, 0.8, 0, 0,
      0, 0, 0, 1, 0,
    ]),
    description: 'Soft dreamy effect',
    category: FilterCategory.artistic,
  );

  static const Filter highContrast = Filter(
    id: 'high_contrast',
    name: 'high_contrast',
    displayName: 'High Contrast',
    colorFilter: ColorFilter.matrix([
      2.0, 0, 0, 0, -128,
      0, 2.0, 0, 0, -128,
      0, 0, 2.0, 0, -128,
      0, 0, 0, 1, 0,
    ]),
    description: 'Enhanced contrast',
    category: FilterCategory.artistic,
    isPremium: true,
  );

  static const Filter invert = Filter(
    id: 'invert',
    name: 'invert',
    displayName: 'Invert',
    colorFilter: ColorFilter.matrix([
      -1, 0, 0, 0, 255,
      0, -1, 0, 0, 255,
      0, 0, -1, 0, 255,
      0, 0, 0, 1, 0,
    ]),
    description: 'Inverted colors',
    category: FilterCategory.experimental,
  );

  static const Filter neon = Filter(
    id: 'neon',
    name: 'neon',
    displayName: 'Neon',
    colorFilter: ColorFilter.matrix([
      1.5, 0.5, 1.0, 0, 0,
      0.5, 1.5, 0.5, 0, 0,
      1.0, 0.5, 1.5, 0, 0,
      0, 0, 0, 1, 0,
    ]),
    description: 'Neon glow effect',
    category: FilterCategory.experimental,
    isPremium: true,
  );

  static const Filter cyberpunk = Filter(
    id: 'cyberpunk',
    name: 'cyberpunk',
    displayName: 'Cyberpunk',
    colorFilter: ColorFilter.matrix([
      1.2, 0.2, 1.5, 0, 0,
      0.1, 1.0, 0.8, 0, 0,
      1.0, 0.3, 0.5, 0, 0,
      0, 0, 0, 1, 0,
    ]),
    description: 'Futuristic cyberpunk style',
    category: FilterCategory.experimental,
    isPremium: true,
  );

  // Get all available filters
  static List<Filter> getAllFilters() {
    return [
      none,
      blackAndWhite,
      sepia,
      vintage,
      warm,
      cool,
      dramatic,
      soft,
      highContrast,
      invert,
      neon,
      cyberpunk,
    ];
  }

  // Get filters by category
  static List<Filter> getFiltersByCategory(FilterCategory category) {
    return getAllFilters().where((filter) => filter.category == category).toList();
  }

  // Get free filters only
  static List<Filter> getFreeFilters() {
    return getAllFilters().where((filter) => !filter.isPremium).toList();
  }

  // Get premium filters only
  static List<Filter> getPremiumFilters() {
    return getAllFilters().where((filter) => filter.isPremium).toList();
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Filter && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;

  @override
  String toString() {
    return 'Filter{id: $id, name: $name, displayName: $displayName, isPremium: $isPremium, category: $category}';
  }
}

enum FilterCategory {
  basic,
  classic,
  vintage,
  temperature,
  artistic,
  experimental,
}

extension FilterCategoryExtension on FilterCategory {
  String get displayName {
    switch (this) {
      case FilterCategory.basic:
        return 'Basic';
      case FilterCategory.classic:
        return 'Classic';
      case FilterCategory.vintage:
        return 'Vintage';
      case FilterCategory.temperature:
        return 'Temperature';
      case FilterCategory.artistic:
        return 'Artistic';
      case FilterCategory.experimental:
        return 'Experimental';
    }
  }

  IconData get icon {
    switch (this) {
      case FilterCategory.basic:
        return Icons.photo;
      case FilterCategory.classic:
        return Icons.photo_camera;
      case FilterCategory.vintage:
        return Icons.camera_roll;
      case FilterCategory.temperature:
        return Icons.thermostat;
      case FilterCategory.artistic:
        return Icons.palette;
      case FilterCategory.experimental:
        return Icons.science;
    }
  }
}

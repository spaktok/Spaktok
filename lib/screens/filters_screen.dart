import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:spaktok/services/image_filter_service.dart';
import 'dart:typed_data';

class FiltersScreen extends StatefulWidget {
  final CameraController? cameraController;

  const FiltersScreen({Key? key, this.cameraController}) : super(key: key);

  @override
  State<FiltersScreen> createState() => _FiltersScreenState();
}

class _FiltersScreenState extends State<FiltersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ImageFilterService _filterService = ImageFilterService();
  String? _selectedFilter;
  double _filterIntensity = 1.0;

  final List<Map<String, dynamic>> _filters = [
    {'name': 'None', 'icon': Icons.block, 'color': Colors.grey},
    {'name': 'Vintage', 'icon': Icons.camera_alt, 'color': Colors.brown},
    {'name': 'Noir', 'icon': Icons.brightness_2, 'color': Colors.black},
    {'name': 'Warm', 'icon': Icons.wb_sunny, 'color': Colors.orange},
    {'name': 'Cool', 'icon': Icons.ac_unit, 'color': Colors.blue},
    {'name': 'Vivid', 'icon': Icons.color_lens, 'color': Colors.purple},
    {'name': 'Fade', 'icon': Icons.opacity, 'color': Colors.grey[400]},
    {'name': 'Dramatic', 'icon': Icons.flash_on, 'color': Colors.red},
  ];

  final List<Map<String, dynamic>> _effects = [
    {'name': 'Blur', 'icon': Icons.blur_on, 'color': Colors.blue},
    {'name': 'Sharpen', 'icon': Icons.hdr_strong, 'color': Colors.green},
    {'name': 'Glow', 'icon': Icons.wb_incandescent, 'color': Colors.yellow},
    {'name': 'Vignette', 'icon': Icons.brightness_4, 'color': Colors.grey},
    {'name': 'Grain', 'icon': Icons.grain, 'color': Colors.brown},
    {'name': 'Pixelate', 'icon': Icons.apps, 'color': Colors.purple},
  ];

  final List<Map<String, dynamic>> _beautyFilters = [
    {'name': 'Smooth', 'icon': Icons.face, 'color': Colors.pink},
    {'name': 'Brighten', 'icon': Icons.brightness_high, 'color': Colors.yellow},
    {'name': 'Slim Face', 'icon': Icons.face_retouching, 'color': Colors.pink[300]},
    {'name': 'Big Eyes', 'icon': Icons.remove_red_eye, 'color': Colors.blue},
    {'name': 'Whitening', 'icon': Icons.wb_sunny, 'color': Colors.orange[200]},
  ];

  final List<Map<String, dynamic>> _stickers = [
    {'name': 'Hearts', 'icon': Icons.favorite, 'color': Colors.red},
    {'name': 'Stars', 'icon': Icons.star, 'color': Colors.yellow},
    {'name': 'Sparkles', 'icon': Icons.auto_awesome, 'color': Colors.purple},
    {'name': 'Flowers', 'icon': Icons.local_florist, 'color': Colors.pink},
    {'name': 'Emojis', 'icon': Icons.emoji_emotions, 'color': Colors.orange},
    {'name': 'Animals', 'icon': Icons.pets, 'color': Colors.brown},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Filters & Effects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () {
              // Save current filter preset
            },
          ),
          IconButton(
            icon: const Icon(Icons.info_outline),
            onPressed: () {
              _showFilterInfo(context);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            flex: 3,
            child: _buildPreview(context),
          ),
          if (_selectedFilter != null) _buildIntensitySlider(context),
          Expanded(
            flex: 2,
            child: _buildFilterTabs(context),
          ),
        ],
      ),
    );
  }

  Widget _buildPreview(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: Theme.of(context).primaryColor,
          width: 2,
        ),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Stack(
          children: [
            Center(
              child: widget.cameraController != null && widget.cameraController!.value.isInitialized
                  ? CameraPreview(widget.cameraController!)
                  : Container(
                      color: Colors.grey[900],
                      child: const Center(
                        child: Icon(
                          Icons.camera_alt,
                          size: 100,
                          color: Colors.grey,
                        ),
                      ),
                    ),
            ),
            if (_selectedFilter != null)
              Positioned(
                top: 10,
                left: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.filter,
                        size: 16,
                        color: Theme.of(context).primaryColor,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        _selectedFilter!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildIntensitySlider(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Intensity',
                style: TextStyle(color: Colors.white, fontSize: 14),
              ),
              Text(
                '${(_filterIntensity * 100).toInt()}%',
                style: TextStyle(
                  color: Theme.of(context).primaryColor,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          SliderTheme(
            data: SliderThemeData(
              activeTrackColor: Theme.of(context).primaryColor,
              inactiveTrackColor: Colors.grey[800],
              thumbColor: Theme.of(context).primaryColor,
              overlayColor: Theme.of(context).primaryColor.withOpacity(0.2),
            ),
            child: Slider(
              value: _filterIntensity,
              onChanged: (value) {
                setState(() {
                  _filterIntensity = value;
                });
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTabs(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          indicatorColor: Theme.of(context).primaryColor,
          labelColor: Theme.of(context).primaryColor,
          unselectedLabelColor: Colors.grey,
          tabs: const [
            Tab(text: 'Filters'),
            Tab(text: 'Effects'),
            Tab(text: 'Beauty'),
            Tab(text: 'Stickers'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildFilterList(context, _filters),
              _buildFilterList(context, _effects),
              _buildFilterList(context, _beautyFilters),
              _buildStickerGrid(context),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterList(BuildContext context, List<Map<String, dynamic>> items) {
    return ListView.builder(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.all(10),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        final isSelected = _selectedFilter == item['name'];
        
        return GestureDetector(
          onTap: () {
            setState(() {
              _selectedFilter = isSelected ? null : item['name'];
            });
          },
          child: Container(
            width: 80,
            margin: const EdgeInsets.symmetric(horizontal: 5),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: isSelected ? Theme.of(context).primaryColor : Colors.grey[900],
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? Theme.of(context).primaryColor : Colors.grey[700]!,
                      width: 2,
                    ),
                  ),
                  child: Icon(
                    item['icon'],
                    color: isSelected ? Colors.white : item['color'],
                    size: 30,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  item['name'],
                  style: TextStyle(
                    color: isSelected ? Theme.of(context).primaryColor : Colors.white,
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStickerGrid(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(10),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: _stickers.length,
      itemBuilder: (context, index) {
        final sticker = _stickers[index];
        
        return GestureDetector(
          onTap: () {
            // Add sticker to preview
          },
          child: Container(
            decoration: BoxDecoration(
              color: Colors.grey[900],
              borderRadius: BorderRadius.circular(15),
              border: Border.all(color: Colors.grey[700]!, width: 1),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  sticker['icon'],
                  color: sticker['color'],
                  size: 30,
                ),
                const SizedBox(height: 5),
                Text(
                  sticker['name'],
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showFilterInfo(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.grey[900],
          title: const Text(
            'Filters & Effects',
            style: TextStyle(color: Colors.white),
          ),
          content: const Text(
            'Apply stunning filters and effects to your photos and videos. Adjust intensity for perfect results!',
            style: TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Got it',
                style: TextStyle(color: Theme.of(context).primaryColor),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}

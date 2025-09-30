import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class CameraScreen extends StatefulWidget {
  const CameraScreen({Key? key}) : super(key: key);

  @override
  State<CameraScreen> createState() => _CameraScreenState();
}

class _CameraScreenState extends State<CameraScreen> {
  File? _image;
  final ImagePicker _picker = ImagePicker();
  String _selectedFilter = 'None';
  double _brightness = 0.0;
  double _contrast = 1.0;
  double _saturation = 1.0;

  final List<String> _filters = [
    'None',
    'Vintage',
    'Black & White',
    'Sepia',
    'Warm',
    'Cool',
    'Dramatic',
    'Soft'
  ];

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(source: source);
      if (pickedFile != null) {
        setState(() {
          _image = File(pickedFile.path);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error picking image: $e')),
      );
    }
  }

  void _showImageSourceDialog() {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return SafeArea(
          child: Wrap(
            children: [
              ListTile(
                leading: const Icon(Icons.photo_camera),
                title: const Text('Camera'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Gallery'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFilterChip(String filter) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4.0),
      child: FilterChip(
        label: Text(filter),
        selected: _selectedFilter == filter,
        onSelected: (bool selected) {
          setState(() {
            _selectedFilter = selected ? filter : 'None';
          });
        },
        selectedColor: Theme.of(context).primaryColor.withOpacity(0.3),
      ),
    );
  }

  Widget _buildEditingControls() {
    return Column(
      children: [
        const Text('Brightness', style: TextStyle(fontWeight: FontWeight.bold)),
        Slider(
          value: _brightness,
          min: -1.0,
          max: 1.0,
          divisions: 20,
          onChanged: (value) {
            setState(() {
              _brightness = value;
            });
          },
        ),
        const Text('Contrast', style: TextStyle(fontWeight: FontWeight.bold)),
        Slider(
          value: _contrast,
          min: 0.0,
          max: 2.0,
          divisions: 20,
          onChanged: (value) {
            setState(() {
              _contrast = value;
            });
          },
        ),
        const Text('Saturation', style: TextStyle(fontWeight: FontWeight.bold)),
        Slider(
          value: _saturation,
          min: 0.0,
          max: 2.0,
          divisions: 20,
          onChanged: (value) {
            setState(() {
              _saturation = value;
            });
          },
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Camera & Filters'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          if (_image != null)
            IconButton(
              icon: const Icon(Icons.save),
              onPressed: () {
                // Save edited image logic
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Image saved successfully!')),
                );
              },
            ),
        ],
      ),
      backgroundColor: Colors.black,
      body: Column(
        children: [
          Expanded(
            flex: 3,
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.grey[900],
                borderRadius: BorderRadius.circular(12),
              ),
              margin: const EdgeInsets.all(16),
              child: _image == null
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.camera_alt,
                            size: 80,
                            color: Colors.grey,
                          ),
                          SizedBox(height: 16),
                          Text(
                            'No image selected',
                            style: TextStyle(color: Colors.grey, fontSize: 18),
                          ),
                        ],
                      ),
                    )
                  : ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: ColorFiltered(
                        colorFilter: _getColorFilter(),
                        child: Image.file(
                          _image!,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                        ),
                      ),
                    ),
            ),
          ),
          if (_image != null) ...[
            Container(
              height: 60,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: _filters.map((filter) => _buildFilterChip(filter)).toList(),
              ),
            ),
            Expanded(
              flex: 1,
              child: Container(
                padding: const EdgeInsets.all(16),
                child: _buildEditingControls(),
              ),
            ),
          ],
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                FloatingActionButton(
                  heroTag: "camera",
                  onPressed: _showImageSourceDialog,
                  backgroundColor: Theme.of(context).primaryColor,
                  child: const Icon(Icons.camera_alt),
                ),
                if (_image != null)
                  FloatingActionButton(
                    heroTag: "reset",
                    onPressed: () {
                      setState(() {
                        _selectedFilter = 'None';
                        _brightness = 0.0;
                        _contrast = 1.0;
                        _saturation = 1.0;
                      });
                    },
                    backgroundColor: Colors.grey[700],
                    child: const Icon(Icons.refresh),
                  ),
                if (_image != null)
                  FloatingActionButton(
                    heroTag: "share",
                    onPressed: () {
                      // Share image logic
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Sharing image...')),
                      );
                    },
                    backgroundColor: Colors.green,
                    child: const Icon(Icons.share),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  ColorFilter _getColorFilter() {
    switch (_selectedFilter) {
      case 'Black & White':
        return const ColorFilter.matrix([
          0.2126, 0.7152, 0.0722, 0, 0,
          0.2126, 0.7152, 0.0722, 0, 0,
          0.2126, 0.7152, 0.0722, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      case 'Sepia':
        return const ColorFilter.matrix([
          0.393, 0.769, 0.189, 0, 0,
          0.349, 0.686, 0.168, 0, 0,
          0.272, 0.534, 0.131, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      case 'Vintage':
        return const ColorFilter.matrix([
          0.9, 0.5, 0.1, 0, 0,
          0.3, 0.8, 0.1, 0, 0,
          0.2, 0.3, 0.5, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      case 'Warm':
        return const ColorFilter.matrix([
          1.2, 0, 0, 0, 0,
          0, 1.0, 0, 0, 0,
          0, 0, 0.8, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      case 'Cool':
        return const ColorFilter.matrix([
          0.8, 0, 0, 0, 0,
          0, 1.0, 0, 0, 0,
          0, 0, 1.2, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      case 'Dramatic':
        return const ColorFilter.matrix([
          1.5, 0, 0, 0, 0,
          0, 1.5, 0, 0, 0,
          0, 0, 1.5, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      case 'Soft':
        return const ColorFilter.matrix([
          0.8, 0.1, 0.1, 0, 0,
          0.1, 0.8, 0.1, 0, 0,
          0.1, 0.1, 0.8, 0, 0,
          0, 0, 0, 1, 0,
        ]);
      default:
        return ColorFilter.matrix([
          1 + _brightness, 0, 0, 0, 0,
          0, 1 + _brightness, 0, 0, 0,
          0, 0, 1 + _brightness, 0, 0,
          0, 0, 0, 1, 0,
        ]);
    }
  }
}

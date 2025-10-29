import 'package:flutter/material.dart';
import 'package:camera/camera.dart';

class FiltersScreen extends StatefulWidget {
  final CameraController? cameraController;

  const FiltersScreen({super.key, this.cameraController});

  @override
  State<FiltersScreen> createState() => _FiltersScreenState();
}

class _FiltersScreenState extends State<FiltersScreen> {
  final List<Map<String, dynamic>> _filters = [
    {'name': 'No Filter', 'matrix': _noFilter},
    {'name': 'Sepia', 'matrix': _sepiaMatrix},
    {'name': 'Grayscale', 'matrix': _grayscaleMatrix},
    {'name': 'Invert', 'matrix': _invertMatrix},
    {'name': 'Vintage', 'matrix': _vintageMatrix},
    {'name': 'Cool', 'matrix': _coolMatrix},
    {'name': 'Warm', 'matrix': _warmMatrix},
  ];

  int _selectedFilterIndex = 0;

  void _applyFilter(List<double> matrix) {
    // The camera package does not directly support color filters.
    // This is a placeholder for where you would apply a filter if the functionality was available.
    // For a real implementation, you might need to process the image frames manually.
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Filter functionality is not yet implemented.')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Filters'),
        backgroundColor: Colors.black,
      ),
      backgroundColor: Colors.black,
      body: GridView.builder(
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 4,
          mainAxisSpacing: 4,
        ),
        itemCount: _filters.length,
        itemBuilder: (context, index) {
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedFilterIndex = index;
              });
              _applyFilter(_filters[index]['matrix']);
            },
            child: ColorFiltered(
              colorFilter: ColorFilter.matrix(_filters[index]['matrix']),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(
                    color: _selectedFilterIndex == index ? Theme.of(context).primaryColor : Colors.transparent,
                    width: 3,
                  ),
                ),
                child: const Center(
                  child: Text(
                    'Preview',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

const List<double> _noFilter = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];

const List<double> _sepiaMatrix = [
  0.393, 0.769, 0.189, 0, 0,
  0.349, 0.686, 0.168, 0, 0,
  0.272, 0.534, 0.131, 0, 0,
  0, 0, 0, 1, 0,
];

const List<double> _grayscaleMatrix = [
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0, 0, 0, 1, 0,
];

const List<double> _invertMatrix = [
  -1, 0, 0, 0, 255,
  0, -1, 0, 0, 255,
  0, 0, -1, 0, 255,
  0, 0, 0, 1, 0,
];

const List<double> _vintageMatrix = [
  0.9, 0.2, 0.1, 0, 0,
  0.3, 0.8, 0.1, 0, 0,
  0.2, 0.3, 0.7, 0, 0,
  0, 0, 0, 1, 0,
];

const List<double> _coolMatrix = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1.5, 0, 0,
  0, 0, 0, 1, 0,
];

const List<double> _warmMatrix = [
  1.2, 0, 0, 0, 0,
  0, 1.1, 0, 0, 0,
  0, 0, 0.8, 0, 0,
  0, 0, 0, 1, 0,
];

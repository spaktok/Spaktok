import 'dart:typed_data';
import 'package:ar_flutter_plugin/datatypes/node_types.dart';
import 'package:ar_flutter_plugin/managers/ar_anchor_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_object_manager.dart';
import 'package:ar_flutter_plugin/managers/ar_session_manager.dart';
import 'package:ar_flutter_plugin/models/ar_anchor.dart';
import 'package:ar_flutter_plugin/models/ar_hittest_result.dart';
import 'package:ar_flutter_plugin/models/ar_node.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'cloudflare_api_service.dart';
import 'package:vector_math/vector_math_64.dart' as vector;

class WorldARService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final CloudflareApiService _api = CloudflareApiService();

  // AR Session managers
  ARSessionManager? _arSessionManager;
  ARObjectManager? _arObjectManager;
  ARAnchorManager? _arAnchorManager;

  // Tracking placed objects
  final Map<String, ARNode> _placedObjects = {};
  final Map<String, ARAnchor> _anchors = {};

  /// Initialize AR session with world tracking
  Future<void> initializeARSession({
    required ARSessionManager arSessionManager,
    required ARObjectManager arObjectManager,
    required ARAnchorManager arAnchorManager,
  }) async {
    _arSessionManager = arSessionManager;
    _arObjectManager = arObjectManager;
    _arAnchorManager = arAnchorManager;

    // Configure session for world tracking
    await _arSessionManager!.onInitialize(
      showFeaturePoints: true,
      showPlanes: true,
      showWorldOrigin: true,
      handleTaps: true,
      handlePans: false,
      handleRotation: true,
    );
  }

  /// Place 3D object at detected surface
  Future<ARNode?> placeObject({
    required String objectUrl,
    required ARHitTestResult hitResult,
    String? objectId,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      if (_arObjectManager == null || _arAnchorManager == null) {
        throw Exception('AR session not initialized');
      }

      // Create anchor at hit location
      final anchor = ARPlaneAnchor(
        transformation: hitResult.worldTransform,
      );

      final anchorAdded = await _arAnchorManager!.addAnchor(anchor);
      if (anchorAdded != true) {
        throw Exception('Failed to add anchor');
      }

      // Create node with 3D object
      final node = ARNode(
        type: NodeType.webGLB,
        uri: objectUrl,
        scale: vector.Vector3(0.2, 0.2, 0.2),
        position: vector.Vector3(0, 0, 0),
        rotation: vector.Vector4(1, 0, 0, 0),
      );

      // Add node to scene (addNode returns bool?)
      final success = await _arObjectManager!.addNode(node);
      if (success != true) {
        throw Exception('Failed to add node');
      }

      // Track object (store the node and anchor we created)
      final id = objectId ?? DateTime.now().millisecondsSinceEpoch.toString();
      _placedObjects[id] = node;
      _anchors[id] = anchor;

      // Save metadata via Cloudflare Workers (D1)
      if (metadata != null) {
        await _saveARObject(
          id: id,
          objectUrl: objectUrl,
          transform: hitResult.worldTransform,
          metadata: metadata,
        );
      }

      return node;
    } catch (e) {
      print('Error placing object: $e');
      return null;
    }
  }

  /// Remove placed object from scene
  Future<bool> removeObject(String objectId) async {
    try {
      if (!_placedObjects.containsKey(objectId)) {
        return false;
      }

      final node = _placedObjects[objectId];
      final anchor = _anchors[objectId];

      // Remove from AR scene
      if (node != null && _arObjectManager != null) {
        await _arObjectManager!.removeNode(node);
      }

      if (anchor != null && _arAnchorManager != null) {
        await _arAnchorManager!.removeAnchor(anchor);
      }

      // Remove from tracking
      _placedObjects.remove(objectId);
      _anchors.remove(objectId);

      return true;
    } catch (e) {
      print('Error removing object: $e');
      return false;
    }
  }

  /// Update object scale
  Future<bool> updateObjectScale(String objectId, double scale) async {
    try {
      if (!_placedObjects.containsKey(objectId)) {
        return false;
      }

      final node = _placedObjects[objectId];
      if (node == null || _arObjectManager == null) {
        return false;
      }

      // Update scale
      node.scale = vector.Vector3(scale, scale, scale);

      return true;
    } catch (e) {
      print('Error updating object scale: $e');
      return false;
    }
  }

  /// Update object rotation
  Future<bool> updateObjectRotation(
      String objectId, vector.Vector4 rotation) async {
    try {
      if (!_placedObjects.containsKey(objectId)) {
        return false;
      }

      final node = _placedObjects[objectId];
      if (node == null || _arObjectManager == null) {
        return false;
      }

      // Note: ARNode.rotation may be read-only or require recreation of node
      // For now, skip direct mutation and return success
      // TODO: Implement proper rotation update (may require removing and re-adding node)
      print('Rotation update not fully supported in current AR plugin version');

      return true;
    } catch (e) {
      print('Error updating object rotation: $e');
      return false;
    }
  }

  /// Get all placed objects
  Map<String, ARNode> getPlacedObjects() {
    return Map.from(_placedObjects);
  }

  /// Clear all objects from scene
  Future<void> clearAllObjects() async {
    try {
      // Remove all nodes
      for (final node in _placedObjects.values) {
        if (_arObjectManager != null) {
          await _arObjectManager!.removeNode(node);
        }
      }

      // Remove all anchors
      for (final anchor in _anchors.values) {
        if (_arAnchorManager != null) {
          await _arAnchorManager!.removeAnchor(anchor);
        }
      }

      _placedObjects.clear();
      _anchors.clear();
    } catch (e) {
      print('Error clearing objects: $e');
    }
  }

  /// Save AR object placement (D1 via Workers)
  Future<void> _saveARObject({
    required String id,
    required String objectUrl,
    required vector.Matrix4 transform,
    required Map<String, dynamic> metadata,
  }) async {
    try {
      final userId = _auth.currentUser?.uid;
      if (userId == null) return;
      final res = await http.post(
        Uri.parse('${CloudflareApiService.baseUrl}/ar/object'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'id': id,
          'userId': userId,
          'objectUrl': objectUrl,
          'transform': transform.storage.toList(),
          'metadata': metadata,
          'timestamp': DateTime.now().millisecondsSinceEpoch,
        }),
      );
      if (res.statusCode >= 300) {
        throw Exception('Failed to save AR object: ${res.body}');
      }
    } catch (e) {
      print('Error saving AR object: $e');
    }
  }

  /// Get user's AR objects
  Stream<List<Map<String, dynamic>>> getUserARObjects() {
    // For ultra-low-cost, poll via Workers or use DO websockets; placeholder returns empty stream
    return Stream.value([]);
  }

  /// Upload custom 3D model to Firebase Storage
  Future<String?> uploadCustomModel({
    required Uint8List modelData,
    required String fileName,
    String? userId,
  }) async {
    try {
      final uid = userId ?? _auth.currentUser?.uid;
      if (uid == null) {
        throw Exception('User not authenticated');
      }
      final path =
          'ar_models/$uid/${DateTime.now().millisecondsSinceEpoch}_$fileName';
      final res = await http.put(
        Uri.parse('${CloudflareApiService.baseUrl}/r2/upload?path=$path'),
        headers: {'Content-Type': 'application/octet-stream'},
        body: modelData,
      );
      if (res.statusCode >= 300) {
        throw Exception('Failed to upload model: ${res.body}');
      }
      final data = jsonDecode(res.body);
      return data['url'] as String?;
    } catch (e) {
      print('Error uploading custom model: $e');
      return null;
    }
  }

  /// Get available 3D models from catalog
  Future<List<Map<String, dynamic>>> getModelCatalog() async {
    try {
      // Fetch from Workers
      final res = await http
          .get(Uri.parse('${CloudflareApiService.baseUrl}/ar/catalog'));
      if (res.statusCode >= 300) return [];
      final list = jsonDecode(res.body) as List<dynamic>;
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      print('Error getting model catalog: $e');
      return [];
    }
  }

  /// Get models by category
  Future<List<Map<String, dynamic>>> getModelsByCategory(
      String category) async {
    try {
      final res = await http.get(Uri.parse(
          '${CloudflareApiService.baseUrl}/ar/catalog?category=$category'));
      if (res.statusCode >= 300) return [];
      final list = jsonDecode(res.body) as List<dynamic>;
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      print('Error getting models by category: $e');
      return [];
    }
  }

  /// Create AR experience (for stories/videos)
  Future<String?> createARExperience({
    required String title,
    required String description,
    required List<String> objectUrls,
    String? thumbnailUrl,
    Map<String, dynamic>? settings,
  }) async {
    try {
      final userId = _auth.currentUser?.uid;
      if (userId == null) {
        throw Exception('User not authenticated');
      }
      final res = await http.post(
        Uri.parse('${CloudflareApiService.baseUrl}/ar/experience'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'title': title,
          'description': description,
          'objectUrls': objectUrls,
          'thumbnailUrl': thumbnailUrl,
          'settings': settings ?? {},
        }),
      );
      if (res.statusCode >= 300) return null;
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      return data['id'] as String?;
    } catch (e) {
      print('Error creating AR experience: $e');
      return null;
    }
  }

  /// Get AR experiences
  Stream<List<Map<String, dynamic>>> getARExperiences({
    String? userId,
    int limit = 20,
  }) {
    // Replace Firestore stream with periodic polling (can be upgraded to DO websockets)
    return Stream.periodic(const Duration(seconds: 5)).asyncMap((_) async {
      final q = Uri.parse(
          '${CloudflareApiService.baseUrl}/ar/experience?limit=$limit${userId != null ? '&userId=$userId' : ''}');
      final res = await http.get(q);
      if (res.statusCode >= 300) return <Map<String, dynamic>>[];
      final list = jsonDecode(res.body) as List<dynamic>;
      return list.cast<Map<String, dynamic>>();
    });
  }

  /// Use AR experience (increment usage count)
  Future<void> useARExperience(String experienceId) async {
    try {
      await http.post(
        Uri.parse(
            '${CloudflareApiService.baseUrl}/ar/experience/$experienceId/use'),
      );
    } catch (e) {
      print('Error updating AR experience usage: $e');
    }
  }

  /// Capture AR screenshot
  Future<Uint8List?> captureARScreenshot() async {
    try {
      if (_arSessionManager == null) {
        throw Exception('AR session not initialized');
      }

      // snapshot() returns ImageProvider, not Uint8List
      // For now, return null and implement proper image conversion if needed
      print('AR screenshot capture not fully implemented');
      return null;
    } catch (e) {
      print('Error capturing AR screenshot: $e');
      return null;
    }
  }

  /// Save AR recording metadata
  Future<String?> saveARRecording({
    required String videoUrl,
    required String thumbnailUrl,
    required List<Map<String, dynamic>> placedObjects,
    int? duration,
  }) async {
    try {
      final userId = _auth.currentUser?.uid;
      if (userId == null) {
        throw Exception('User not authenticated');
      }
      final res = await http.post(
        Uri.parse('${CloudflareApiService.baseUrl}/ar/recording'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'videoUrl': videoUrl,
          'thumbnailUrl': thumbnailUrl,
          'placedObjects': placedObjects,
          'duration': duration,
        }),
      );
      if (res.statusCode >= 300) return null;
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      return data['id'] as String?;
    } catch (e) {
      print('Error saving AR recording: $e');
      return null;
    }
  }

  /// Get AR statistics
  Future<Map<String, dynamic>> getARStatistics() async {
    try {
      // Placeholder metrics; can be fetched from Workers
      return {
        'totalObjects': _placedObjects.length,
        'totalExperiences': 0,
        'totalRecordings': 0,
        'currentlyPlaced': _placedObjects.length,
      };
    } catch (e) {
      print('Error getting AR statistics: $e');
      return {};
    }
  }

  /// Dispose AR session
  Future<void> dispose() async {
    await clearAllObjects();
    _arSessionManager?.dispose();
  }
}

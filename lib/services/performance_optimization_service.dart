import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:spaktok/services/auth_service.dart';
import 'dart:async';
import 'dart:typed_data';

/// Cache Priority Level
enum CachePriority {
  low,
  medium,
  high,
  critical,
}

/// Cached Item Model
class CachedItem<T> {
  final String key;
  final T data;
  final DateTime cachedAt;
  final DateTime expiresAt;
  final CachePriority priority;
  final int accessCount;

  CachedItem({
    required this.key,
    required this.data,
    required this.cachedAt,
    required this.expiresAt,
    required this.priority,
    this.accessCount = 0,
  });

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  CachedItem<T> copyWithIncrementedAccess() {
    return CachedItem<T>(
      key: key,
      data: data,
      cachedAt: cachedAt,
      expiresAt: expiresAt,
      priority: priority,
      accessCount: accessCount + 1,
    );
  }
}

/// Performance Metrics
class PerformanceMetrics {
  final int totalRequests;
  final int cacheHits;
  final int cacheMisses;
  final double averageResponseTime;
  final int totalDataSaved; // in bytes
  final DateTime startTime;

  PerformanceMetrics({
    required this.totalRequests,
    required this.cacheHits,
    required this.cacheMisses,
    required this.averageResponseTime,
    required this.totalDataSaved,
    required this.startTime,
  });

  double get cacheHitRate =>
      totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0.0;

  Map<String, dynamic> toMap() {
    return {
      'totalRequests': totalRequests,
      'cacheHits': cacheHits,
      'cacheMisses': cacheMisses,
      'cacheHitRate': cacheHitRate,
      'averageResponseTime': averageResponseTime,
      'totalDataSaved': totalDataSaved,
      'startTime': startTime.toIso8601String(),
    };
  }
}

/// Performance Optimization Service
/// Redis-like caching, CDN integration, video compression
class PerformanceOptimizationService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final AuthService _authService = AuthService();

  // In-memory cache (simulates Redis)
  final Map<String, CachedItem> _cache = {};
  final Map<String, Timer> _cacheTimers = {};

  // Performance metrics
  int _totalRequests = 0;
  int _cacheHits = 0;
  int _cacheMisses = 0;
  final List<double> _responseTimes = [];
  int _totalDataSaved = 0;
  final DateTime _startTime = DateTime.now();

  // Cache configuration
  static const int _maxCacheSize = 1000; // Maximum cached items
  static const Duration _defaultCacheDuration = Duration(minutes: 15);
  static const Duration _longCacheDuration = Duration(hours: 2);
  static const Duration _shortCacheDuration = Duration(minutes: 5);

  /// Get data with caching
  Future<T?> getCached<T>({
    required String key,
    required Future<T> Function() fetchFunction,
    Duration? cacheDuration,
    CachePriority priority = CachePriority.medium,
  }) async {
    final startTime = DateTime.now();
    _totalRequests++;

    try {
      // Check cache first
      if (_cache.containsKey(key)) {
        final cachedItem = _cache[key]! as CachedItem<T>;

        if (!cachedItem.isExpired) {
          // Cache hit
          _cacheHits++;
          _cache[key] = cachedItem.copyWithIncrementedAccess() as CachedItem;

          final responseTime =
              DateTime.now().difference(startTime).inMilliseconds.toDouble();
          _responseTimes.add(responseTime);

          return cachedItem.data;
        } else {
          // Expired cache
          _removeFromCache(key);
        }
      }

      // Cache miss - fetch data
      _cacheMisses++;
      final data = await fetchFunction();

      // Cache the result
      if (data != null) {
        await _addToCache(
          key: key,
          data: data,
          duration: cacheDuration ?? _defaultCacheDuration,
          priority: priority,
        );
      }

      final responseTime =
          DateTime.now().difference(startTime).inMilliseconds.toDouble();
      _responseTimes.add(responseTime);

      return data;
    } catch (e) {
      print('Error in getCached: $e');
      rethrow;
    }
  }

  /// Add item to cache
  Future<void> _addToCache<T>({
    required String key,
    required T data,
    required Duration duration,
    required CachePriority priority,
  }) async {
    try {
      // Check cache size limit
      if (_cache.length >= _maxCacheSize) {
        _evictLowPriorityItems();
      }

      final now = DateTime.now();
      final expiresAt = now.add(duration);

      _cache[key] = CachedItem<T>(
        key: key,
        data: data,
        cachedAt: now,
        expiresAt: expiresAt,
        priority: priority,
      );

      // Set expiration timer
      _cacheTimers[key]?.cancel();
      _cacheTimers[key] = Timer(duration, () => _removeFromCache(key));
    } catch (e) {
      print('Error adding to cache: $e');
    }
  }

  /// Remove item from cache
  void _removeFromCache(String key) {
    _cache.remove(key);
    _cacheTimers[key]?.cancel();
    _cacheTimers.remove(key);
  }

  /// Evict low priority items when cache is full
  void _evictLowPriorityItems() {
    final items = _cache.values.toList();
    items.sort((a, b) {
      // Sort by priority (ascending) and access count (ascending)
      final priorityCompare = a.priority.index.compareTo(b.priority.index);
      if (priorityCompare != 0) return priorityCompare;
      return a.accessCount.compareTo(b.accessCount);
    });

    // Remove 20% of lowest priority items
    final removeCount = (_maxCacheSize * 0.2).round();
    for (int i = 0; i < removeCount && i < items.length; i++) {
      _removeFromCache(items[i].key);
    }
  }

  /// Clear cache
  void clearCache({CachePriority? priority}) {
    if (priority == null) {
      // Clear all cache
      _cache.clear();
      _cacheTimers.forEach((key, timer) => timer.cancel());
      _cacheTimers.clear();
    } else {
      // Clear specific priority
      final keysToRemove = _cache.entries
          .where((entry) => entry.value.priority == priority)
          .map((entry) => entry.key)
          .toList();

      for (var key in keysToRemove) {
        _removeFromCache(key);
      }
    }
  }

  /// Invalidate cache by key pattern
  void invalidateCachePattern(String pattern) {
    final keysToRemove =
        _cache.keys.where((key) => key.contains(pattern)).toList();

    for (var key in keysToRemove) {
      _removeFromCache(key);
    }
  }

  /// Get cached user data
  Future<Map<String, dynamic>?> getCachedUserData(String userId) async {
    return getCached<Map<String, dynamic>>(
      key: 'user_$userId',
      fetchFunction: () async {
        final doc = await _firestore.collection('users').doc(userId).get();
        return doc.exists ? doc.data() : null;
      },
      cacheDuration: _longCacheDuration,
      priority: CachePriority.high,
    );
  }

  /// Get cached video data
  Future<Map<String, dynamic>?> getCachedVideoData(String videoId) async {
    return getCached<Map<String, dynamic>>(
      key: 'video_$videoId',
      fetchFunction: () async {
        final doc = await _firestore.collection('videos').doc(videoId).get();
        return doc.exists ? doc.data() : null;
      },
      cacheDuration: _defaultCacheDuration,
      priority: CachePriority.medium,
    );
  }

  /// Get cached feed
  Future<List<Map<String, dynamic>>> getCachedFeed(
    String feedType, {
    int limit = 20,
  }) async {
    return getCached<List<Map<String, dynamic>>>(
          key: 'feed_${feedType}_$limit',
          fetchFunction: () async {
            final querySnapshot = await _firestore
                .collection('videos')
                .where('isPublic', isEqualTo: true)
                .orderBy('trendingScore', descending: true)
                .limit(limit)
                .get();

            return querySnapshot.docs
                .map((doc) => {'id': doc.id, ...doc.data()})
                .toList();
          },
          cacheDuration: _shortCacheDuration,
          priority: CachePriority.high,
        ) ??
        [];
  }

  /// Compress video (simulated - would use FFmpeg in production)
  Future<Map<String, dynamic>> compressVideo({
    required String videoPath,
    int quality = 75, // 0-100
    int? maxWidth,
    int? maxHeight,
    int? targetBitrate,
  }) async {
    try {
      // In production, this would use FFmpeg or similar
      // For now, return metadata about compression

      final originalSize = await _getFileSize(videoPath);
      final compressedSize = (originalSize * (quality / 100)).round();
      final savedBytes = originalSize - compressedSize;

      _totalDataSaved += savedBytes;

      return {
        'originalSize': originalSize,
        'compressedSize': compressedSize,
        'savedBytes': savedBytes,
        'compressionRatio':
            (savedBytes / originalSize * 100).toStringAsFixed(2),
        'quality': quality,
      };
    } catch (e) {
      print('Error compressing video: $e');
      rethrow;
    }
  }

  /// Optimize image
  Future<Uint8List> optimizeImage({
    required Uint8List imageData,
    int quality = 85,
    int? maxWidth,
    int? maxHeight,
  }) async {
    try {
      // In production, use image package or native compression
      // For now, simulate compression

      final originalSize = imageData.length;
      final targetSize = (originalSize * (quality / 100)).round();

      _totalDataSaved += (originalSize - targetSize);

      // Return simulated compressed data
      return imageData.sublist(0, targetSize.clamp(0, imageData.length));
    } catch (e) {
      print('Error optimizing image: $e');
      rethrow;
    }
  }

  /// Generate thumbnail with caching
  Future<String?> getCachedThumbnail({
    required String videoId,
    required String videoUrl,
  }) async {
    return getCached<String>(
      key: 'thumbnail_$videoId',
      fetchFunction: () async {
        // In production, generate actual thumbnail
        // For now, return placeholder
        return 'https://placeholder.com/thumbnail_$videoId.jpg';
      },
      cacheDuration: _longCacheDuration,
      priority: CachePriority.medium,
    );
  }

  /// Preload content for better performance
  Future<void> preloadContent({
    required List<String> videoIds,
    bool preloadThumbnails = true,
    bool preloadMetadata = true,
  }) async {
    try {
      final futures = <Future>[];

      for (var videoId in videoIds) {
        if (preloadMetadata) {
          futures.add(getCachedVideoData(videoId));
        }

        if (preloadThumbnails) {
          futures.add(getCachedThumbnail(
            videoId: videoId,
            videoUrl: '', // Would be fetched from metadata
          ));
        }
      }

      await Future.wait(futures);
    } catch (e) {
      print('Error preloading content: $e');
    }
  }

  /// Batch fetch with caching
  Future<List<T>> batchFetch<T>({
    required List<String> ids,
    required String collectionName,
    required T Function(Map<String, dynamic>, String) fromMap,
    Duration? cacheDuration,
  }) async {
    try {
      final results = <T>[];

      // Try to get from cache first
      final uncachedIds = <String>[];
      for (var id in ids) {
        final cacheKey = '${collectionName}_$id';
        if (_cache.containsKey(cacheKey)) {
          final cached = _cache[cacheKey]! as CachedItem<Map<String, dynamic>>;
          if (!cached.isExpired) {
            results.add(fromMap(cached.data, id));
            continue;
          }
        }
        uncachedIds.add(id);
      }

      // Fetch uncached items
      if (uncachedIds.isNotEmpty) {
        // Firestore 'in' query supports max 10 items
        for (int i = 0; i < uncachedIds.length; i += 10) {
          final batch = uncachedIds.skip(i).take(10).toList();

          final querySnapshot = await _firestore
              .collection(collectionName)
              .where(FieldPath.documentId, whereIn: batch)
              .get();

          for (var doc in querySnapshot.docs) {
            final data = doc.data();
            results.add(fromMap(data, doc.id));

            // Cache the result
            await _addToCache(
              key: '${collectionName}_${doc.id}',
              data: data,
              duration: cacheDuration ?? _defaultCacheDuration,
              priority: CachePriority.medium,
            );
          }
        }
      }

      return results;
    } catch (e) {
      print('Error in batch fetch: $e');
      return [];
    }
  }

  /// Get performance metrics
  PerformanceMetrics getMetrics() {
    final avgResponseTime = _responseTimes.isEmpty
        ? 0.0
        : _responseTimes.reduce((a, b) => a + b) / _responseTimes.length;

    return PerformanceMetrics(
      totalRequests: _totalRequests,
      cacheHits: _cacheHits,
      cacheMisses: _cacheMisses,
      averageResponseTime: avgResponseTime,
      totalDataSaved: _totalDataSaved,
      startTime: _startTime,
    );
  }

  /// Reset metrics
  void resetMetrics() {
    _totalRequests = 0;
    _cacheHits = 0;
    _cacheMisses = 0;
    _responseTimes.clear();
    _totalDataSaved = 0;
  }

  /// Get cache stats
  Map<String, dynamic> getCacheStats() {
    final priorityCounts = <CachePriority, int>{};
    for (var priority in CachePriority.values) {
      priorityCounts[priority] = 0;
    }

    int totalSize = 0;
    for (var item in _cache.values) {
      priorityCounts[item.priority] = (priorityCounts[item.priority] ?? 0) + 1;
      totalSize += item.toString().length; // Approximate size
    }

    return {
      'totalItems': _cache.length,
      'maxSize': _maxCacheSize,
      'utilizationPercent':
          (_cache.length / _maxCacheSize * 100).toStringAsFixed(2),
      'approximateSizeBytes': totalSize,
      'priorityDistribution': priorityCounts.map(
        (key, value) => MapEntry(key.toString().split('.').last, value),
      ),
    };
  }

  /// Warmup cache with popular content
  Future<void> warmupCache() async {
    try {
      print('Starting cache warmup...');

      // Cache trending videos
      await getCachedFeed('trending', limit: 20);

      // Cache current user data
      final user = _authService.currentUser;
      if (user != null) {
        await getCachedUserData(user.uid);
      }

      print('Cache warmup completed');
    } catch (e) {
      print('Error warming up cache: $e');
    }
  }

  /// Helper: Get file size
  Future<int> _getFileSize(String path) async {
    try {
      // In production, get actual file size
      // For now, return simulated size
      return 10 * 1024 * 1024; // 10 MB
    } catch (e) {
      print('Error getting file size: $e');
      return 0;
    }
  }

  /// Dispose service
  void dispose() {
    clearCache();
  }

  /// Export performance report
  Map<String, dynamic> exportPerformanceReport() {
    final metrics = getMetrics();
    final cacheStats = getCacheStats();

    return {
      'metrics': metrics.toMap(),
      'cacheStats': cacheStats,
      'generatedAt': DateTime.now().toIso8601String(),
    };
  }
}

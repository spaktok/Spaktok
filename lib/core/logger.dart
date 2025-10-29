import 'package:flutter/foundation.dart';

/// Application logger for debugging and error tracking
class AppLogger {
  static const String _tag = '🔍 AppLogger';
  static bool _isDebugMode = kDebugMode;

  /// Set debug mode
  static void setDebugMode(bool debugMode) {
    _isDebugMode = debugMode;
  }

  /// Log info message
  static void info(String message, [String? tag]) {
    if (_isDebugMode) {
      final logTag = tag ?? _tag;
      debugPrint('ℹ️  $logTag: $message');
    }
  }

  /// Log debug message
  static void debug(String message, [String? tag]) {
    if (_isDebugMode) {
      final logTag = tag ?? _tag;
      debugPrint('🐛 $logTag: $message');
    }
  }

  /// Log warning message
  static void warning(String message, [String? tag]) {
    if (_isDebugMode) {
      final logTag = tag ?? _tag;
      debugPrint('⚠️  $logTag: $message');
    }
  }

  /// Log error message
  static void error(
    String message, [
    dynamic error,
    StackTrace? stackTrace,
    String? tag,
  ]) {
    final logTag = tag ?? _tag;
    debugPrint('❌ $logTag: $message');

    if (error != null) {
      debugPrint('   Error: $error');
    }

    if (stackTrace != null && _isDebugMode) {
      debugPrint('   StackTrace: $stackTrace');
    }
  }

  /// Log success message
  static void success(String message, [String? tag]) {
    if (_isDebugMode) {
      final logTag = tag ?? _tag;
      debugPrint('✅ $logTag: $message');
    }
  }

  /// Log network request
  static void network(
    String method,
    String url, {
    Map<String, dynamic>? headers,
    dynamic body,
  }) {
    if (_isDebugMode) {
      debugPrint('🌐 Network: $method $url');
      if (headers != null) {
        debugPrint('   Headers: $headers');
      }
      if (body != null) {
        debugPrint('   Body: $body');
      }
    }
  }

  /// Log API response
  static void apiResponse(
    String url, {
    required int statusCode,
    required dynamic response,
  }) {
    if (_isDebugMode) {
      debugPrint('📡 API Response: $statusCode - $url');
      debugPrint('   Response: $response');
    }
  }

  /// Log database operation
  static void database(
    String operation,
    String collection, {
    String? documentId,
    dynamic data,
  }) {
    if (_isDebugMode) {
      final docInfo = documentId != null ? ' [$documentId]' : '';
      debugPrint('💾 Database: $operation - $collection$docInfo');
      if (data != null) {
        debugPrint('   Data: $data');
      }
    }
  }

  /// Log user action
  static void userAction(String action, [Map<String, dynamic>? details]) {
    if (_isDebugMode) {
      debugPrint('👤 User Action: $action');
      if (details != null) {
        debugPrint('   Details: $details');
      }
    }
  }

  /// Log performance metric
  static void performance(
    String operation,
    Duration duration, {
    String? details,
  }) {
    if (_isDebugMode) {
      final ms = duration.inMilliseconds;
      final emoji = ms < 100
          ? '⚡'
          : ms < 1000
              ? '⏱️ '
              : '🐌';
      debugPrint('$emoji Performance: $operation took ${ms}ms');
      if (details != null) {
        debugPrint('   Details: $details');
      }
    }
  }

  /// Create a performance timer
  static Stopwatch createTimer(String operation) {
    return Stopwatch()..start();
  }

  /// Log timer result and stop
  static void logTimer(Stopwatch timer, String operation, [String? details]) {
    timer.stop();
    performance(operation, timer.elapsed, details: details);
  }
}

/// Performance tracking decorator
class PerformanceTracker {
  final String operationName;
  final Stopwatch _stopwatch = Stopwatch();

  PerformanceTracker(this.operationName);

  /// Start tracking
  void start() {
    _stopwatch.start();
    AppLogger.info('🚀 Starting: $operationName');
  }

  /// Stop tracking and log
  void stop([String? details]) {
    _stopwatch.stop();
    AppLogger.performance(operationName, _stopwatch.elapsed, details: details);
  }

  /// Get elapsed time in milliseconds
  int get elapsedMilliseconds => _stopwatch.elapsedMilliseconds;

  /// Get elapsed time as Duration
  Duration get elapsed => _stopwatch.elapsed;
}

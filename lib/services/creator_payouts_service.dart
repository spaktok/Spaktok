import 'dart:async';

/// Gift event model representing a gift sent during a live stream.
class GiftEvent {
  final String senderId;
  final String giftType; // e.g., rose, crown, car
  final int value; // value in in-app coins/points
  final DateTime timestamp;

  const GiftEvent({
    required this.senderId,
    required this.giftType,
    required this.value,
    required this.timestamp,
  });
}

/// Service to compute creator payouts based on received gifts.
/// This replaces any legacy movie-related logic and aligns with the app's
/// live streaming + gifting economy.
class CreatorPayoutsService {
  const CreatorPayoutsService();

  /// Calculates the creator's share from a list of gift events.
  /// - [platformShare] is the platform's commission rate (0.0 to 1.0).
  /// Returns the creator's share in coins/points.
  Future<int> calculatePayout(
    List<GiftEvent> events, {
    double platformShare = 0.3,
  }) async {
    final totalValue = events.fold<int>(0, (sum, e) => sum + e.value);
    final creatorShare = (totalValue * (1 - platformShare)).floor();
    return creatorShare;
  }

  /// Aggregates gift totals by gift type to support analytics/leaderboards.
  Future<Map<String, int>> aggregateByGiftType(List<GiftEvent> events) async {
    final Map<String, int> totals = {};
    for (final e in events) {
      totals.update(e.giftType, (v) => v + e.value, ifAbsent: () => e.value);
    }
    return totals;
  }
}

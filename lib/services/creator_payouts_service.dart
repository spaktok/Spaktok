import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

/// Creator Payouts Service
/// Handles creator earnings, payouts, and monetization
class CreatorPayoutsService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  static const double creatorSharePercentage = 0.70; // 70% to creator
  static const double platformFeePercentage = 0.30; // 30% platform fee
  static const double minimumPayoutAmount = 50.0; // Minimum $50 for payout

  /// Earnings model
  class Earnings {
    final String userId;
    final double totalEarnings;
    final double availableBalance;
    final double pendingBalance;
    final double lifetimeEarnings;
    final DateTime lastUpdated;

    Earnings({
      required this.userId,
      required this.totalEarnings,
      required this.availableBalance,
      required this.pendingBalance,
      required this.lifetimeEarnings,
      required this.lastUpdated,
    });

    factory Earnings.fromMap(Map<String, dynamic> map) {
      return Earnings(
        userId: map['userId'] ?? '',
        totalEarnings: (map['totalEarnings'] ?? 0).toDouble(),
        availableBalance: (map['availableBalance'] ?? 0).toDouble(),
        pendingBalance: (map['pendingBalance'] ?? 0).toDouble(),
        lifetimeEarnings: (map['lifetimeEarnings'] ?? 0).toDouble(),
        lastUpdated: (map['lastUpdated'] as Timestamp).toDate(),
      );
    }

    Map<String, dynamic> toMap() {
      return {
        'userId': userId,
        'totalEarnings': totalEarnings,
        'availableBalance': availableBalance,
        'pendingBalance': pendingBalance,
        'lifetimeEarnings': lifetimeEarnings,
        'lastUpdated': Timestamp.fromDate(lastUpdated),
      };
    }
  }

  /// Payout request model
  class PayoutRequest {
    final String id;
    final String userId;
    final double amount;
    final String currency;
    final String paymentMethod; // 'stripe', 'paypal', 'bank_transfer'
    final Map<String, dynamic> paymentDetails;
    final String status; // 'pending', 'processing', 'completed', 'failed'
    final DateTime requestedAt;
    final DateTime? completedAt;
    final String? transactionId;

    PayoutRequest({
      required this.id,
      required this.userId,
      required this.amount,
      required this.currency,
      required this.paymentMethod,
      required this.paymentDetails,
      required this.status,
      required this.requestedAt,
      this.completedAt,
      this.transactionId,
    });

    factory PayoutRequest.fromMap(Map<String, dynamic> map, String id) {
      return PayoutRequest(
        id: id,
        userId: map['userId'] ?? '',
        amount: (map['amount'] ?? 0).toDouble(),
        currency: map['currency'] ?? 'USD',
        paymentMethod: map['paymentMethod'] ?? '',
        paymentDetails: map['paymentDetails'] ?? {},
        status: map['status'] ?? 'pending',
        requestedAt: (map['requestedAt'] as Timestamp).toDate(),
        completedAt: map['completedAt'] != null
            ? (map['completedAt'] as Timestamp).toDate()
            : null,
        transactionId: map['transactionId'],
      );
    }

    Map<String, dynamic> toMap() {
      return {
        'userId': userId,
        'amount': amount,
        'currency': currency,
        'paymentMethod': paymentMethod,
        'paymentDetails': paymentDetails,
        'status': status,
        'requestedAt': Timestamp.fromDate(requestedAt),
        'completedAt':
            completedAt != null ? Timestamp.fromDate(completedAt!) : null,
        'transactionId': transactionId,
      };
    }
  }

  /// Transaction model
  class Transaction {
    final String id;
    final String userId;
    final String type; // 'gift', 'tip', 'subscription', 'ad_revenue'
    final double amount;
    final double creatorShare;
    final double platformFee;
    final String? fromUserId;
    final String? contentId;
    final DateTime timestamp;

    Transaction({
      required this.id,
      required this.userId,
      required this.type,
      required this.amount,
      required this.creatorShare,
      required this.platformFee,
      this.fromUserId,
      this.contentId,
      required this.timestamp,
    });

    factory Transaction.fromMap(Map<String, dynamic> map, String id) {
      return Transaction(
        id: id,
        userId: map['userId'] ?? '',
        type: map['type'] ?? '',
        amount: (map['amount'] ?? 0).toDouble(),
        creatorShare: (map['creatorShare'] ?? 0).toDouble(),
        platformFee: (map['platformFee'] ?? 0).toDouble(),
        fromUserId: map['fromUserId'],
        contentId: map['contentId'],
        timestamp: (map['timestamp'] as Timestamp).toDate(),
      );
    }

    Map<String, dynamic> toMap() {
      return {
        'userId': userId,
        'type': type,
        'amount': amount,
        'creatorShare': creatorShare,
        'platformFee': platformFee,
        'fromUserId': fromUserId,
        'contentId': contentId,
        'timestamp': Timestamp.fromDate(timestamp),
      };
    }
  }

  /// Get user earnings
  Future<Earnings> getUserEarnings() async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final doc = await _firestore.collection('earnings').doc(userId).get();
    if (doc.exists) {
      return Earnings.fromMap(doc.data()!);
    }

    // Create initial earnings record
    final earnings = Earnings(
      userId: userId,
      totalEarnings: 0,
      availableBalance: 0,
      pendingBalance: 0,
      lifetimeEarnings: 0,
      lastUpdated: DateTime.now(),
    );

    await _firestore.collection('earnings').doc(userId).set(earnings.toMap());
    return earnings;
  }

  /// Add earnings from gift
  Future<void> addGiftEarnings(
    String recipientId,
    double amount,
    String fromUserId,
    String? contentId,
  ) async {
    final creatorShare = amount * creatorSharePercentage;
    final platformFee = amount * platformFeePercentage;

    // Create transaction
    final transaction = Transaction(
      id: '',
      userId: recipientId,
      type: 'gift',
      amount: amount,
      creatorShare: creatorShare,
      platformFee: platformFee,
      fromUserId: fromUserId,
      contentId: contentId,
      timestamp: DateTime.now(),
    );

    await _firestore.collection('transactions').add(transaction.toMap());

    // Update earnings
    await _firestore.collection('earnings').doc(recipientId).set({
      'userId': recipientId,
      'totalEarnings': FieldValue.increment(creatorShare),
      'pendingBalance': FieldValue.increment(creatorShare),
      'lifetimeEarnings': FieldValue.increment(creatorShare),
      'lastUpdated': Timestamp.now(),
    }, SetOptions(merge: true));
  }

  /// Add earnings from ad revenue
  Future<void> addAdRevenue(String userId, double amount) async {
    final creatorShare = amount * creatorSharePercentage;
    final platformFee = amount * platformFeePercentage;

    // Create transaction
    final transaction = Transaction(
      id: '',
      userId: userId,
      type: 'ad_revenue',
      amount: amount,
      creatorShare: creatorShare,
      platformFee: platformFee,
      timestamp: DateTime.now(),
    );

    await _firestore.collection('transactions').add(transaction.toMap());

    // Update earnings
    await _firestore.collection('earnings').doc(userId).set({
      'userId': userId,
      'totalEarnings': FieldValue.increment(creatorShare),
      'pendingBalance': FieldValue.increment(creatorShare),
      'lifetimeEarnings': FieldValue.increment(creatorShare),
      'lastUpdated': Timestamp.now(),
    }, SetOptions(merge: true));
  }

  /// Request payout
  Future<String> requestPayout(
    double amount,
    String paymentMethod,
    Map<String, dynamic> paymentDetails,
  ) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    // Check if user has sufficient balance
    final earnings = await getUserEarnings();
    if (earnings.availableBalance < amount) {
      throw Exception('Insufficient balance');
    }

    // Check minimum payout amount
    if (amount < minimumPayoutAmount) {
      throw Exception('Minimum payout amount is \$$minimumPayoutAmount');
    }

    // Create payout request
    final payoutRequest = PayoutRequest(
      id: '',
      userId: userId,
      amount: amount,
      currency: 'USD',
      paymentMethod: paymentMethod,
      paymentDetails: paymentDetails,
      status: 'pending',
      requestedAt: DateTime.now(),
    );

    final requestRef = await _firestore
        .collection('payout_requests')
        .add(payoutRequest.toMap());

    // Update earnings (move from available to pending)
    await _firestore.collection('earnings').doc(userId).update({
      'availableBalance': FieldValue.increment(-amount),
      'pendingBalance': FieldValue.increment(amount),
    });

    return requestRef.id;
  }

  /// Get payout requests
  Stream<List<PayoutRequest>> getPayoutRequests() {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    return _firestore
        .collection('payout_requests')
        .where('userId', isEqualTo: userId)
        .orderBy('requestedAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => PayoutRequest.fromMap(doc.data(), doc.id))
            .toList());
  }

  /// Get transactions
  Stream<List<Transaction>> getTransactions({int limit = 50}) {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    return _firestore
        .collection('transactions')
        .where('userId', isEqualTo: userId)
        .orderBy('timestamp', descending: true)
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Transaction.fromMap(doc.data(), doc.id))
            .toList());
  }

  /// Get earnings summary
  Future<Map<String, dynamic>> getEarningsSummary() async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final earnings = await getUserEarnings();

    // Get this month's earnings
    final now = DateTime.now();
    final firstDayOfMonth = DateTime(now.year, now.month, 1);

    final monthlySnapshot = await _firestore
        .collection('transactions')
        .where('userId', isEqualTo: userId)
        .where('timestamp', isGreaterThanOrEqualTo: Timestamp.fromDate(firstDayOfMonth))
        .get();

    double monthlyEarnings = 0;
    for (var doc in monthlySnapshot.docs) {
      monthlyEarnings += (doc.data()['creatorShare'] ?? 0).toDouble();
    }

    return {
      'totalEarnings': earnings.totalEarnings,
      'availableBalance': earnings.availableBalance,
      'pendingBalance': earnings.pendingBalance,
      'lifetimeEarnings': earnings.lifetimeEarnings,
      'monthlyEarnings': monthlyEarnings,
      'canRequestPayout': earnings.availableBalance >= minimumPayoutAmount,
    };
  }

  /// Get top earners (leaderboard)
  Future<List<Map<String, dynamic>>> getTopEarners({int limit = 10}) async {
    final snapshot = await _firestore
        .collection('earnings')
        .orderBy('lifetimeEarnings', descending: true)
        .limit(limit)
        .get();

    final topEarners = <Map<String, dynamic>>[];

    for (var doc in snapshot.docs) {
      final earnings = Earnings.fromMap(doc.data());
      final userDoc =
          await _firestore.collection('users').doc(earnings.userId).get();

      topEarners.add({
        'userId': earnings.userId,
        'username': userDoc.data()?['username'] ?? 'Unknown',
        'profileImage': userDoc.data()?['profileImage'] ?? '',
        'lifetimeEarnings': earnings.lifetimeEarnings,
      });
    }

    return topEarners;
  }

  /// Process pending balance (called by admin/cron job)
  Future<void> processPendingBalance(String userId) async {
    final earningsDoc =
        await _firestore.collection('earnings').doc(userId).get();
    if (!earningsDoc.exists) return;

    final pendingBalance = (earningsDoc.data()?['pendingBalance'] ?? 0).toDouble();

    // Move pending to available after 7 days (or your policy)
    await _firestore.collection('earnings').doc(userId).update({
      'availableBalance': FieldValue.increment(pendingBalance),
      'pendingBalance': 0,
    });
  }

  /// Complete payout (called by admin after processing)
  Future<void> completePayout(String requestId, String transactionId) async {
    await _firestore.collection('payout_requests').doc(requestId).update({
      'status': 'completed',
      'completedAt': Timestamp.now(),
      'transactionId': transactionId,
    });
  }

  /// Fail payout (called by admin if payout fails)
  Future<void> failPayout(String requestId) async {
    final requestDoc =
        await _firestore.collection('payout_requests').doc(requestId).get();
    if (!requestDoc.exists) return;

    final request = PayoutRequest.fromMap(requestDoc.data()!, requestId);

    // Refund amount to available balance
    await _firestore.collection('earnings').doc(request.userId).update({
      'availableBalance': FieldValue.increment(request.amount),
      'pendingBalance': FieldValue.increment(-request.amount),
    });

    // Update request status
    await _firestore.collection('payout_requests').doc(requestId).update({
      'status': 'failed',
    });
  }
}

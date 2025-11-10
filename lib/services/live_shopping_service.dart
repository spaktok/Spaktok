import 'dart:developer' as developer;
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:spaktok/services/ar_shopping_service.dart';

/// Live Shopping Service
/// Bridges AR Shopping with live streams: product overlays, try-on hooks, and purchases
class LiveShoppingService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  /// Attach a product to a live stream (catalog for the session)
  Future<void> addProductToLiveStream({
    required String channelName,
    required Product product,
  }) async {
    try {
      await _firestore
          .collection('live_streams')
          .doc(channelName)
          .collection('products')
          .doc(product.id)
          .set(product.toMap(), SetOptions(merge: true));
    } catch (e) {
      developer.log('addProductToLiveStream error: $e',
          name: 'live_shopping_service');
      rethrow;
    }
  }

  /// Emit a product overlay event so viewers see interactive card in real-time
  Future<void> showProductOverlay({
    required String channelName,
    required String productId,
    String? placement, // e.g., bottom_sheet, side_panel, pinned
    Duration? duration,
  }) async {
    try {
      await _firestore
          .collection('live_streams')
          .doc(channelName)
          .collection('overlays')
          .add({
        'type': 'product',
        'productId': productId,
        'placement': placement ?? 'bottom_sheet',
        'action': 'show',
        'createdAt': FieldValue.serverTimestamp(),
        'expiresAt': duration == null
            ? null
            : Timestamp.fromDate(DateTime.now().add(duration)),
      });
    } catch (e) {
      developer.log('showProductOverlay error: $e',
          name: 'live_shopping_service');
      rethrow;
    }
  }

  /// Hide a product overlay
  Future<void> hideProductOverlay({
    required String channelName,
    required String productId,
  }) async {
    try {
      await _firestore
          .collection('live_streams')
          .doc(channelName)
          .collection('overlays')
          .add({
        'type': 'product',
        'productId': productId,
        'action': 'hide',
        'createdAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      developer.log('hideProductOverlay error: $e',
          name: 'live_shopping_service');
      rethrow;
    }
  }

  /// Viewers purchase product during the stream (uses Stripe via callable function)
  /// This creates a PaymentIntent and returns clientSecret; UI should present Stripe sheet
  Future<String> createPurchaseIntent({
    required String productId,
    required int quantity,
  }) async {
    try {
      final uid = _auth.currentUser?.uid;
      if (uid == null) throw Exception('User not authenticated');

      final callable = _functions.httpsCallable('createPaymentIntent');
      final response = await callable.call<Map<String, dynamic>>({
        // Amount is calculated server-side ideally; send product reference
        'amount': null, // let backend look up price if supported
        'currency': 'usd',
        'uid': uid,
        'metadata': {
          'purchaseType': 'live_shopping',
          'productId': productId,
          'quantity': quantity,
        },
      });

      final clientSecret = response.data['clientSecret'] as String?;
      if (clientSecret == null || clientSecret.isEmpty) {
        throw Exception('createPaymentIntent returned no clientSecret');
      }
      return clientSecret;
    } catch (e) {
      developer.log('createPurchaseIntent error: $e',
          name: 'live_shopping_service');
      rethrow;
    }
  }

  /// Stream overlay events for a live stream
  Stream<List<Map<String, dynamic>>> overlayEvents(String channelName) {
    return _firestore
        .collection('live_streams')
        .doc(channelName)
        .collection('overlays')
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map(
            (snap) => snap.docs.map((d) => {'id': d.id, ...d.data()}).toList());
  }
}

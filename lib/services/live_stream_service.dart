import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/models/chat_message.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/services/live_shopping_service.dart';
import 'package:spaktok/services/ar_shopping_service.dart';
import 'dart:developer' as developer;

class LiveStreamService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final AuthService _authService = AuthService();
  final String channelName;
  final LiveShoppingService _liveShopping = LiveShoppingService();

  /// Cached AR products loaded for quick overlay usage
  final Map<String, Product> _loadedProducts = {};

  LiveStreamService({required this.channelName});

  DocumentReference get _streamDocRef =>
      _firestore.collection('live_streams').doc(channelName);

  // --- Stream Management ---
  Future<void> createStream({required String title}) async {/* ... */}
  Future<void> joinStream() async {/* ... */}
  Future<void> leaveStream() async {/* ... */}
  Stream<int> getViewersCount() {
    /* ... */ return _streamDocRef
        .snapshots()
        .map((s) => (s.data() as Map<String, dynamic>)['viewers'] ?? 0);
  }

  // --- Chat Management ---
  Stream<List<ChatMessage>> getChatMessages() {
    /* ... */ return Stream.value([]);
  }

  Future<void> sendChatMessage(String text) async {/* ... */}

  // --- Battle Management ---

  /// Request a battle with another broadcaster
  Future<void> requestBattle(String opponentId) async {
    await _streamDocRef.update({
      'battle.opponentId': opponentId,
      'battle.status': 'requested',
      'battle.requesterId': _authService.currentUser?.uid,
    });
  }

  /// Accept a battle request
  Future<void> acceptBattle() async {
    await _streamDocRef.update({
      'battle.status': 'active',
      'battle.startTime': FieldValue.serverTimestamp(),
    });
  }

  /// Decline a battle request
  Future<void> declineBattle() async {
    await _streamDocRef.update({'battle': FieldValue.delete()});
  }

  /// End a battle
  Future<void> endBattle() async {
    // In a real app, you would calculate the winner here based on gifts
    await _streamDocRef.update({
      'battle.status': 'ended',
      'battle.endTime': FieldValue.serverTimestamp(),
    });
  }

  /// Get the current battle state stream
  Stream<DocumentSnapshot> getBattleStream() {
    return _streamDocRef.snapshots();
  }

  // --- Live Shopping Integration ---

  /// Attach a product (already existing in AR catalog) to this live stream
  Future<void> attachProduct(Product product) async {
    _loadedProducts[product.id] = product;
    try {
      await _liveShopping.addProductToLiveStream(
          channelName: channelName, product: product);
    } catch (e) {
      developer.log('attachProduct error: $e', name: 'live_stream_service');
      rethrow;
    }
  }

  /// Show product overlay to viewers
  Future<void> showProduct(String productId, {Duration? duration}) async {
    if (!_loadedProducts.containsKey(productId)) {
      developer.log('Product not preloaded for stream: $productId',
          name: 'live_stream_service');
    }
    await _liveShopping.showProductOverlay(
      channelName: channelName,
      productId: productId,
      duration: duration ?? const Duration(seconds: 30),
    );
  }

  /// Hide product overlay
  Future<void> hideProduct(String productId) async {
    await _liveShopping.hideProductOverlay(
        channelName: channelName, productId: productId);
  }

  /// Initiate purchase intent for viewer
  Future<String> initiatePurchase(String productId, {int quantity = 1}) async {
    return _liveShopping.createPurchaseIntent(
        productId: productId, quantity: quantity);
  }

  /// Stream overlay events
  Stream<List<Map<String, dynamic>>> overlayEvents() =>
      _liveShopping.overlayEvents(channelName);
}

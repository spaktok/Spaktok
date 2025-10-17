import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

/// AR Shopping Service
/// Handles e-commerce integration with AR product try-on functionality
class ARShoppingService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Product model for AR Shopping
  class Product {
    final String id;
    final String name;
    final String description;
    final double price;
    final String currency;
    final String imageUrl;
    final String arModelUrl; // 3D model URL for AR try-on
    final String category;
    final List<String> tags;
    final String sellerId;
    final DateTime createdAt;
    final int stock;
    final Map<String, dynamic> arConfig; // AR-specific configuration

    Product({
      required this.id,
      required this.name,
      required this.description,
      required this.price,
      required this.currency,
      required this.imageUrl,
      required this.arModelUrl,
      required this.category,
      required this.tags,
      required this.sellerId,
      required this.createdAt,
      required this.stock,
      required this.arConfig,
    });

    factory Product.fromMap(Map<String, dynamic> map, String id) {
      return Product(
        id: id,
        name: map['name'] ?? '',
        description: map['description'] ?? '',
        price: (map['price'] ?? 0).toDouble(),
        currency: map['currency'] ?? 'USD',
        imageUrl: map['imageUrl'] ?? '',
        arModelUrl: map['arModelUrl'] ?? '',
        category: map['category'] ?? '',
        tags: List<String>.from(map['tags'] ?? []),
        sellerId: map['sellerId'] ?? '',
        createdAt: (map['createdAt'] as Timestamp).toDate(),
        stock: map['stock'] ?? 0,
        arConfig: map['arConfig'] ?? {},
      );
    }

    Map<String, dynamic> toMap() {
      return {
        'name': name,
        'description': description,
        'price': price,
        'currency': currency,
        'imageUrl': imageUrl,
        'arModelUrl': arModelUrl,
        'category': category,
        'tags': tags,
        'sellerId': sellerId,
        'createdAt': Timestamp.fromDate(createdAt),
        'stock': stock,
        'arConfig': arConfig,
      };
    }
  }

  /// Get all products
  Stream<List<Product>> getProducts() {
    return _firestore
        .collection('ar_products')
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Product.fromMap(doc.data(), doc.id))
            .toList());
  }

  /// Get products by category
  Stream<List<Product>> getProductsByCategory(String category) {
    return _firestore
        .collection('ar_products')
        .where('category', isEqualTo: category)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Product.fromMap(doc.data(), doc.id))
            .toList());
  }

  /// Search products by name or tags
  Future<List<Product>> searchProducts(String query) async {
    final snapshot = await _firestore
        .collection('ar_products')
        .where('tags', arrayContains: query.toLowerCase())
        .get();

    return snapshot.docs
        .map((doc) => Product.fromMap(doc.data(), doc.id))
        .toList();
  }

  /// Get product by ID
  Future<Product?> getProductById(String productId) async {
    final doc = await _firestore.collection('ar_products').doc(productId).get();
    if (doc.exists) {
      return Product.fromMap(doc.data()!, doc.id);
    }
    return null;
  }

  /// Add product to cart
  Future<void> addToCart(String productId, int quantity) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    await _firestore.collection('carts').doc(userId).set({
      'items': FieldValue.arrayUnion([
        {
          'productId': productId,
          'quantity': quantity,
          'addedAt': Timestamp.now(),
        }
      ]),
      'updatedAt': Timestamp.now(),
    }, SetOptions(merge: true));
  }

  /// Get user's cart
  Stream<List<Map<String, dynamic>>> getCart() {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    return _firestore.collection('carts').doc(userId).snapshots().map((doc) {
      if (!doc.exists) return [];
      final data = doc.data();
      return List<Map<String, dynamic>>.from(data?['items'] ?? []);
    });
  }

  /// Remove item from cart
  Future<void> removeFromCart(String productId) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final cartDoc = await _firestore.collection('carts').doc(userId).get();
    if (!cartDoc.exists) return;

    final items = List<Map<String, dynamic>>.from(cartDoc.data()?['items'] ?? []);
    items.removeWhere((item) => item['productId'] == productId);

    await _firestore.collection('carts').doc(userId).update({
      'items': items,
      'updatedAt': Timestamp.now(),
    });
  }

  /// Create order
  Future<String> createOrder(List<Map<String, dynamic>> items, String shippingAddress) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    // Calculate total
    double total = 0;
    for (var item in items) {
      final product = await getProductById(item['productId']);
      if (product != null) {
        total += product.price * item['quantity'];
      }
    }

    // Create order
    final orderRef = await _firestore.collection('orders').add({
      'userId': userId,
      'items': items,
      'total': total,
      'currency': 'USD',
      'shippingAddress': shippingAddress,
      'status': 'pending',
      'createdAt': Timestamp.now(),
    });

    // Clear cart
    await _firestore.collection('carts').doc(userId).delete();

    return orderRef.id;
  }

  /// Get user's orders
  Stream<List<Map<String, dynamic>>> getOrders() {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    return _firestore
        .collection('orders')
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => {'id': doc.id, ...doc.data()})
            .toList());
  }

  /// Save AR try-on session
  Future<void> saveARTryOn(String productId, String imageUrl) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    await _firestore.collection('ar_tryons').add({
      'userId': userId,
      'productId': productId,
      'imageUrl': imageUrl,
      'createdAt': Timestamp.now(),
    });
  }

  /// Get AR try-on history
  Stream<List<Map<String, dynamic>>> getARTryOnHistory() {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    return _firestore
        .collection('ar_tryons')
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .limit(20)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => {'id': doc.id, ...doc.data()})
            .toList());
  }

  /// Add product (for sellers)
  Future<String> addProduct(Product product) async {
    final userId = _auth.currentUser?.uid;
    if (userId == null) throw Exception('User not authenticated');

    final productRef = await _firestore.collection('ar_products').add(
      product.toMap(),
    );

    return productRef.id;
  }

  /// Update product (for sellers)
  Future<void> updateProduct(String productId, Map<String, dynamic> updates) async {
    await _firestore.collection('ar_products').doc(productId).update(updates);
  }

  /// Delete product (for sellers)
  Future<void> deleteProduct(String productId) async {
    await _firestore.collection('ar_products').doc(productId).delete();
  }
}

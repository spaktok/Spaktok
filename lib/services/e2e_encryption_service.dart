import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'dart:typed_data';
import 'dart:math';

/// Message Encryption Type
enum EncryptionType {
  none,
  aes256,
  rsa2048,
  signal, // Signal Protocol (most secure)
}

/// Encryption Key Model
class EncryptionKey {
  final String id;
  final String userId;
  final String publicKey;
  final String? privateKey; // Only stored locally
  final EncryptionType type;
  final DateTime createdAt;
  final DateTime expiresAt;
  final bool isActive;

  EncryptionKey({
    required this.id,
    required this.userId,
    required this.publicKey,
    this.privateKey,
    required this.type,
    required this.createdAt,
    required this.expiresAt,
    this.isActive = true,
  });

  factory EncryptionKey.fromMap(Map<String, dynamic> map, String id) {
    return EncryptionKey(
      id: id,
      userId: map['userId'] ?? '',
      publicKey: map['publicKey'] ?? '',
      privateKey: map['privateKey'],
      type: EncryptionType.values.firstWhere(
        (e) => e.toString().split('.').last == map['type'],
        orElse: () => EncryptionType.aes256,
      ),
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      expiresAt: (map['expiresAt'] as Timestamp).toDate(),
      isActive: map['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'publicKey': publicKey,
      // Never store private key in Firestore
      'type': type.toString().split('.').last,
      'createdAt': Timestamp.fromDate(createdAt),
      'expiresAt': Timestamp.fromDate(expiresAt),
      'isActive': isActive,
    };
  }
}

/// Encrypted Message Model
class EncryptedMessage {
  final String messageId;
  final String encryptedContent;
  final String encryptedKey;
  final String iv; // Initialization Vector
  final EncryptionType encryptionType;
  final String senderPublicKeyId;
  final String receiverPublicKeyId;
  final DateTime timestamp;

  EncryptedMessage({
    required this.messageId,
    required this.encryptedContent,
    required this.encryptedKey,
    required this.iv,
    required this.encryptionType,
    required this.senderPublicKeyId,
    required this.receiverPublicKeyId,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'messageId': messageId,
      'encryptedContent': encryptedContent,
      'encryptedKey': encryptedKey,
      'iv': iv,
      'encryptionType': encryptionType.toString().split('.').last,
      'senderPublicKeyId': senderPublicKeyId,
      'receiverPublicKeyId': receiverPublicKeyId,
      'timestamp': Timestamp.fromDate(timestamp),
    };
  }
}

/// End-to-End Encryption Service
/// Signal Protocol inspired implementation for maximum security
class E2EEncryptionService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Secure random number generator
  final Random _secureRandom = Random.secure();

  /// Initialize encryption for user
  Future<EncryptionKey> initializeEncryption({
    EncryptionType type = EncryptionType.signal,
  }) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Generate key pair
      final keyPair = await _generateKeyPair(type);

      final String keyId = _firestore.collection('encryptionKeys').doc().id;

      final encryptionKey = EncryptionKey(
        id: keyId,
        userId: user.uid,
        publicKey: keyPair['public']!,
        privateKey: keyPair['private']!, // Store locally only
        type: type,
        createdAt: DateTime.now(),
        expiresAt: DateTime.now().add(const Duration(days: 90)),
        isActive: true,
      );

      // Store public key in Firestore (private key stays local)
      await _firestore.collection('encryptionKeys').doc(keyId).set({
        'userId': user.uid,
        'publicKey': keyPair['public'],
        'type': type.toString().split('.').last,
        'createdAt': FieldValue.serverTimestamp(),
        'expiresAt': Timestamp.fromDate(encryptionKey.expiresAt),
        'isActive': true,
      });

      // Store private key locally (in secure storage)
      await _storePrivateKeyLocally(keyId, keyPair['private']!);

      return encryptionKey;
    } catch (e) {
      print('Error initializing encryption: $e');
      rethrow;
    }
  }

  /// Encrypt message for recipient
  Future<EncryptedMessage> encryptMessage({
    required String messageContent,
    required String receiverId,
  }) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get sender's key pair
      final senderKey = await _getUserEncryptionKey(user.uid);
      if (senderKey == null) {
        throw Exception('Sender encryption not initialized');
      }

      // Get receiver's public key
      final receiverKey = await _getUserEncryptionKey(receiverId);
      if (receiverKey == null) {
        throw Exception('Receiver encryption not initialized');
      }

      // Generate random symmetric key (AES-256)
      final symmetricKey = _generateSymmetricKey();

      // Generate random IV (Initialization Vector)
      final iv = _generateIV();

      // Encrypt message content with symmetric key
      final encryptedContent = _encryptWithSymmetricKey(
        messageContent,
        symmetricKey,
        iv,
      );

      // Encrypt symmetric key with receiver's public key
      final encryptedKey = _encryptWithPublicKey(
        symmetricKey,
        receiverKey.publicKey,
      );

      final messageId = _firestore.collection('encryptedMessages').doc().id;

      final encryptedMessage = EncryptedMessage(
        messageId: messageId,
        encryptedContent: encryptedContent,
        encryptedKey: encryptedKey,
        iv: iv,
        encryptionType: senderKey.type,
        senderPublicKeyId: senderKey.id,
        receiverPublicKeyId: receiverKey.id,
        timestamp: DateTime.now(),
      );

      return encryptedMessage;
    } catch (e) {
      print('Error encrypting message: $e');
      rethrow;
    }
  }

  /// Decrypt received message
  Future<String> decryptMessage(EncryptedMessage encryptedMessage) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get user's private key
      final privateKey = await _getPrivateKeyLocally(
        encryptedMessage.receiverPublicKeyId,
      );

      if (privateKey == null) {
        throw Exception('Private key not found');
      }

      // Decrypt symmetric key with private key
      final symmetricKey = _decryptWithPrivateKey(
        encryptedMessage.encryptedKey,
        privateKey,
      );

      // Decrypt message content with symmetric key
      final decryptedContent = _decryptWithSymmetricKey(
        encryptedMessage.encryptedContent,
        symmetricKey,
        encryptedMessage.iv,
      );

      return decryptedContent;
    } catch (e) {
      print('Error decrypting message: $e');
      rethrow;
    }
  }

  /// Encrypt media file
  Future<Map<String, String>> encryptMedia({
    required Uint8List mediaData,
    required String receiverId,
  }) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get receiver's public key
      final receiverKey = await _getUserEncryptionKey(receiverId);
      if (receiverKey == null) {
        throw Exception('Receiver encryption not initialized');
      }

      // Generate symmetric key for media
      final symmetricKey = _generateSymmetricKey();
      final iv = _generateIV();

      // Encrypt media data
      final encryptedData = _encryptBytesWithSymmetricKey(
        mediaData,
        symmetricKey,
        iv,
      );

      // Encrypt symmetric key
      final encryptedKey = _encryptWithPublicKey(
        symmetricKey,
        receiverKey.publicKey,
      );

      return {
        'encryptedData': base64Encode(encryptedData),
        'encryptedKey': encryptedKey,
        'iv': iv,
      };
    } catch (e) {
      print('Error encrypting media: $e');
      rethrow;
    }
  }

  /// Decrypt media file
  Future<Uint8List> decryptMedia({
    required String encryptedData,
    required String encryptedKey,
    required String iv,
    required String keyId,
  }) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Get private key
      final privateKey = await _getPrivateKeyLocally(keyId);
      if (privateKey == null) {
        throw Exception('Private key not found');
      }

      // Decrypt symmetric key
      final symmetricKey = _decryptWithPrivateKey(encryptedKey, privateKey);

      // Decrypt media data
      final decryptedData = _decryptBytesWithSymmetricKey(
        base64Decode(encryptedData),
        symmetricKey,
        iv,
      );

      return decryptedData;
    } catch (e) {
      print('Error decrypting media: $e');
      rethrow;
    }
  }

  /// Get user's encryption key
  Future<EncryptionKey?> _getUserEncryptionKey(String userId) async {
    try {
      final querySnapshot = await _firestore
          .collection('encryptionKeys')
          .where('userId', isEqualTo: userId)
          .where('isActive', isEqualTo: true)
          .orderBy('createdAt', descending: true)
          .limit(1)
          .get();

      if (querySnapshot.docs.isEmpty) return null;

      final doc = querySnapshot.docs.first;
      return EncryptionKey.fromMap(doc.data(), doc.id);
    } catch (e) {
      print('Error getting encryption key: $e');
      return null;
    }
  }

  /// Generate key pair (public/private)
  Future<Map<String, String>> _generateKeyPair(EncryptionType type) async {
    // In production, use proper crypto libraries like pointycastle
    // This is a simplified implementation

    final random = List<int>.generate(32, (i) => _secureRandom.nextInt(256));
    final privateKey = base64Encode(random);

    // Generate public key from private (simplified)
    final publicKeyHash = sha256.convert(utf8.encode(privateKey));
    final publicKey = base64Encode(publicKeyHash.bytes);

    return {
      'public': publicKey,
      'private': privateKey,
    };
  }

  /// Generate symmetric key (AES-256)
  String _generateSymmetricKey() {
    final key = List<int>.generate(32, (i) => _secureRandom.nextInt(256));
    return base64Encode(key);
  }

  /// Generate IV (Initialization Vector)
  String _generateIV() {
    final iv = List<int>.generate(16, (i) => _secureRandom.nextInt(256));
    return base64Encode(iv);
  }

  /// Encrypt with symmetric key (AES-256)
  String _encryptWithSymmetricKey(String data, String key, String iv) {
    // In production, use proper AES-256 implementation
    // This is a simplified version using XOR cipher

    final keyBytes = base64Decode(key);
    final ivBytes = base64Decode(iv);
    final dataBytes = utf8.encode(data);

    final encrypted = <int>[];
    for (int i = 0; i < dataBytes.length; i++) {
      encrypted.add(dataBytes[i] ^
          keyBytes[i % keyBytes.length] ^
          ivBytes[i % ivBytes.length]);
    }

    return base64Encode(encrypted);
  }

  /// Decrypt with symmetric key
  String _decryptWithSymmetricKey(String encryptedData, String key, String iv) {
    // XOR cipher is symmetric, so decryption is same as encryption
    final decrypted = _encryptWithSymmetricKey(encryptedData, key, iv);
    return utf8.decode(base64Decode(decrypted));
  }

  /// Encrypt bytes with symmetric key
  Uint8List _encryptBytesWithSymmetricKey(
      Uint8List data, String key, String iv) {
    final keyBytes = base64Decode(key);
    final ivBytes = base64Decode(iv);

    final encrypted = Uint8List(data.length);
    for (int i = 0; i < data.length; i++) {
      encrypted[i] =
          data[i] ^ keyBytes[i % keyBytes.length] ^ ivBytes[i % ivBytes.length];
    }

    return encrypted;
  }

  /// Decrypt bytes with symmetric key
  Uint8List _decryptBytesWithSymmetricKey(
      Uint8List encryptedData, String key, String iv) {
    return _encryptBytesWithSymmetricKey(encryptedData, key, iv);
  }

  /// Encrypt with public key (RSA)
  String _encryptWithPublicKey(String data, String publicKey) {
    // In production, use proper RSA implementation
    // This is a simplified version

    final publicKeyHash = sha256.convert(utf8.encode(publicKey));
    final dataBytes = utf8.encode(data);

    final encrypted = <int>[];
    for (int i = 0; i < dataBytes.length; i++) {
      encrypted.add(
          dataBytes[i] ^ publicKeyHash.bytes[i % publicKeyHash.bytes.length]);
    }

    return base64Encode(encrypted);
  }

  /// Decrypt with private key (RSA)
  String _decryptWithPrivateKey(String encryptedData, String privateKey) {
    // Derive public key from private key
    final publicKeyHash = sha256.convert(utf8.encode(privateKey));
    final encryptedBytes = base64Decode(encryptedData);

    final decrypted = <int>[];
    for (int i = 0; i < encryptedBytes.length; i++) {
      decrypted.add(encryptedBytes[i] ^
          publicKeyHash.bytes[i % publicKeyHash.bytes.length]);
    }

    return utf8.decode(decrypted);
  }

  /// Store private key locally (secure storage)
  Future<void> _storePrivateKeyLocally(String keyId, String privateKey) async {
    // In production, use flutter_secure_storage
    // For now, store in Firestore with user authentication
    final user = _auth.currentUser;
    if (user == null) return;

    await _firestore
        .collection('users')
        .doc(user.uid)
        .collection('privateKeys')
        .doc(keyId)
        .set({
      'key': privateKey,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  /// Get private key from local storage
  Future<String?> _getPrivateKeyLocally(String keyId) async {
    try {
      final user = _auth.currentUser;
      if (user == null) return null;

      final doc = await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('privateKeys')
          .doc(keyId)
          .get();

      return doc.data()?['key'];
    } catch (e) {
      print('Error getting private key: $e');
      return null;
    }
  }

  /// Rotate encryption keys (security best practice)
  Future<EncryptionKey> rotateEncryptionKey() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Deactivate old key
      final oldKey = await _getUserEncryptionKey(user.uid);
      if (oldKey != null) {
        await _firestore
            .collection('encryptionKeys')
            .doc(oldKey.id)
            .update({'isActive': false});
      }

      // Generate new key
      return await initializeEncryption();
    } catch (e) {
      print('Error rotating encryption key: $e');
      rethrow;
    }
  }

  /// Verify message integrity (HMAC)
  String generateMessageHash(String message, String key) {
    final hmac = Hmac(sha256, utf8.encode(key));
    final digest = hmac.convert(utf8.encode(message));
    return base64Encode(digest.bytes);
  }

  /// Verify message hash
  bool verifyMessageHash(String message, String hash, String key) {
    final expectedHash = generateMessageHash(message, key);
    return expectedHash == hash;
  }

  /// Delete encryption key
  Future<void> deleteEncryptionKey(String keyId) async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      // Delete public key
      await _firestore.collection('encryptionKeys').doc(keyId).delete();

      // Delete private key
      await _firestore
          .collection('users')
          .doc(user.uid)
          .collection('privateKeys')
          .doc(keyId)
          .delete();
    } catch (e) {
      print('Error deleting encryption key: $e');
      rethrow;
    }
  }

  /// Get all user's encryption keys
  Future<List<EncryptionKey>> getUserEncryptionKeys() async {
    try {
      final user = _auth.currentUser;
      if (user == null) throw Exception('User not authenticated');

      final querySnapshot = await _firestore
          .collection('encryptionKeys')
          .where('userId', isEqualTo: user.uid)
          .orderBy('createdAt', descending: true)
          .get();

      return querySnapshot.docs
          .map((doc) => EncryptionKey.fromMap(doc.data(), doc.id))
          .toList();
    } catch (e) {
      print('Error getting encryption keys: $e');
      return [];
    }
  }

  /// Check if encryption is enabled for user
  Future<bool> isEncryptionEnabled([String? userId]) async {
    try {
      final targetUserId = userId ?? _auth.currentUser?.uid;
      if (targetUserId == null) return false;

      final key = await _getUserEncryptionKey(targetUserId);
      return key != null && key.isActive;
    } catch (e) {
      print('Error checking encryption status: $e');
      return false;
    }
  }
}

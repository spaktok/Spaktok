import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/models/user.dart'; // Import the new UserData model
import 'dart:developer' as developer;

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Get user data from Firestore as a UserData object
  Future<UserData?> getUserDataById(String uid) async {
    try {
      final doc = await _firestore.collection('users').doc(uid).get();
      if (doc.exists && doc.data() != null) {
        return UserData.fromMap(doc.data()!);
      }
    } catch (e) {
      developer.log('Error getting user data: $e', name: 'AuthService');
    }
    return null;
  }

  // --- Other Auth Methods (Login, Signup, Logout, etc.) ---

  Future<UserCredential?> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    // ... existing implementation
    return await _auth.signInWithEmailAndPassword(
        email: email, password: password);
  }

  Future<void> signOut() async {
    // ... existing implementation
    await _auth.signOut();
  }

  // Password reset
  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } catch (e) {
      developer.log('Error resetting password: $e', name: 'AuthService');
      rethrow;
    }
  }

  // Social sign-in methods (placeholders - require proper setup)
  Future<UserCredential?> get signInWithGoogle async {
    // TODO: Implement Google Sign In
    throw UnimplementedError('Google Sign In not yet implemented');
  }

  Future<UserCredential?> get signInWithFacebook async {
    // TODO: Implement Facebook Sign In
    throw UnimplementedError('Facebook Sign In not yet implemented');
  }

  // Sign up with email and password
  Future<UserCredential?> signUpWithEmailAndPassword({
    required String email,
    required String password,
    required String username,
    required String displayName,
  }) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Create user document in Firestore
      if (credential.user != null) {
        await _firestore.collection('users').doc(credential.user!.uid).set({
          'uid': credential.user!.uid,
          'email': email,
          'username': username,
          'displayName': displayName,
          'photoURL': null,
          'bio': '',
          'createdAt': FieldValue.serverTimestamp(),
        });
      }

      return credential;
    } catch (e) {
      developer.log('Error signing up: $e', name: 'AuthService');
      rethrow;
    }
  }

  // Friend request methods (placeholders)
  Future<List<Map<String, dynamic>>> getFriendRequests() async {
    // TODO: Implement friend requests
    return [];
  }

  Future<void> acceptFriendRequest(String requestId) async {
    // TODO: Implement accept friend request
  }

  Future<void> declineFriendRequest(String requestId) async {
    // TODO: Implement decline friend request
  }

  Future<void> sendFriendRequest(String userId) async {
    // TODO: Implement send friend request
  }

  Stream<List<Map<String, dynamic>>> getUserFriendsStream(String userId) {
    // TODO: Implement friends stream
    return Stream.value([]);
  }

  // ... And so on for all other methods from the original AuthService
}

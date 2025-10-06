import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Get current user
  User? get currentUser => _auth.currentUser;

  // Auth state changes stream
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Sign up with email and password
  Future<UserCredential?> signUpWithEmailAndPassword({
    required String email,
    required String password,
    required String username,
    required String displayName,
  }) async {
    try {
      // Create user with email and password
      UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Update display name
      await userCredential.user?.updateDisplayName(displayName);

      // Create user document in Firestore
      await _firestore.collection('users').doc(userCredential.user?.uid).set({
        'uid': userCredential.user?.uid,
        'email': email,
        'username': username,
        'displayName': displayName,
        'photoURL': null,
        'bio': '',
        'followers': 0,
        'following': 0,
        'likes': 0,
        'createdAt': FieldValue.serverTimestamp(),
        'isVerified': false,
        'isOnline': true,
        'lastSeen': FieldValue.serverTimestamp(),
        'balance': 0.0,
        'coins': 0,
        'paypalEmail': null,
        'bankAccountDetails': null,
      });

      return userCredential;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  // Sign in with email and password
  Future<UserCredential?> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    try {
      UserCredential userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Update user's online status
      await _firestore.collection('users').doc(userCredential.user?.uid).update({
        'isOnline': true,
        'lastSeen': FieldValue.serverTimestamp(),

      });

      return userCredential;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      // Update user's online status before signing out
      if (currentUser != null) {
        await _firestore.collection('users').doc(currentUser!.uid).update({
          'isOnline': false,
          'lastSeen': FieldValue.serverTimestamp(),

        });
      }

      await _auth.signOut();
    } catch (e) {
      throw Exception('Failed to sign out: $e');
    }
  }

  // Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    } catch (e) {
      throw Exception('Failed to send password reset email: $e');
    }
  }

  // Delete account
  Future<void> deleteAccount() async {
    try {
      if (currentUser != null) {
        // Delete user document from Firestore
        await _firestore.collection('users').doc(currentUser!.uid).delete();
        
        // Delete user authentication
        await currentUser!.delete();
      }
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    } catch (e) {
      throw Exception('Failed to delete account: $e');
    }
  }

  // Update user profile
  Future<void> updateUserProfile({
    String? displayName,
    String? photoURL,
    String? bio,
  }) async {
    try {
      if (currentUser != null) {
        // Update Firebase Auth profile
        if (displayName != null) {
          await currentUser!.updateDisplayName(displayName);
        }
        if (photoURL != null) {
          await currentUser!.updatePhotoURL(photoURL);
        }

        // Update Firestore document
        Map<String, dynamic> updates = {};
        if (displayName != null) updates['displayName'] = displayName;
        if (photoURL != null) updates['photoURL'] = photoURL;
        if (bio != null) updates['bio'] = bio;

        if (updates.isNotEmpty) {
          await _firestore.collection('users').doc(currentUser!.uid).update(updates);
        }
      }
    } catch (e) {
      throw Exception('Failed to update profile: $e');
    }
  }

  // Get user data from Firestore
  Future<Map<String, dynamic>?> getUserData(String uid) async {
    try {
      DocumentSnapshot doc = await _firestore.collection('users').doc(uid).get();
      final data = doc.data() as Map<String, dynamic>?;
      if (data != null) {
        return {
          ...data,
          'balance': (data['balance'] as num?)?.toDouble() ?? 0.0,
          'coins': (data['coins'] as num?)?.toInt() ?? 0,
          'paypalEmail': data['paypalEmail'] as String?,
          'bankAccountDetails': data['bankAccountDetails'] as Map<String, dynamic>?,
        };
      }
      return null;
    } catch (e) {
      throw Exception('Failed to get user data: $e');
    }
  }

  // Handle Firebase Auth exceptions
  String _handleAuthException(FirebaseAuthException e) {
    switch (e.code) {
      case 'weak-password':
        return 'The password provided is too weak.';
      case 'email-already-in-use':
        return 'An account already exists for that email.';
      case 'invalid-email':
        return 'The email address is not valid.';
      case 'user-disabled':
        return 'This user account has been disabled.';
      case 'user-not-found':
        return 'No user found for that email.';
      case 'wrong-password':
        return 'Wrong password provided.';
      case 'too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'operation-not-allowed':
        return 'This sign-in method is not enabled.';
      case 'requires-recent-login':
        return 'Please sign in again to complete this action.';
      default:
        return 'Authentication error: ${e.message}';
    }
  }

  Future<Map<String, dynamic>?> getGiftData(String giftName) async {
    try {
      final giftDoc = await _firestore.collection("gifts").doc(giftName).get();
      return giftDoc.data();
    } catch (e) {
      print("Error getting gift data: $e");
      return null;
    }
  }



  // Send a friend request
  Future<void> sendFriendRequest(String receiverId) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception("User not logged in.");
    }
    try {
      final HttpsCallable callable = FirebaseFunctions.instance.httpsCallable("sendFriendRequest");
      await callable.call({"receiverId": receiverId});
    } on FirebaseFunctionsException catch (e) {
      throw Exception("Failed to send friend request: ${e.message}");
    } catch (e) {
      throw Exception("An unexpected error occurred: $e");
    }
  }

  // Accept a friend request
  Future<void> acceptFriendRequest(String requestId) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception("User not logged in.");
    }
    try {
      final HttpsCallable callable = FirebaseFunctions.instance.httpsCallable("acceptFriendRequest");
      await callable.call({"requestId": requestId});
    } on FirebaseFunctionsException catch (e) {
      throw Exception("Failed to accept friend request: ${e.message}");
    } catch (e) {
      throw Exception("An unexpected error occurred: $e");
    }
  }

  // Decline a friend request
  Future<void> declineFriendRequest(String requestId) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception("User not logged in.");
    }
    try {
      final HttpsCallable callable = FirebaseFunctions.instance.httpsCallable("declineFriendRequest");
      await callable.call({"requestId": requestId});
    } on FirebaseFunctionsException catch (e) {
      throw Exception("Failed to decline friend request: ${e.message}");
    } catch (e) {
      throw Exception("An unexpected error occurred: $e");
    }
  }

  // Get friend requests (sent and received)
  Stream<QuerySnapshot> getFriendRequests(String userId) {
    return _firestore
        .collection("friendRequests")
        .where("receiverId", isEqualTo: userId)
        .where("status", isEqualTo: "pending")
        .snapshots();
  }

  // Get user's friends list
  Stream<DocumentSnapshot> getUserFriendsStream(String userId) {
    return _firestore.collection("users").doc(userId).snapshots();
  }

  // Get user data by ID
  Future<Map<String, dynamic>?> getUserDataById(String userId) async {
    try {
      DocumentSnapshot doc = await _firestore.collection("users").doc(userId).get();
      final data = doc.data() as Map<String, dynamic>?;
      if (data != null) {
        return {
          ...data,
          'balance': (data['balance'] as num?)?.toDouble() ?? 0.0,
          'coins': (data['coins'] as num?)?.toInt() ?? 0,
          'paypalEmail': data['paypalEmail'] as String?,
          'bankAccountDetails': data['bankAccountDetails'] as Map<String, dynamic>?,
        };
      }
      return null;
    } catch (e) {
      print("Error getting user data by ID: $e");
      return null;
    }
  }
}


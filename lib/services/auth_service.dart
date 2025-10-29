import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/models/user.dart'; // Import the new UserData model

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
      print('Error getting user data: $e');
    }
    return null;
  }

  // --- Other Auth Methods (Login, Signup, Logout, etc.) ---

  Future<UserCredential?> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    // ... existing implementation
    return await _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  Future<void> signOut() async {
    // ... existing implementation
    await _auth.signOut();
  }

   // ... And so on for all other methods from the original AuthService
}

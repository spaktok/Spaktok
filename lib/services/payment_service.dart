import 'package:cloud_functions/cloud_functions.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/wallet.dart';

class PaymentService {
  final FirebaseFunctions _functions = FirebaseFunctions.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Fetch user's wallet data
  Stream<Wallet> getUserWallet(String userId) {
    return _firestore.collection('users').doc(userId).snapshots().map((snapshot) {
      if (snapshot.exists) {
        return Wallet.fromFirestore(snapshot);
      } else {
        // Return a default wallet if user document doesn't exist yet
        return Wallet(userId: userId);
      }
    });
  }

  // Call Cloud Function to purchase coins
  Future<Map<String, dynamic>> purchaseCoins(double amount, String paymentMethodToken) async {
    try {
      final HttpsCallable callable = _functions.httpsCallable('purchaseCoins');
      final result = await callable.call<Map<String, dynamic>>({
        'amount': amount,
        'paymentMethodToken': paymentMethodToken,
      });
      return result.data!;
    } on FirebaseFunctionsException catch (e) {
      print('FirebaseFunctionsException: ${e.code} - ${e.message}');
      throw Exception(e.message);
    } catch (e) {
      print('Error purchasing coins: $e');
      throw Exception('Failed to purchase coins.');
    }
  }

  // Call Cloud Function to request a payout
  Future<Map<String, dynamic>> requestPayout(double amount, String payoutMethod, Map<String, dynamic> payoutDetails) async {
    try {
      final HttpsCallable callable = _functions.httpsCallable('requestPayout');
      final result = await callable.call<Map<String, dynamic>>({
        'amount': amount,
        'payoutMethod': payoutMethod,
        'payoutDetails': payoutDetails,
      });
      return result.data!;
    } on FirebaseFunctionsException catch (e) {
      print('FirebaseFunctionsException: ${e.code} - ${e.message}');
      throw Exception(e.message);
    } catch (e) {
      print('Error requesting payout: $e');
      throw Exception('Failed to request payout.');
    }
  }

  // Call Cloud Function for administrators to process a payout (approve/reject)
  Future<Map<String, dynamic>> processPayout(String requestId, String action) async {
    try {
      final HttpsCallable callable = _functions.httpsCallable('processPayout');
      final result = await callable.call<Map<String, dynamic>>({
        'requestId': requestId,
        'action': action,
      });
      return result.data!;
    } on FirebaseFunctionsException catch (e) {
      print('FirebaseFunctionsException: ${e.code} - ${e.message}');
      throw Exception(e.message);
    } catch (e) {
      print('Error processing payout: $e');
      throw Exception('Failed to process payout.');
    }
  }
}

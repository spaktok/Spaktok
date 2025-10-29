import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:spaktok/models/coin_package.dart';
import 'package:spaktok/config/app_config.dart';

class PaymentService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseFunctions _functions = FirebaseFunctions.instance;

  PaymentService() {
    Stripe.publishableKey = AppConfig.stripePublishableKey;
  }

  /// Get coin packages from Firestore
  Stream<List<CoinPackage>> getCoinPackages() {
    return _firestore
        .collection('coinPackages')
        .orderBy('price', descending: false)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => CoinPackage.fromFirestore(doc))
            .toList());
  }

  /// Get user's coin balance stream
  Stream<int> getCoinBalanceStream(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .snapshots()
        .map((snapshot) {
      if (snapshot.exists) {
        return (snapshot.data() as Map<String, dynamic>)['coins'] ?? 0;
      }
      return 0;
    });
  }

  /// Initiate and process a coin purchase
  Future<void> purchaseCoins(CoinPackage package, String userId) async {
    try {
      // 1. Create a payment intent on the server
      final callable = _functions.httpsCallable('createPaymentIntent');
      final response = await callable.call<Map<String, dynamic>>({
        'amount': (package.price * 100).toInt(), // Stripe expects amount in cents
        'currency': 'usd',
        'userId': userId,
        'packageId': package.id,
      });

      final clientSecret = response.data['clientSecret'];
      if (clientSecret == null) {
        throw Exception('Failed to create payment intent.');
      }

      // 2. Initialize the payment sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'Spaktok',
        ),
      );

      // 3. Present the payment sheet
      await Stripe.instance.presentPaymentSheet();

      // At this point, a webhook on your server should handle the successful 
      // payment and credit the coins to the user's account.

    } on StripeException catch (e) {
      if (e.error.code != FailureCode.Canceled) {
        rethrow;
      }
    } catch (e) {
      rethrow;
    }
  }
}

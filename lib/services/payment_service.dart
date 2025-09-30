import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class PaymentService {
  // هذا هو مفتاح Stripe القابل للنشر. يجب أن يكون هذا من جانب العميل.
  // مفتاحك السري يجب أن يبقى على الخادم.
  final String publishableKey = "YOUR_STRIPE_PUBLISHABLE_KEY"; // استبدل بمفتاحك القابل للنشر

  // نقطة نهاية الخادم لإنشاء Payment Intent. يجب أن تكون هذه نقطة نهاية خلفية.
  final String paymentApiUrl = "YOUR_BACKEND_PAYMENT_API_URL"; // استبدل بعنوان URL الخاص بواجهة برمجة تطبيقات الدفع الخلفية

  Future<void> initStripe() async {
    Stripe.publishableKey = publishableKey;
    await Stripe.instance.applySettings();
  }

  Future<Map<String, dynamic>> _createPaymentIntent(String amount, String currency) async {
    try {
      final response = await http.post(
        Uri.parse(paymentApiUrl),
        headers: {
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'amount': amount,
          'currency': currency,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to create payment intent: ${response.body}');
      }
    } catch (e) {
      print('Error creating payment intent: $e');
      rethrow;
    }
  }

  Future<void> makePayment({required String amount, required String currency}) async {
    try {
      // 1. إنشاء Payment Intent على الخادم الخاص بك
      final paymentIntentData = await _createPaymentIntent(amount, currency);

      // 2. تهيئة Payment Sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: paymentIntentData['clientSecret'],
          merchantDisplayName: 'Spaktok',
          customerId: paymentIntentData['customerId'],
          customerEphemeralKeySecret: paymentIntentData['ephemeralKey'],
          currencyCode: currency,
          style: ThemeMode.dark,
        ),
      );

      // 3. عرض Payment Sheet
      await Stripe.instance.presentPaymentSheet();

      // 4. تأكيد الدفع (يتم التعامل مع هذا تلقائيًا بواسطة presentPaymentSheet)
      print('Payment successful!');
    } on StripeException catch (e) {
      print('Error during payment: ${e.error.code} - ${e.error.message}');
      if (e.error.code == PaymentSheetErrorCode.Canceled) {
        print('Payment canceled by user.');
      } else {
        print('An unexpected error occurred during payment.');
      }
      rethrow;
    } catch (e) {
      print('An unexpected error occurred: $e');
      rethrow;
    }
  }
}


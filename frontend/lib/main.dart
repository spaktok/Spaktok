import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:spaktok_frontend/firebase_options.dart';
import 'package:spaktok_frontend/services/agora_service.dart';
import 'package:spaktok_frontend/services/fcm_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  await FCMService().initialize();
  await AgoraService().initialize();

  // Initialize Stripe
  Stripe.publishableKey = 'pk_test_51SDYFHRumpu3fxskMA2RQiFqKVw37jhHAWVZ2vTfNKnVkGXgZzJjHyiMZEHyTPqLgyOkx3a54zFTpNjcu2UZ9TFM00tiZjHL8v'; // Replace with your key
  await Stripe.instance.applySettings();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Spaktok',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const Text('Spaktok App'), // Placeholder for now
    );
  }
}


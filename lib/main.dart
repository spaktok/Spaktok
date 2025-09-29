import 'package:flutter/material.dart';
import 'package:spaktok/screens/live_stream_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Spaktok',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const LiveStreamScreen(),
    );
  }
}


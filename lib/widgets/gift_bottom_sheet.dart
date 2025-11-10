import 'package:flutter/material.dart';
import 'dart:developer' as developer;
import 'package:provider/provider.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/services/stream_service.dart';

class GiftBottomSheet extends StatefulWidget {
  final String receiverId;

  const GiftBottomSheet({super.key, required this.receiverId});

  @override
  State<GiftBottomSheet> createState() => _GiftBottomSheetState();
}

class _GiftBottomSheetState extends State<GiftBottomSheet> {
  final StreamService _streamService = StreamService();
  List<Map<String, dynamic>> _gifts = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchGifts();
  }

  Future<void> _fetchGifts() async {
    try {
      final giftsSnapshot =
          await FirebaseFirestore.instance.collection('gifts').get();
      setState(() {
        _gifts = giftsSnapshot.docs.map((doc) => doc.data()).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load gifts: $e';
        _isLoading = false;
      });
      developer.log('Error fetching gifts: $e', name: 'gift_bottom_sheet');
    }
  }

  Future<void> _sendGift(String giftName, int giftCost) async {
    final authService = Provider.of<AuthService>(context, listen: false);
    final currentUser = authService.currentUser;

    if (currentUser == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to send gifts.')),
      );
      return;
    }

    try {
      // Deduct coins (placeholder) then send gift message to stream
      await _streamService.sendStreamMessage(
        streamId: widget.receiverId,
        message: '', // empty for gift
        giftName: giftName,
        giftImageUrl:
            _gifts.firstWhere((g) => g['name'] == giftName)['imageUrl'],
        giftCost: giftCost,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sent $giftName to ${widget.receiverId}!')),
      );
      Navigator.pop(context); // Close the bottom sheet
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to send gift: $e')),
      );
      developer.log('Error sending gift: $e', name: 'gift_bottom_sheet');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(child: Text(_errorMessage!));
    }

    return Container(
      height: MediaQuery.of(context).size.height * 0.5,
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          Text(
            'Send a Gift to ${widget.receiverId}',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 4,
                crossAxisSpacing: 8.0,
                mainAxisSpacing: 8.0,
                childAspectRatio: 0.8,
              ),
              itemCount: _gifts.length,
              itemBuilder: (context, index) {
                final gift = _gifts[index];
                return GestureDetector(
                  onTap: () => _sendGift(gift['name'], gift['cost']),
                  child: Card(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.network(
                          gift['imageUrl'],
                          height: 40,
                          width: 40,
                          errorBuilder: (context, error, stackTrace) =>
                              const Icon(Icons.broken_image),
                        ),
                        const SizedBox(height: 8),
                        Text(gift['name']),
                        Text('${gift['cost']} coins'),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

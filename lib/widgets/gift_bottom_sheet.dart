import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class GiftBottomSheet extends StatefulWidget {
  final String receiverId;

  const GiftBottomSheet({Key? key, required this.receiverId}) : super(key: key);

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
      final giftsSnapshot = await FirebaseFirestore.instance.collection('gifts').get();
      setState(() {
        _gifts = giftsSnapshot.docs.map((doc) => doc.data()).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load gifts: $e';
        _isLoading = false;
      });
      print('Error fetching gifts: $e');
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
      // Deduct coins from sender (implement this logic in AuthService or a separate service)
      // For now, we'll assume the user has enough balance and directly send the gift.
      // In a real app, you'd call a Cloud Function to handle the transaction s      await _streamService.sendStreamMessage(
        streamId: widget.receiverId,
        message: '', // Message is empty for gifts
        giftName: giftName,
        giftImageUrl: _gifts.firstWhere((g) => g['name'] == giftName)['imageUrl'],
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
      print('Error sending gift: $e');
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
                          errorBuilder: (context, error, stackTrace) => const Icon(Icons.broken_image),
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


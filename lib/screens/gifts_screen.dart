import 'package:flutter/material.dart';
import 'package:spaktok/models/gift.dart';
import 'package:spaktok/models/gift_category.dart';
import 'package:spaktok/services/gift_service.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/services/payment_service.dart';
import 'package:spaktok/screens/buy_coins_screen.dart';
import 'package:cached_network_image/cached_network_image.dart';

class GiftsScreen extends StatefulWidget {
  final String receiverId;
  final String contextType; // e.g., 'live_stream'
  final String? contextId; // e.g., streamId

  const GiftsScreen({
    super.key,
    required this.receiverId,
    required this.contextType,
    this.contextId,
  });

  @override
  State<GiftsScreen> createState() => _GiftsScreenState();
}

class _GiftsScreenState extends State<GiftsScreen> {
  final GiftService _giftService = GiftService();
  final PaymentService _paymentService = PaymentService();
  final AuthService _authService = AuthService();

  Gift? _selectedGift;

  void _navigateToBuyCoins() {
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => const BuyCoinsScreen()));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          _buildHeader(),
          _buildGiftTabs(),
          _buildFooter(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text('Send a Gift', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
          GestureDetector(
            onTap: _navigateToBuyCoins,
            child: StreamBuilder<int>(
              stream: _paymentService.getCoinBalanceStream(_authService.currentUser!.uid),
              builder: (context, snapshot) {
                final balance = snapshot.data ?? 0;
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.monetization_on, color: Theme.of(context).primaryColor, size: 16),
                      const SizedBox(width: 4),
                      Text(balance.toString(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward_ios, size: 12, color: Colors.white),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGiftTabs() {
    return StreamBuilder<List<GiftCategory>>(
      stream: _giftService.getGiftCategories(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const Expanded(child: Center(child: CircularProgressIndicator()));
        }
        final categories = snapshot.data!;
        if (categories.isEmpty) {
          return const Expanded(child: Center(child: Text('No gift categories available.', style: TextStyle(color: Colors.white))));
        }
        return DefaultTabController(
          length: categories.length,
          child: Expanded(
            child: Column(
              children: [
                TabBar(
                  isScrollable: true,
                  tabs: categories.map((c) => Tab(text: c.name)).toList(),
                ),
                Expanded(
                  child: TabBarView(
                    children: categories.map((c) => _buildGiftsGrid(c.id)).toList(),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildGiftsGrid(String categoryId) {
    return StreamBuilder<List<Gift>>(
      stream: _giftService.getGiftsByCategory(categoryId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(child: Text('No gifts in this category.', style: TextStyle(color: Colors.white)));
        }
        final gifts = snapshot.data!;
        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
          ),
          itemCount: gifts.length,
          itemBuilder: (context, index) {
            final gift = gifts[index];
            bool isSelected = _selectedGift?.id == gift.id;
            return GestureDetector(
              onTap: () => setState(() => _selectedGift = gift),
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected ? Theme.of(context).primaryColor.withOpacity(0.3) : Colors.black.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? Theme.of(context).primaryColor : Colors.transparent,
                    width: 2,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    gift.animationUrl != null && gift.animationUrl!.isNotEmpty
                      ? CachedNetworkImage(imageUrl: gift.animationUrl!, height: 40) // Placeholder for Lottie
                      : Text(gift.name.substring(0, 2), style: const TextStyle(fontSize: 24)),
                    const SizedBox(height: 8),
                    Text(gift.coinCost.toString(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildFooter() {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.5),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          ElevatedButton(
            onPressed: _selectedGift == null ? null : _handleSendGift,
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).primaryColor,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 12),
            ),
            child: const Text('Send', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _handleSendGift() async {
    if (_selectedGift == null) return;

    try {
      final success = await _giftService.sendGift(
        receiverId: widget.receiverId,
        gift: _selectedGift!,
        contextType: widget.contextType,
        contextId: widget.contextId,
      );

      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sent ${_selectedGift!.name} successfully!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context); // Close the gift screen
      } else {
        throw Exception('Failed to send gift. Your coins may not have been deducted.');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    }
  }
}

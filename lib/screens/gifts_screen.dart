import 'package:flutter/material.dart';
import 'package:spaktok/services/enhanced_payment_service.dart';
import 'package:spaktok/services/gift_service.dart';


class GiftsScreen extends StatefulWidget {
  final String? receiverId;

  const GiftsScreen({Key? key, this.receiverId}) : super(key: key);

  @override
  State<GiftsScreen> createState() => _GiftsScreenState();
}

class _GiftsScreenState extends State<GiftsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final EnhancedPaymentService _paymentService = EnhancedPaymentService.instance;
  final GiftService _giftService = GiftService();
  int _coinBalance = 0;
  bool _isLoading = true;

  final List<Map<String, dynamic>> _giftCategories = [
    {'name': 'Popular', 'icon': Icons.star},
    {'name': 'Love', 'icon': Icons.favorite},
    {'name': 'Party', 'icon': Icons.celebration},
    {'name': 'Animals', 'icon': Icons.pets},
    {'name': 'Food', 'icon': Icons.fastfood},
    {'name': 'Luxury', 'icon': Icons.diamond},
  ];

  final Map<String, List<Map<String, dynamic>>> _gifts = {
    'Popular': [
      {'name': 'Rose', 'icon': '🌹', 'coins': 10, 'color': Colors.red},
      {'name': 'Diamond', 'icon': '💎', 'coins': 100, 'color': Colors.blue},
      {'name': 'Crown', 'icon': '👑', 'coins': 500, 'color': Colors.yellow},
      {'name': 'Rocket', 'icon': '🚀', 'coins': 1000, 'color': Colors.orange},
    ],
    'Love': [
      {'name': 'Heart', 'icon': '❤️', 'coins': 5, 'color': Colors.red},
      {'name': 'Kiss', 'icon': '💋', 'coins': 15, 'color': Colors.pink},
      {'name': 'Cupid', 'icon': '💘', 'coins': 50, 'color': Colors.red[300]},
      {'name': 'Wedding', 'icon': '💒', 'coins': 200, 'color': Colors.pink[200]},
    ],
    'Party': [
      {'name': 'Balloon', 'icon': '🎈', 'coins': 8, 'color': Colors.purple},
      {'name': 'Cake', 'icon': '🎂', 'coins': 20, 'color': Colors.orange[200]},
      {'name': 'Fireworks', 'icon': '🎆', 'coins': 80, 'color': Colors.purple[300]},
      {'name': 'Trophy', 'icon': '🏆', 'coins': 150, 'color': Colors.yellow[700]},
    ],
    'Animals': [
      {'name': 'Cat', 'icon': '🐱', 'coins': 12, 'color': Colors.orange[300]},
      {'name': 'Dog', 'icon': '🐶', 'coins': 12, 'color': Colors.brown[300]},
      {'name': 'Panda', 'icon': '🐼', 'coins': 30, 'color': Colors.grey[400]},
      {'name': 'Unicorn', 'icon': '🦄', 'coins': 100, 'color': Colors.pink[300]},
    ],
    'Food': [
      {'name': 'Pizza', 'icon': '🍕', 'coins': 15, 'color': Colors.orange[400]},
      {'name': 'Ice Cream', 'icon': '🍦', 'coins': 10, 'color': Colors.blue[200]},
      {'name': 'Sushi', 'icon': '🍣', 'coins': 25, 'color': Colors.red[300]},
      {'name': 'Champagne', 'icon': '🍾', 'coins': 60, 'color': Colors.yellow[700]},
    ],
    'Luxury': [
      {'name': 'Sports Car', 'icon': '🏎️', 'coins': 500, 'color': Colors.red[700]},
      {'name': 'Yacht', 'icon': '🛥️', 'coins': 1000, 'color': Colors.blue[700]},
      {'name': 'Mansion', 'icon': '🏰', 'coins': 2000, 'color': Colors.purple[700]},
      {'name': 'Private Jet', 'icon': '✈️', 'coins': 5000, 'color': Colors.grey[700]},
    ],
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _giftCategories.length, vsync: this);
    _loadCoinBalance();
  }

  Future<void> _loadCoinBalance() async {
    try {
      final balance = await _paymentService.getCoinBalance();
      setState(() {
        _coinBalance = balance;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Send Gift'),
        actions: [
          _buildCoinBalance(context),
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            onPressed: () {
              _showBuyCoinsDialog(context);
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                _buildTabBar(context),
                Expanded(
                  child: _buildGiftsGrid(context),
                ),
                _buildSendButton(context),
              ],
            ),
    );
  }

  Widget _buildCoinBalance(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).primaryColor,
            Theme.of(context).primaryColor.withOpacity(0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.monetization_on, size: 18, color: Colors.white),
          const SizedBox(width: 5),
          Text(
            _coinBalance.toString(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar(BuildContext context) {
    return Container(
      height: 60,
      color: Colors.grey[900],
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        indicatorColor: Theme.of(context).primaryColor,
        labelColor: Theme.of(context).primaryColor,
        unselectedLabelColor: Colors.grey,
        tabs: _giftCategories.map((category) {
          return Tab(
            child: Row(
              children: [
                Icon(category['icon'], size: 20),
                const SizedBox(width: 5),
                Text(category['name']),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildGiftsGrid(BuildContext context) {
    return TabBarView(
      controller: _tabController,
      children: _giftCategories.map((category) {
        final gifts = _gifts[category['name']] ?? [];
        return GridView.builder(
          padding: const EdgeInsets.all(15),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 15,
            mainAxisSpacing: 15,
            childAspectRatio: 0.8,
          ),
          itemCount: gifts.length,
          itemBuilder: (context, index) {
            return _buildGiftCard(context, gifts[index]);
          },
        );
      }).toList(),
    );
  }

  Widget _buildGiftCard(BuildContext context, Map<String, dynamic> gift) {
    final canAfford = _coinBalance >= gift['coins'];
    
    return GestureDetector(
      onTap: () {
        if (canAfford) {
          _selectGift(gift);
        } else {
          _showInsufficientCoinsDialog(context);
        }
      },
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              gift['color'].withOpacity(0.3),
              Colors.grey[900]!,
            ],
          ),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(
            color: canAfford ? gift['color'].withOpacity(0.5) : Colors.grey[800]!,
            width: 2,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              gift['icon'],
              style: TextStyle(
                fontSize: 40,
                color: canAfford ? Colors.white : Colors.grey[700],
              ),
            ),
            const SizedBox(height: 8),
            Text(
              gift['name'],
              style: TextStyle(
                color: canAfford ? Colors.white : Colors.grey[600],
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 5),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: canAfford ? Theme.of(context).primaryColor : Colors.grey[800],
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.monetization_on, size: 12, color: Colors.white),
                  const SizedBox(width: 3),
                  Text(
                    gift['coins'].toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSendButton(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.transparent,
            Colors.black.withOpacity(0.9),
          ],
        ),
      ),
      child: SafeArea(
        child: ElevatedButton(
          onPressed: () {
            // Send selected gift
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Theme.of(context).primaryColor,
            padding: const EdgeInsets.symmetric(vertical: 15),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(30),
            ),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.card_giftcard, size: 24),
              SizedBox(width: 10),
              Text(
                'Send Gift',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _selectGift(Map<String, dynamic> gift) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.grey[900],
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Column(
            children: [
              Text(
                gift['icon'],
                style: const TextStyle(fontSize: 60),
              ),
              const SizedBox(height: 10),
              Text(
                gift['name'],
                style: const TextStyle(color: Colors.white),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Send this gift for ${gift['coins']} coins?',
                style: const TextStyle(color: Colors.white70),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 10),
              Text(
                'Your balance: $_coinBalance coins',
                style: TextStyle(
                  color: Theme.of(context).primaryColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                final success = await _paymentService.deductCoins(
                  gift['coins'],
                  reason: 'Sent ${gift['name']} gift',
                );
                if (success) {
                  await _loadCoinBalance();
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Gift sent successfully! ${gift['icon']}'),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
              ),
              child: const Text('Send'),
            ),
          ],
        );
      },
    );
  }

  void _showBuyCoinsDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: const BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: Colors.grey[700],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      'Buy Coins',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(20),
                  itemCount: _paymentService.getCoinPackages().length,
                  itemBuilder: (context, index) {
                    final package = _paymentService.getCoinPackages()[index];
                    return _buildCoinPackage(context, package);
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildCoinPackage(BuildContext context, CoinPackage package) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: package.isPopular
              ? [Theme.of(context).primaryColor.withOpacity(0.3), Colors.grey[900]!]
              : [Colors.grey[900]!, Colors.grey[900]!],
        ),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(
          color: package.isPopular ? Theme.of(context).primaryColor : Colors.grey[800]!,
          width: 2,
        ),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(15),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Theme.of(context).primaryColor.withOpacity(0.2),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.monetization_on,
            color: Theme.of(context).primaryColor,
            size: 30,
          ),
        ),
        title: Row(
          children: [
            Text(
              package.name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (package.isPopular) ...[
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'POPULAR',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        subtitle: package.bonus != null
            ? Text(
                package.bonus!,
                style: TextStyle(
                  color: Theme.of(context).primaryColor,
                  fontSize: 14,
                ),
              )
            : null,
        trailing: ElevatedButton(
          onPressed: () async {
            Navigator.pop(context);
            final success = await _paymentService.purchaseCoins(package);
            if (success) {
              await _loadCoinBalance();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Coins purchased successfully!'),
                    backgroundColor: Colors.green,
                  ),
                );
              }
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Theme.of(context).primaryColor,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          ),
          child: Text(
            '\$${package.price.toStringAsFixed(2)}',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ),
      ),
    );
  }

  void _showInsufficientCoinsDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.grey[900],
          title: const Text(
            'Insufficient Coins',
            style: TextStyle(color: Colors.white),
          ),
          content: const Text(
            'You don\'t have enough coins to send this gift. Would you like to buy more coins?',
            style: TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _showBuyCoinsDialog(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
              ),
              child: const Text('Buy Coins'),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}

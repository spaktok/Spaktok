import 'package:flutter/material.dart';
import 'package:spaktok/models/coin_package.dart';
import 'package:spaktok/services/payment_service.dart';
import 'package:spaktok/services/auth_service.dart';

class BuyCoinsScreen extends StatefulWidget {
  const BuyCoinsScreen({super.key});

  @override
  State<BuyCoinsScreen> createState() => _BuyCoinsScreenState();
}

class _BuyCoinsScreenState extends State<BuyCoinsScreen> {
  final PaymentService _paymentService = PaymentService();
  final AuthService _authService = AuthService();
  bool _isLoading = false;

  void _handlePurchase(CoinPackage package) async {
    final userId = _authService.currentUser?.uid;
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('You must be logged in to make a purchase.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await _paymentService.purchaseCoins(package, userId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Purchase successful! Coins will be added shortly.'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Purchase failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Buy Coins'),
      ),
      body: Stack(
        children: [
          StreamBuilder<List<CoinPackage>>(
            stream: _paymentService.getCoinPackages(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) {
                return const Center(child: CircularProgressIndicator());
              }
              final packages = snapshot.data!;
              return ListView.builder(
                padding: const EdgeInsets.all(16.0),
                itemCount: packages.length,
                itemBuilder: (context, index) {
                  final package = packages[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: ListTile(
                      leading: const Icon(Icons.monetization_on),
                      title: Text('${package.coins} Coins'),
                      subtitle: package.bonus != null ? Text(package.bonus!) : null,
                      trailing: ElevatedButton(
                        onPressed: () => _handlePurchase(package),
                        child: Text('\$${package.price.toStringAsFixed(2)}'),
                      ),
                    ),
                  );
                },
              );
            },
          ),
          if (_isLoading)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}

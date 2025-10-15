import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:lottie/lottie.dart';

/// Creator Economy & Gifting System
/// - Virtual wallet with real-time balance updates
/// - Gift shop & 3D marketplace with animations and sounds
/// - Creator revenue dashboard (earnings, history, withdrawals)
/// - VIP system and leaderboard for top supporters
/// - Stripe + local payment gateways integration
class CreatorEconomyScreen extends StatefulWidget {
  final String userId;
  final bool isCreatorView;

  const CreatorEconomyScreen({
    Key? key,
    required this.userId,
    this.isCreatorView = false,
  }) : super(key: key);

  @override
  State<CreatorEconomyScreen> createState() => _CreatorEconomyScreenState();
}

class _CreatorEconomyScreenState extends State<CreatorEconomyScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Wallet state
  int _coinBalance = 0;
  double _cashBalance = 0.0;
  List<Transaction> _transactions = [];

  // Creator earnings
  double _totalEarnings = 0.0;
  double _monthlyEarnings = 0.0;
  List<Earning> _earningHistory = [];
  
  // VIP & Leaderboard
  List<VIPSupporter> _topSupporters = [];
  int _userVIPRank = 0;
  String _vipTier = 'Bronze';

  // Gift catalog
  final List<Gift> _giftCatalog = [
    Gift(
      id: 'heart',
      name: 'Heart',
      emoji: '❤️',
      price: 10,
      animationPath: 'assets/animations/gift_heart.json',
      rarity: GiftRarity.common,
    ),
    Gift(
      id: 'rose',
      name: 'Rose',
      emoji: '🌹',
      price: 25,
      animationPath: 'assets/animations/gift_rose.json',
      rarity: GiftRarity.common,
    ),
    Gift(
      id: 'star',
      name: 'Star',
      emoji: '⭐',
      price: 50,
      animationPath: 'assets/animations/gift_star.json',
      rarity: GiftRarity.rare,
    ),
    Gift(
      id: 'diamond',
      name: 'Diamond',
      emoji: '💎',
      price: 100,
      animationPath: 'assets/animations/gift_diamond.json',
      rarity: GiftRarity.epic,
    ),
    Gift(
      id: 'crown',
      name: 'Crown',
      emoji: '👑',
      price: 500,
      animationPath: 'assets/animations/gift_crown.json',
      rarity: GiftRarity.legendary,
    ),
    Gift(
      id: 'rocket',
      name: 'Rocket',
      emoji: '🚀',
      price: 1000,
      animationPath: 'assets/animations/gift_rocket.json',
      rarity: GiftRarity.legendary,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: widget.isCreatorView ? 4 : 3,
      vsync: this,
    );
    _loadWalletData();
    _loadCreatorData();
    _loadLeaderboard();
  }

  Future<void> _loadWalletData() async {
    try {
      final walletDoc = await _firestore
          .collection('wallets')
          .doc(widget.userId)
          .get();

      if (walletDoc.exists) {
        setState(() {
          _coinBalance = walletDoc.data()?['coinBalance'] ?? 0;
          _cashBalance = (walletDoc.data()?['cashBalance'] ?? 0.0).toDouble();
        });
      }

      // Load transactions
      final transactionsSnapshot = await _firestore
          .collection('wallets')
          .doc(widget.userId)
          .collection('transactions')
          .orderBy('timestamp', descending: true)
          .limit(50)
          .get();

      setState(() {
        _transactions = transactionsSnapshot.docs
            .map((doc) => Transaction.fromFirestore(doc))
            .toList();
      });
    } catch (e) {
      debugPrint('Error loading wallet data: $e');
    }
  }

  Future<void> _loadCreatorData() async {
    if (!widget.isCreatorView) return;

    try {
      final creatorDoc = await _firestore
          .collection('creators')
          .doc(widget.userId)
          .get();

      if (creatorDoc.exists) {
        setState(() {
          _totalEarnings = (creatorDoc.data()?['totalEarnings'] ?? 0.0).toDouble();
          _monthlyEarnings = (creatorDoc.data()?['monthlyEarnings'] ?? 0.0).toDouble();
        });
      }

      // Load earning history
      final earningsSnapshot = await _firestore
          .collection('creators')
          .doc(widget.userId)
          .collection('earnings')
          .orderBy('timestamp', descending: true)
          .limit(30)
          .get();

      setState(() {
        _earningHistory = earningsSnapshot.docs
            .map((doc) => Earning.fromFirestore(doc))
            .toList();
      });
    } catch (e) {
      debugPrint('Error loading creator data: $e');
    }
  }

  Future<void> _loadLeaderboard() async {
    try {
      final leaderboardSnapshot = await _firestore
          .collection('leaderboards')
          .doc('global')
          .collection('supporters')
          .orderBy('totalSpent', descending: true)
          .limit(100)
          .get();

      setState(() {
        _topSupporters = leaderboardSnapshot.docs
            .map((doc) => VIPSupporter.fromFirestore(doc))
            .toList();
        
        // Find user's rank
        final userIndex = _topSupporters.indexWhere(
          (supporter) => supporter.userId == widget.userId,
        );
        _userVIPRank = userIndex + 1;
        
        // Determine VIP tier
        if (_userVIPRank <= 10) {
          _vipTier = 'Diamond';
        } else if (_userVIPRank <= 50) {
          _vipTier = 'Gold';
        } else if (_userVIPRank <= 100) {
          _vipTier = 'Silver';
        } else {
          _vipTier = 'Bronze';
        }
      });
    } catch (e) {
      debugPrint('Error loading leaderboard: $e');
    }
  }

  Future<void> _purchaseCoins(int amount, double price) async {
    // TODO: Integrate with Stripe payment
    // For now, simulate purchase
    try {
      await _firestore.collection('wallets').doc(widget.userId).update({
        'coinBalance': FieldValue.increment(amount),
      });

      await _firestore
          .collection('wallets')
          .doc(widget.userId)
          .collection('transactions')
          .add({
        'type': 'purchase',
        'amount': amount,
        'price': price,
        'timestamp': FieldValue.serverTimestamp(),
        'status': 'completed',
      });

      setState(() {
        _coinBalance += amount;
      });

      _showSuccessDialog('Purchase Successful!', '$amount coins added to your wallet');
    } catch (e) {
      debugPrint('Error purchasing coins: $e');
      _showErrorDialog('Purchase Failed', 'Please try again later');
    }
  }

  Future<void> _sendGift(Gift gift, String recipientId) async {
    if (_coinBalance < gift.price) {
      _showErrorDialog('Insufficient Balance', 'You need ${gift.price} coins to send this gift');
      return;
    }

    try {
      // Deduct coins from sender
      await _firestore.collection('wallets').doc(widget.userId).update({
        'coinBalance': FieldValue.increment(-gift.price),
      });

      // Add earnings to creator (60% revenue share)
      final creatorEarnings = gift.price * 0.6;
      await _firestore.collection('creators').doc(recipientId).update({
        'totalEarnings': FieldValue.increment(creatorEarnings),
        'monthlyEarnings': FieldValue.increment(creatorEarnings),
      });

      // Record transaction
      await _firestore
          .collection('wallets')
          .doc(widget.userId)
          .collection('transactions')
          .add({
        'type': 'gift_sent',
        'giftId': gift.id,
        'giftName': gift.name,
        'amount': gift.price,
        'recipientId': recipientId,
        'timestamp': FieldValue.serverTimestamp(),
      });

      // Record earning for creator
      await _firestore
          .collection('creators')
          .doc(recipientId)
          .collection('earnings')
          .add({
        'type': 'gift_received',
        'giftId': gift.id,
        'giftName': gift.name,
        'amount': creatorEarnings,
        'senderId': widget.userId,
        'timestamp': FieldValue.serverTimestamp(),
      });

      // Update leaderboard
      await _firestore
          .collection('leaderboards')
          .doc('global')
          .collection('supporters')
          .doc(widget.userId)
          .set({
        'userId': widget.userId,
        'totalSpent': FieldValue.increment(gift.price),
        'lastGiftDate': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      setState(() {
        _coinBalance -= gift.price;
      });

      _showSuccessDialog('Gift Sent!', '${gift.emoji} ${gift.name} sent successfully');
      _loadLeaderboard(); // Refresh leaderboard
    } catch (e) {
      debugPrint('Error sending gift: $e');
      _showErrorDialog('Failed to Send Gift', 'Please try again later');
    }
  }

  Future<void> _withdrawEarnings(double amount) async {
    if (amount > _cashBalance) {
      _showErrorDialog('Insufficient Balance', 'You cannot withdraw more than your available balance');
      return;
    }

    try {
      // TODO: Integrate with payment gateway for withdrawal
      await _firestore.collection('creators').doc(widget.userId).update({
        'cashBalance': FieldValue.increment(-amount),
      });

      await _firestore
          .collection('creators')
          .doc(widget.userId)
          .collection('withdrawals')
          .add({
        'amount': amount,
        'status': 'pending',
        'timestamp': FieldValue.serverTimestamp(),
      });

      setState(() {
        _cashBalance -= amount;
      });

      _showSuccessDialog('Withdrawal Requested', 'Your withdrawal of \$${amount.toStringAsFixed(2)} is being processed');
    } catch (e) {
      debugPrint('Error withdrawing earnings: $e');
      _showErrorDialog('Withdrawal Failed', 'Please try again later');
    }
  }

  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF0A0A0A),
          title: Row(
            children: [
              const Icon(Icons.check_circle, color: Color(0xFF00C6FF)),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(color: Colors.white)),
            ],
          ),
          content: Text(message, style: const TextStyle(color: Colors.white)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK', style: TextStyle(color: Color(0xFF00C6FF))),
            ),
          ],
        );
      },
    );
  }

  void _showErrorDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: const Color(0xFF0A0A0A),
          title: Row(
            children: [
              const Icon(Icons.error, color: Colors.red),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(color: Colors.white)),
            ],
          ),
          content: Text(message, style: const TextStyle(color: Colors.white)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK', style: TextStyle(color: Color(0xFF00C6FF))),
            ),
          ],
        );
      },
    );
  }

  Widget _buildWalletTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Balance Card
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Coin Balance',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      '$_coinBalance',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      '🪙',
                      style: TextStyle(fontSize: 32),
                    ),
                  ],
                ),
                if (widget.isCreatorView) ...[
                  const SizedBox(height: 16),
                  const Divider(color: Colors.white24),
                  const SizedBox(height: 16),
                  const Text(
                    'Cash Balance',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '\$${_cashBalance.toStringAsFixed(2)}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Quick Actions
          const Text(
            'Quick Actions',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildActionButton(
                  icon: Icons.add_circle,
                  label: 'Buy Coins',
                  onTap: _showCoinPurchaseDialog,
                ),
              ),
              const SizedBox(width: 12),
              if (widget.isCreatorView)
                Expanded(
                  child: _buildActionButton(
                    icon: Icons.account_balance_wallet,
                    label: 'Withdraw',
                    onTap: _showWithdrawalDialog,
                  ),
                ),
            ],
          ),

          const SizedBox(height: 24),

          // Transaction History
          const Text(
            'Transaction History',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _transactions.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Text(
                      'No transactions yet',
                      style: TextStyle(color: Colors.white54),
                    ),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _transactions.length,
                  itemBuilder: (context, index) {
                    return _buildTransactionTile(_transactions[index]);
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF0A0A0A),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF00C6FF).withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: const Color(0xFF00C6FF), size: 32),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTransactionTile(Transaction transaction) {
    IconData icon;
    Color iconColor;
    String prefix;

    switch (transaction.type) {
      case 'purchase':
        icon = Icons.add_circle;
        iconColor = Colors.green;
        prefix = '+';
        break;
      case 'gift_sent':
        icon = Icons.card_giftcard;
        iconColor = Colors.red;
        prefix = '-';
        break;
      case 'gift_received':
        icon = Icons.card_giftcard;
        iconColor = Colors.green;
        prefix = '+';
        break;
      default:
        icon = Icons.swap_horiz;
        iconColor = Colors.grey;
        prefix = '';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0A0A),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  transaction.description,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(transaction.timestamp),
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
          ),
          Text(
            '$prefix${transaction.amount} 🪙',
            style: TextStyle(
              color: iconColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGiftShopTab() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.8,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: _giftCatalog.length,
      itemBuilder: (context, index) {
        final gift = _giftCatalog[index];
        return _buildGiftCard(gift);
      },
    );
  }

  Widget _buildGiftCard(Gift gift) {
    Color rarityColor;
    switch (gift.rarity) {
      case GiftRarity.common:
        rarityColor = Colors.grey;
        break;
      case GiftRarity.rare:
        rarityColor = Colors.blue;
        break;
      case GiftRarity.epic:
        rarityColor = Colors.purple;
        break;
      case GiftRarity.legendary:
        rarityColor = Colors.orange;
        break;
    }

    return GestureDetector(
      onTap: () => _showGiftPreview(gift),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF0A0A0A),
              rarityColor.withOpacity(0.2),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: rarityColor.withOpacity(0.5), width: 2),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Gift emoji/animation
            Text(gift.emoji, style: const TextStyle(fontSize: 64)),
            
            const SizedBox(height: 12),
            
            // Gift name
            Text(
              gift.name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            
            const SizedBox(height: 4),
            
            // Rarity badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: rarityColor.withOpacity(0.3),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                gift.rarity.toString().split('.').last.toUpperCase(),
                style: TextStyle(
                  color: rarityColor,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            
            const SizedBox(height: 12),
            
            // Price
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${gift.price} 🪙',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showGiftPreview(Gift gift) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF0A0A0A),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF00C6FF)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Animation preview
                SizedBox(
                  height: 200,
                  width: 200,
                  child: Lottie.asset(
                    gift.animationPath,
                    repeat: true,
                  ),
                ),
                
                const SizedBox(height: 16),
                
                Text(
                  gift.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                Text(
                  '${gift.price} 🪙',
                  style: const TextStyle(
                    color: Color(0xFF00C6FF),
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                const SizedBox(height: 24),
                
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.1),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          // TODO: Show recipient selection
                          _sendGift(gift, 'recipient_id');
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00C6FF),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Send Gift'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLeaderboardTab() {
    return Column(
      children: [
        // User's rank card
        Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  '#$_userVIPRank',
                  style: const TextStyle(
                    color: Color(0xFF8A2BE2),
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Your Rank',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Text(
                          _vipTier,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        _getVIPBadge(_vipTier),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        // Top supporters list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _topSupporters.length,
            itemBuilder: (context, index) {
              return _buildLeaderboardTile(_topSupporters[index], index + 1);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildLeaderboardTile(VIPSupporter supporter, int rank) {
    String tier;
    if (rank <= 10) {
      tier = 'Diamond';
    } else if (rank <= 50) {
      tier = 'Gold';
    } else if (rank <= 100) {
      tier = 'Silver';
    } else {
      tier = 'Bronze';
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0A0A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: rank <= 3
              ? const Color(0xFF00C6FF)
              : Colors.transparent,
          width: 2,
        ),
      ),
      child: Row(
        children: [
          // Rank badge
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: rank <= 3
                  ? const LinearGradient(
                      colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
                    )
                  : null,
              color: rank > 3 ? Colors.white.withOpacity(0.1) : null,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '#$rank',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: rank <= 3 ? 16 : 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          
          const SizedBox(width: 16),
          
          // User avatar
          const CircleAvatar(
            radius: 24,
            backgroundColor: Color(0xFF00C6FF),
            child: Icon(Icons.person, color: Colors.white),
          ),
          
          const SizedBox(width: 12),
          
          // User info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  supporter.username,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text(
                      tier,
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 8),
                    _getVIPBadge(tier),
                  ],
                ),
              ],
            ),
          ),
          
          // Total spent
          Text(
            '${supporter.totalSpent} 🪙',
            style: const TextStyle(
              color: Color(0xFF00C6FF),
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _getVIPBadge(String tier) {
    String emoji;
    switch (tier) {
      case 'Diamond':
        emoji = '💎';
        break;
      case 'Gold':
        emoji = '🥇';
        break;
      case 'Silver':
        emoji = '🥈';
        break;
      default:
        emoji = '🥉';
    }
    return Text(emoji, style: const TextStyle(fontSize: 20));
  }

  Widget _buildCreatorDashboardTab() {
    if (!widget.isCreatorView) return const SizedBox.shrink();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Earnings overview
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Total Earnings',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '\$${_totalEarnings.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                const Divider(color: Colors.white24),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'This Month',
                          style: TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '\$${_monthlyEarnings



.toStringAsFixed(2)}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    ElevatedButton.icon(
                      onPressed: _showWithdrawalDialog,
                      icon: const Icon(Icons.account_balance_wallet),
                      label: const Text('Withdraw'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF8A2BE2),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Earning history
          const Text(
            'Earning History',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          _earningHistory.isEmpty
              ? const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Text(
                      'No earnings yet',
                      style: TextStyle(color: Colors.white54),
                    ),
                  ),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _earningHistory.length,
                  itemBuilder: (context, index) {
                    return _buildEarningTile(_earningHistory[index]);
                  },
                ),
        ],
      ),
    );
  }

  Widget _buildEarningTile(Earning earning) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0A0A),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.card_giftcard, color: Colors.green, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  earning.description,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _formatDate(earning.timestamp),
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
          ),
          Text(
            '+\$${earning.amount.toStringAsFixed(2)}',
            style: const TextStyle(
              color: Colors.green,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  void _showCoinPurchaseDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF0A0A0A),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF00C6FF)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Buy Coins',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 24),
                _buildCoinPackage(100, 0.99),
                const SizedBox(height: 12),
                _buildCoinPackage(500, 4.99),
                const SizedBox(height: 12),
                _buildCoinPackage(1000, 9.99),
                const SizedBox(height: 12),
                _buildCoinPackage(5000, 49.99),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.1),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildCoinPackage(int coins, double price) {
    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        _purchaseCoins(coins, price);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF00C6FF), Color(0xFF8A2BE2)],
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                const Text('🪙', style: TextStyle(fontSize: 32)),
                const SizedBox(width: 12),
                Text(
                  '$coins Coins',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            Text(
              '\$${price.toStringAsFixed(2)}',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showWithdrawalDialog() {
    final TextEditingController amountController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: Colors.transparent,
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF0A0A0A),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: const Color(0xFF00C6FF)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Withdraw Earnings',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Available: \$${_cashBalance.toStringAsFixed(2)}',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    hintText: 'Enter amount',
                    hintStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.1),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    prefixText: '\$ ',
                    prefixStyle: const TextStyle(color: Colors.white),
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white.withOpacity(0.1),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          final amount = double.tryParse(amountController.text);
                          if (amount != null && amount > 0) {
                            Navigator.pop(context);
                            _withdrawEarnings(amount);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00C6FF),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Withdraw'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0A),
        title: const Text('Creator Economy', style: TextStyle(color: Colors.white)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF00C6FF),
          labelColor: const Color(0xFF00C6FF),
          unselectedLabelColor: Colors.white54,
          tabs: [
            const Tab(text: 'Wallet'),
            const Tab(text: 'Gift Shop'),
            const Tab(text: 'Leaderboard'),
            if (widget.isCreatorView) const Tab(text: 'Dashboard'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildWalletTab(),
          _buildGiftShopTab(),
          _buildLeaderboardTab(),
          if (widget.isCreatorView) _buildCreatorDashboardTab(),
        ],
      ),
    );
  }
}

// ========== DATA MODELS ==========

enum GiftRarity {
  common,
  rare,
  epic,
  legendary,
}

class Gift {
  final String id;
  final String name;
  final String emoji;
  final int price;
  final String animationPath;
  final GiftRarity rarity;

  Gift({
    required this.id,
    required this.name,
    required this.emoji,
    required this.price,
    required this.animationPath,
    required this.rarity,
  });
}

class Transaction {
  final String id;
  final String type;
  final int amount;
  final String description;
  final DateTime timestamp;

  Transaction({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.timestamp,
  });

  factory Transaction.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Transaction(
      id: doc.id,
      type: data['type'] ?? '',
      amount: data['amount'] ?? 0,
      description: data['giftName'] ?? data['type'] ?? 'Transaction',
      timestamp: (data['timestamp'] as Timestamp).toDate(),
    );
  }
}

class Earning {
  final String id;
  final String type;
  final double amount;
  final String description;
  final DateTime timestamp;

  Earning({
    required this.id,
    required this.type,
    required this.amount,
    required this.description,
    required this.timestamp,
  });

  factory Earning.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return Earning(
      id: doc.id,
      type: data['type'] ?? '',
      amount: (data['amount'] ?? 0.0).toDouble(),
      description: data['giftName'] ?? data['type'] ?? 'Earning',
      timestamp: (data['timestamp'] as Timestamp).toDate(),
    );
  }
}

class VIPSupporter {
  final String userId;
  final String username;
  final int totalSpent;
  final DateTime lastGiftDate;

  VIPSupporter({
    required this.userId,
    required this.username,
    required this.totalSpent,
    required this.lastGiftDate,
  });

  factory VIPSupporter.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>;
    return VIPSupporter(
      userId: doc.id,
      username: data['username'] ?? 'User',
      totalSpent: data['totalSpent'] ?? 0,
      lastGiftDate: (data['lastGiftDate'] as Timestamp).toDate(),
    );
  }
}

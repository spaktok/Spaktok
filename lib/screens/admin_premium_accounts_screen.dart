
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_functions_interop/firebase_functions_interop.dart';

class AdminPremiumAccountsScreen extends StatefulWidget {
  const AdminPremiumAccountsScreen({Key? key}) : super(key: key);

  @override
  State<AdminPremiumAccountsScreen> createState() => _AdminPremiumAccountsScreenState();
}

class _AdminPremiumAccountsScreenState extends State<AdminPremiumAccountsScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final HttpsCallable _managePremiumAccount = FirebaseFunctions.instance.httpsCallable('managePremiumAccount');
  final HttpsCallable _initializePremiumSettings = FirebaseFunctions.instance.httpsCallable('initializePremiumSettings');

  List<Map<String, dynamic>> _users = [];
  Map<String, dynamic> _premiumSettings = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });
    try {
      // Load premium settings
      final settingsDoc = await _firestore.collection('settings').doc('premium_settings').get();
      if (settingsDoc.exists) {
        _premiumSettings = settingsDoc.data()!;
      } else {
        // Initialize settings if they don't exist
        await _initializePremiumSettings.call();
        final newSettingsDoc = await _firestore.collection('settings').doc('premium_settings').get();
        _premiumSettings = newSettingsDoc.data()!;
      }

      // Load users
      final usersSnapshot = await _firestore.collection('users').get();
      _users = usersSnapshot.docs.map((doc) => {
        'id': doc.id,
        ...doc.data(),
      }).toList();
    } catch (e) {
      print('Error loading data: $e');
      // Handle error
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _assignPremium(String userId, String slotId) async {
    try {
      await _managePremiumAccount.call({
        'userId': userId,
        'action': 'assign',
        'slotId': slotId,
      });
      _loadData(); // Reload data after change
    } catch (e) {
      print('Error assigning premium: $e');
      // Handle error
    }
  }

  Future<void> _unassignPremium(String userId) async {
    try {
      await _managePremiumAccount.call({
        'userId': userId,
        'action': 'unassign',
      });
      _loadData(); // Reload data after change
    } catch (e) {
      print('Error unassigning premium: $e');
      // Handle error
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        appBar: AppBar(title: Text('Manage Premium Accounts')),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final List<String> availableSlots = [];
    final Map<String, String> occupiedSlots = {};

    if (_premiumSettings['premiumSlots'] != null) {
      (_premiumSettings['premiumSlots'] as Map<String, dynamic>).forEach((slotId, userId) {
        if (userId == null) {
          availableSlots.add(slotId);
        } else {
          occupiedSlots[slotId] = userId;
        }
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Premium Accounts'),
        backgroundColor: Colors.black,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              'Available Premium Slots: ${availableSlots.length} / ${_premiumSettings['maxPremiumSlots'] ?? 20}',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: _users.length,
              itemBuilder: (context, index) {
                final user = _users[index];
                final bool isPremium = user['isPremiumAccount'] ?? false;
                final String? currentSlot = user['premiumSlotId'];

                return Card(
                  color: Colors.grey[900],
                  margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                  child: ListTile(
                    title: Text(user['displayName'] ?? user['username'] ?? user['email'], style: const TextStyle(color: Colors.white)),
                    subtitle: Text('ID: ${user['id']}\nPremium: ${isPremium ? 'Yes' : 'No'}${isPremium && currentSlot != null ? ' (Slot: $currentSlot)' : ''}', style: TextStyle(color: Colors.grey[400])),
                    trailing: isPremium
                        ? ElevatedButton(
                            onPressed: () => _unassignPremium(user['id']),
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                            child: const Text('Unassign Premium'),
                          )
                        : (availableSlots.isNotEmpty
                            ? DropdownButton<String>(
                                hint: const Text('Assign Slot', style: TextStyle(color: Colors.white)),
                                value: null,
                                items: availableSlots.map((slot) {
                                  return DropdownMenuItem<String>(
                                    value: slot,
                                    child: Text(slot, style: const TextStyle(color: Colors.black)),
                                  );
                                }).toList(),
                                onChanged: (slot) {
                                  if (slot != null) {
                                    _assignPremium(user['id'], slot);
                                  }
                                },
                              )
                            : const Text('No Slots Available', style: TextStyle(color: Colors.grey))),
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



import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:spaktok/screens/chat_screen.dart';

class FriendListScreen extends StatefulWidget {
  const FriendListScreen({Key? key}) : super(key: key);

  @override
  State<FriendListScreen> createState() => _FriendListScreenState();
}

class _FriendListScreenState extends State<FriendListScreen> {
  final AuthService _authService = AuthService();
  final FirebaseAuth _auth = FirebaseAuth.instance;
  User? _currentUser;

  @override
  void initState() {
    super.initState();
    _currentUser = _auth.currentUser;
  }

  @override
  Widget build(BuildContext context) {
    if (_currentUser == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Friends')),
        body: const Center(child: Text('Please log in to view your friends.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Friends'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_add),
            onPressed: () {
              _showAddFriendDialog(context);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Friend Requests Section
          StreamBuilder<QuerySnapshot>(
            stream: _authService.getFriendRequests(_currentUser!.uid),
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return Text('Error: ${snapshot.error}');
              }
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }

              final requests = snapshot.data!.docs;
              if (requests.isEmpty) {
                return const SizedBox.shrink();
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Text('Friend Requests', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                  ListView.builder(
                    shrinkWrap: true,
                    itemCount: requests.length,
                    itemBuilder: (context, index) {
                      final request = requests[index];
                      final senderId = request['senderId'];
                      return FutureBuilder<Map<String, dynamic>?>( // Fetch sender's data
                        future: _authService.getUserDataById(senderId),
                        builder: (context, userSnapshot) {
                          if (userSnapshot.connectionState == ConnectionState.waiting) {
                            return const ListTile(title: Text('Loading...'));
                          }
                          if (userSnapshot.hasError || !userSnapshot.hasData || userSnapshot.data == null) {
                            return const ListTile(title: Text('Error loading user'));
                          }
                          final senderData = userSnapshot.data!;
                          return ListTile(
                            leading: CircleAvatar(
                              backgroundImage: NetworkImage(senderData['photoURL'] ?? 'https://via.placeholder.com/150'),
                            ),
                            title: Text(senderData['displayName'] ?? 'Unknown User'),
                            subtitle: const Text('wants to be your friend'),
                            trailing: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.check, color: Colors.green),
                                  onPressed: () async {
                                    await _authService.acceptFriendRequest(request.id);
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close, color: Colors.red),
                                  onPressed: () async {
                                    await _authService.declineFriendRequest(request.id);
                                  },
                                ),
                              ],
                            ),
                          );
                        },
                      );
                    },
                  ),
                ],
              );
            },
          ),
          // Friends List Section
          Expanded(
            child: StreamBuilder<DocumentSnapshot>(
              stream: _authService.getUserFriendsStream(_currentUser!.uid),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Text('Error: ${snapshot.error}');
                }
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                final userData = snapshot.data?.data() as Map<String, dynamic>?;
                final friends = (userData?['friends'] as List<dynamic>?)?.cast<String>() ?? [];

                if (friends.isEmpty) {
                  return const Center(child: Text('You have no friends yet. Add some!'));
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Text('My Friends', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    ),
                    Expanded(
                      child: ListView.builder(
                        itemCount: friends.length,
                        itemBuilder: (context, index) {
                          final friendId = friends[index];
                          return FutureBuilder<Map<String, dynamic>?>( // Fetch friend's data
                            future: _authService.getUserDataById(friendId),
                            builder: (context, userSnapshot) {
                              if (userSnapshot.connectionState == ConnectionState.waiting) {
                                return const ListTile(title: Text('Loading...'));
                              }
                              if (userSnapshot.hasError || !userSnapshot.hasData || userSnapshot.data == null) {
                                return const ListTile(title: Text('Error loading user'));
                              }
                              final friendData = userSnapshot.data!;
                              return ListTile(
                                leading: CircleAvatar(
                                  backgroundImage: NetworkImage(friendData['photoURL'] ?? 'https://via.placeholder.com/150'),
                                ),
                                title: Text(friendData['displayName'] ?? 'Unknown User'),
                                subtitle: Text(friendData['isOnline'] == true ? 'Online' : 'Offline'),
                                onTap: () {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => ChatScreen(
                                        receiverId: friendId,
                                        receiverName: friendData['displayName'] ?? 'Unknown User',
                                      ),
                                    ),
                                  );
                                },
                              );
                            },
                          );
                        },
                      ),
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  void _showAddFriendDialog(BuildContext context) {
    String friendUsername = '';
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Add Friend'),
          content: TextField(
            onChanged: (value) {
              friendUsername = value;
            },
            decoration: const InputDecoration(hintText: 'Enter friend\'s username or email'),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (friendUsername.isNotEmpty) {
                  // In a real app, you'd search for the user by username/email
                  // For now, let's assume friendUsername is the target userId for simplicity
                  try {
                    // Find user by username/email (requires a Cloud Function or more complex query)
                    // For demonstration, we'll assume friendUsername is the actual UID for now.
                    // A proper implementation would involve a search function to get the UID.
                    final querySnapshot = await FirebaseFirestore.instance.collection('users')
                        .where('username', isEqualTo: friendUsername)
                        .limit(1)
                        .get();

                    if (querySnapshot.docs.isNotEmpty) {
                      final targetUserId = querySnapshot.docs.first.id;
                      await _authService.sendFriendRequest(targetUserId);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Friend request sent to $friendUsername')),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('User $friendUsername not found.')),
                      );
                    }
                  } catch (e) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Error sending request: ${e.toString()}')),
                    );
                  }
                }
                Navigator.pop(context);
              },
              child: const Text('Send Request'),
            ),
          ],
        );
      },
    );
  }
}


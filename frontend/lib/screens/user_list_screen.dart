import 'package:flutter/material.dart';
import '../dataconnect_generated/example.dart';

class UserListScreen extends StatefulWidget {
  const UserListScreen({super.key});

  @override
  State<UserListScreen> createState() => _UserListScreenState();
}

class _UserListScreenState extends State<UserListScreen> {
  List<ListUsersUsers> _users = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchUsers();
  }

  Future<void> _fetchUsers() async {
    try {
      final result = await ExampleConnector.instance.listUsers().execute();
      setState(() {
        _users = result.data.users;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error != null) {
      return Center(child: Text('Error: $_error'));
    }
    if (_users.isEmpty) {
      return const Center(child: Text('No users found.'));
    }

    return ListView.builder(
      itemCount: _users.length,
      itemBuilder: (context, index) {
        final user = _users[index];
        return Card(
          margin: const EdgeInsets.all(8.0),
          child: ListTile(
            leading: const Icon(Icons.person),
            title: Text(user.username),
            subtitle: Text('ID: ${user.id}'),
            onTap: () {
              // TODO: Navigate to user detail screen
              print('Tapped on ${user.username}');
            },
          ),
        );
      },
    );
  }
}


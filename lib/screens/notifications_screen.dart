import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:spaktok/services/auth_service.dart';


class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final AuthService _authService = AuthService();

  final List<Map<String, dynamic>> _notifications = [
    {
      'type': 'like',
      'user': 'John Doe',
      'avatar': '👤',
      'message': 'liked your post',
      'time': '2 minutes ago',
      'isRead': false,
    },
    {
      'type': 'comment',
      'user': 'Jane Smith',
      'avatar': '👤',
      'message': 'commented on your video',
      'time': '15 minutes ago',
      'isRead': false,
    },
    {
      'type': 'follow',
      'user': 'Mike Johnson',
      'avatar': '👤',
      'message': 'started following you',
      'time': '1 hour ago',
      'isRead': true,
    },
    {
      'type': 'gift',
      'user': 'Sarah Williams',
      'avatar': '👤',
      'message': 'sent you a gift 🎁',
      'time': '2 hours ago',
      'isRead': true,
    },
    {
      'type': 'live',
      'user': 'Alex Brown',
      'avatar': '👤',
      'message': 'is live now!',
      'time': '3 hours ago',
      'isRead': true,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Notifications'),
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            onPressed: () {
              _markAllAsRead();
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              _showNotificationSettings(context);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          _buildTabBar(context),
          Expanded(
            child: _buildTabBarView(context),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar(BuildContext context) {
    return TabBar(
      controller: _tabController,
      indicatorColor: Theme.of(context).primaryColor,
      labelColor: Theme.of(context).primaryColor,
      unselectedLabelColor: Colors.grey,
      tabs: const [
        Tab(text: 'All'),
        Tab(text: 'Likes'),
        Tab(text: 'Comments'),
        Tab(text: 'Follows'),
      ],
    );
  }

  Widget _buildTabBarView(BuildContext context) {
    return TabBarView(
      controller: _tabController,
      children: [
        _buildNotificationsList(context, _notifications),
        _buildNotificationsList(
          context,
          _notifications.where((n) => n['type'] == 'like').toList(),
        ),
        _buildNotificationsList(
          context,
          _notifications.where((n) => n['type'] == 'comment').toList(),
        ),
        _buildNotificationsList(
          context,
          _notifications.where((n) => n['type'] == 'follow').toList(),
        ),
      ],
    );
  }

  Widget _buildNotificationsList(BuildContext context, List<Map<String, dynamic>> notifications) {
    if (notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_off,
              size: 80,
              color: Colors.grey[700],
            ),
            const SizedBox(height: 20),
            Text(
              'No notifications yet',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 18,
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        return _buildNotificationItem(context, notifications[index]);
      },
    );
  }

  Widget _buildNotificationItem(BuildContext context, Map<String, dynamic> notification) {
    return Dismissible(
      key: Key(notification['time']),
      direction: DismissDirection.endToStart,
      background: Container(
        color: Colors.red,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (direction) {
        setState(() {
          _notifications.remove(notification);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Notification deleted'),
            duration: Duration(seconds: 2),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: notification['isRead'] ? Colors.grey[900] : Colors.grey[850],
          borderRadius: BorderRadius.circular(15),
        ),
        child: ListTile(
          leading: Stack(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.grey[800],
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    notification['avatar'],
                    style: const TextStyle(fontSize: 24),
                  ),
                ),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: _getNotificationColor(notification['type']),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.black, width: 2),
                  ),
                  child: Icon(
                    _getNotificationIcon(notification['type']),
                    size: 12,
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
          title: RichText(
            text: TextSpan(
              children: [
                TextSpan(
                  text: notification['user'],
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextSpan(
                  text: ' ${notification['message']}',
                  style: const TextStyle(
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          subtitle: Text(
            notification['time'],
            style: TextStyle(
              color: Colors.grey[500],
              fontSize: 12,
            ),
          ),
          trailing: !notification['isRead']
              ? Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    shape: BoxShape.circle,
                  ),
                )
              : null,
          onTap: () {
            setState(() {
              notification['isRead'] = true;
            });
            // Navigate to relevant content
          },
        ),
      ),
    );
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'like':
        return Icons.favorite;
      case 'comment':
        return Icons.comment;
      case 'follow':
        return Icons.person_add;
      case 'gift':
        return Icons.card_giftcard;
      case 'live':
        return Icons.live_tv;
      default:
        return Icons.notifications;
    }
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'like':
        return Colors.red;
      case 'comment':
        return Colors.blue;
      case 'follow':
        return Colors.green;
      case 'gift':
        return Colors.purple;
      case 'live':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  void _markAllAsRead() {
    setState(() {
      for (var notification in _notifications) {
        notification['isRead'] = true;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All notifications marked as read'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _showNotificationSettings(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.grey[900],
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                child: const Text(
                  'Notification Settings',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              ListTile(
                leading: const Icon(Icons.favorite, color: Colors.red),
                title: const Text('Likes', style: TextStyle(color: Colors.white)),
                trailing: Switch(
                  value: true,
                  onChanged: (value) {},
                  activeColor: Theme.of(context).primaryColor,
                ),
              ),
              ListTile(
                leading: const Icon(Icons.comment, color: Colors.blue),
                title: const Text('Comments', style: TextStyle(color: Colors.white)),
                trailing: Switch(
                  value: true,
                  onChanged: (value) {},
                  activeColor: Theme.of(context).primaryColor,
                ),
              ),
              ListTile(
                leading: const Icon(Icons.person_add, color: Colors.green),
                title: const Text('New Followers', style: TextStyle(color: Colors.white)),
                trailing: Switch(
                  value: true,
                  onChanged: (value) {},
                  activeColor: Theme.of(context).primaryColor,
                ),
              ),
              ListTile(
                leading: const Icon(Icons.card_giftcard, color: Colors.purple),
                title: const Text('Gifts', style: TextStyle(color: Colors.white)),
                trailing: Switch(
                  value: true,
                  onChanged: (value) {},
                  activeColor: Theme.of(context).primaryColor,
                ),
              ),
              ListTile(
                leading: const Icon(Icons.live_tv, color: Colors.orange),
                title: const Text('Live Streams', style: TextStyle(color: Colors.white)),
                trailing: Switch(
                  value: true,
                  onChanged: (value) {},
                  activeColor: Theme.of(context).primaryColor,
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
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

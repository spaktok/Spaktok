import 'package:flutter/material.dart';
import 'package:spaktok/services/auth_service.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final AuthService _authService = AuthService();
  bool _notificationsEnabled = true;
  bool _soundEnabled = true;
  bool _vibrationEnabled = true;
  bool _autoPlayVideos = true;
  bool _dataSaverMode = false;
  bool _privateAccount = false;
  String _selectedLanguage = 'English';
  String _selectedTheme = 'Dark';

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _notificationsEnabled = prefs.getBool('notifications') ?? true;
      _soundEnabled = prefs.getBool('sound') ?? true;
      _vibrationEnabled = prefs.getBool('vibration') ?? true;
      _autoPlayVideos = prefs.getBool('autoPlay') ?? true;
      _dataSaverMode = prefs.getBool('dataSaver') ?? false;
      _privateAccount = prefs.getBool('privateAccount') ?? false;
      _selectedLanguage = prefs.getString('language') ?? 'English';
      _selectedTheme = prefs.getString('theme') ?? 'Dark';
    });
  }

  Future<void> _saveSetting(String key, dynamic value) async {
    final prefs = await SharedPreferences.getInstance();
    if (value is bool) {
      await prefs.setBool(key, value);
    } else if (value is String) {
      await prefs.setString(key, value);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Settings'),
      ),
      body: ListView(
        children: [
          _buildSection(
            context,
            'Account',
            [
              _buildListTile(
                context,
                'Edit Profile',
                Icons.person,
                () {
                  // Navigate to edit profile
                },
              ),
              _buildListTile(
                context,
                'Change Password',
                Icons.lock,
                () {
                  _showChangePasswordDialog(context);
                },
              ),
              _buildSwitchTile(
                context,
                'Private Account',
                Icons.security,
                _privateAccount,
                (value) {
                  setState(() {
                    _privateAccount = value;
                  });
                  _saveSetting('privateAccount', value);
                },
              ),
              _buildListTile(
                context,
                'Blocked Users',
                Icons.block,
                () {
                  // Navigate to blocked users
                },
              ),
            ],
          ),
          _buildSection(
            context,
            'Notifications',
            [
              _buildSwitchTile(
                context,
                'Push Notifications',
                Icons.notifications,
                _notificationsEnabled,
                (value) {
                  setState(() {
                    _notificationsEnabled = value;
                  });
                  _saveSetting('notifications', value);
                },
              ),
              _buildSwitchTile(
                context,
                'Sound',
                Icons.volume_up,
                _soundEnabled,
                (value) {
                  setState(() {
                    _soundEnabled = value;
                  });
                  _saveSetting('sound', value);
                },
              ),
              _buildSwitchTile(
                context,
                'Vibration',
                Icons.vibration,
                _vibrationEnabled,
                (value) {
                  setState(() {
                    _vibrationEnabled = value;
                  });
                  _saveSetting('vibration', value);
                },
              ),
            ],
          ),
          _buildSection(
            context,
            'Privacy & Security',
            [
              _buildListTile(
                context,
                'Privacy Settings',
                Icons.privacy_tip,
                () {
                  // Navigate to privacy settings
                },
              ),
              _buildListTile(
                context,
                'Two-Factor Authentication',
                Icons.security,
                () {
                  // Navigate to 2FA settings
                },
              ),
              _buildListTile(
                context,
                'Data & Storage',
                Icons.storage,
                () {
                  // Navigate to data settings
                },
              ),
            ],
          ),
          _buildSection(
            context,
            'Content Preferences',
            [
              _buildSwitchTile(
                context,
                'Auto-play Videos',
                Icons.play_circle,
                _autoPlayVideos,
                (value) {
                  setState(() {
                    _autoPlayVideos = value;
                  });
                  _saveSetting('autoPlay', value);
                },
              ),
              _buildSwitchTile(
                context,
                'Data Saver Mode',
                Icons.data_usage,
                _dataSaverMode,
                (value) {
                  setState(() {
                    _dataSaverMode = value;
                  });
                  _saveSetting('dataSaver', value);
                },
              ),
              _buildListTile(
                context,
                'Content Filters',
                Icons.filter_alt,
                () {
                  // Navigate to content filters
                },
              ),
            ],
          ),
          _buildSection(
            context,
            'Appearance',
            [
              _buildListTile(
                context,
                'Theme',
                Icons.palette,
                () {
                  _showThemeDialog(context);
                },
                trailing: Text(
                  _selectedTheme,
                  style: TextStyle(color: Colors.grey[400]),
                ),
              ),
              _buildListTile(
                context,
                'Language',
                Icons.language,
                () {
                  _showLanguageDialog(context);
                },
                trailing: Text(
                  _selectedLanguage,
                  style: TextStyle(color: Colors.grey[400]),
                ),
              ),
            ],
          ),
          _buildSection(
            context,
            'Support',
            [
              _buildListTile(
                context,
                'Help Center',
                Icons.help,
                () {
                  // Navigate to help center
                },
              ),
              _buildListTile(
                context,
                'Report a Problem',
                Icons.report_problem,
                () {
                  // Navigate to report problem
                },
              ),
              _buildListTile(
                context,
                'Terms of Service',
                Icons.description,
                () {
                  // Show terms of service
                },
              ),
              _buildListTile(
                context,
                'Privacy Policy',
                Icons.policy,
                () {
                  // Show privacy policy
                },
              ),
            ],
          ),
          _buildSection(
            context,
            'About',
            [
              _buildListTile(
                context,
                'App Version',
                Icons.info,
                () {},
                trailing: Text(
                  '1.0.0',
                  style: TextStyle(color: Colors.grey[400]),
                ),
              ),
              _buildListTile(
                context,
                'Rate Us',
                Icons.star,
                () {
                  // Open app store rating
                },
              ),
            ],
          ),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: ElevatedButton(
              onPressed: () {
                _showLogoutDialog(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.logout),
                  SizedBox(width: 10),
                  Text(
                    'Logout',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
          child: Text(
            title,
            style: TextStyle(
              color: Theme.of(context).primaryColor,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 10),
          decoration: BoxDecoration(
            color: Colors.grey[900],
            borderRadius: BorderRadius.circular(15),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildListTile(
    BuildContext context,
    String title,
    IconData icon,
    VoidCallback onTap, {
    Widget? trailing,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white),
      ),
      trailing: trailing ?? Icon(Icons.chevron_right, color: Colors.grey[600]),
      onTap: onTap,
    );
  }

  Widget _buildSwitchTile(
    BuildContext context,
    String title,
    IconData icon,
    bool value,
    Function(bool) onChanged,
  ) {
    return SwitchListTile(
      secondary: Icon(icon, color: Colors.white),
      title: Text(
        title,
        style: const TextStyle(color: Colors.white),
      ),
      value: value,
      onChanged: onChanged,
      activeColor: Theme.of(context).primaryColor,
    );
  }

  void _showChangePasswordDialog(BuildContext context) {
    final currentPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.grey[900],
          title: const Text(
            'Change Password',
            style: TextStyle(color: Colors.white),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: currentPasswordController,
                obscureText: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Current Password',
                  labelStyle: TextStyle(color: Colors.grey[400]),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey[700]!),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Theme.of(context).primaryColor),
                  ),
                ),
              ),
              const SizedBox(height: 15),
              TextField(
                controller: newPasswordController,
                obscureText: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'New Password',
                  labelStyle: TextStyle(color: Colors.grey[400]),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey[700]!),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Theme.of(context).primaryColor),
                  ),
                ),
              ),
              const SizedBox(height: 15),
              TextField(
                controller: confirmPasswordController,
                obscureText: true,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
                  labelStyle: TextStyle(color: Colors.grey[400]),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey[700]!),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Theme.of(context).primaryColor),
                  ),
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
              onPressed: () {
                // Change password logic
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Password changed successfully!'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
              ),
              child: const Text('Change'),
            ),
          ],
        );
      },
    );
  }

  void _showThemeDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.grey[900],
          title: const Text(
            'Select Theme',
            style: TextStyle(color: Colors.white),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildThemeOption(context, 'Dark', Icons.dark_mode),
              _buildThemeOption(context, 'Light', Icons.light_mode),
              _buildThemeOption(context, 'Auto', Icons.brightness_auto),
            ],
          ),
        );
      },
    );
  }

  Widget _buildThemeOption(BuildContext context, String theme, IconData icon) {
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(
        theme,
        style: const TextStyle(color: Colors.white),
      ),
      trailing: _selectedTheme == theme
          ? Icon(Icons.check, color: Theme.of(context).primaryColor)
          : null,
      onTap: () {
        setState(() {
          _selectedTheme = theme;
        });
        _saveSetting('theme', theme);
        Navigator.pop(context);
      },
    );
  }

  void _showLanguageDialog(BuildContext context) {
    final languages = [
      'English',
      'العربية',
      'Español',
      'Français',
      'Deutsch',
      '中文',
      '日本語',
      'Português',
    ];

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.grey[900],
          title: const Text(
            'Select Language',
            style: TextStyle(color: Colors.white),
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: languages.length,
              itemBuilder: (context, index) {
                final language = languages[index];
                return ListTile(
                  title: Text(
                    language,
                    style: const TextStyle(color: Colors.white),
                  ),
                  trailing: _selectedLanguage == language
                      ? Icon(Icons.check, color: Theme.of(context).primaryColor)
                      : null,
                  onTap: () {
                    setState(() {
                      _selectedLanguage = language;
                    });
                    _saveSetting('language', language);
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
        );
      },
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.grey[900],
          title: const Text(
            'Logout',
            style: TextStyle(color: Colors.white),
          ),
          content: const Text(
            'Are you sure you want to logout?',
            style: TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              onPressed: () async {
                await _authService.signOut();
                if (mounted) {
                  Navigator.pop(context);
                  // Navigate to login screen
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
              ),
              child: const Text('Logout'),
            ),
          ],
        );
      },
    );
  }
}

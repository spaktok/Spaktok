
class UserData {
  final String uid;
  final String email;
  final String username;
  final String displayName;
  final String? photoURL;
  final String? bio;
  final int followers;
  final int following;
  final int coins;

  UserData({
    required this.uid,
    required this.email,
    required this.username,
    required this.displayName,
    this.photoURL,
    this.bio,
    this.followers = 0,
    this.following = 0,
    this.coins = 0,
  });

  factory UserData.fromMap(Map<String, dynamic> data) {
    return UserData(
      uid: data['uid'] ?? '',
      email: data['email'] ?? '',
      username: data['username'] ?? '',
      displayName: data['displayName'] ?? '',
      photoURL: data['photoURL'],
      bio: data['bio'],
      followers: data['followers'] ?? 0,
      following: data['following'] ?? 0,
      coins: data['coins'] ?? 0,
    );
  }
}

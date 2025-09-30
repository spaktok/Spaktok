import 'package:flutter/foundation.dart';

class Gift {
  final String id;
  final String name;
  final int value; // قيمة الهدية بالعملة الافتراضية
  final String imageUrl; // رابط صورة/أيقونة الهدية
  final String? animationUrl; // رابط لرسوم متحركة للهدية (اختياري)

  Gift({
    required this.id,
    required this.name,
    required this.value,
    required this.imageUrl,
    this.animationUrl,
  });

  factory Gift.fromJson(Map<String, dynamic> json) {
    return Gift(
      id: json["id"],
      name: json["name"],
      value: json["value"],
      imageUrl: json["imageUrl"],
      animationUrl: json["animationUrl"],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "id": id,
      "name": name,
      "value": value,
      "imageUrl": imageUrl,
      "animationUrl": animationUrl,
    };
  }
}


import 'dart:convert';

part of 'example.dart';

typedef Serializer<T> = String Function(T value);
typedef Deserializer<T> = T Function(dynamic json);

class GetMovieByIdVariablesBuilder {
  final FirebaseDataConnect _dataConnect;
  final String id;

  GetMovieByIdVariablesBuilder(
      this._dataConnect, {
        required this.id,
      });

  // Accept either a JSON string or already-decoded Map
  final Deserializer<GetMovieByIdData> dataDeserializer =
      (dynamic json) => json is String
      ? GetMovieByIdData.fromJson(jsonDecode(json))
      : GetMovieByIdData.fromJson(json);

  final Serializer<GetMovieByIdVariables> varsSerializer =
      (GetMovieByIdVariables vars) => jsonEncode(vars.toJson());

  Future<OperationResult<GetMovieByIdData, GetMovieByIdVariables>> execute() {
    return ref().execute();
  }

  QueryRef<GetMovieByIdData, GetMovieByIdVariables> ref() {
    final vars = GetMovieByIdVariables(id: id);
    return _dataConnect.query(
      "GetMovieById",
      dataDeserializer,
      varsSerializer,
      vars,
    );
  }
}

class GetMovieByIdMovie {
  final String id;
  final String title;
  final String imageUrl;
  final String? genre;
  final GetMovieByIdMovieMetadata? metadata;
  final List<GetMovieByIdMovieReviews> reviews;

  GetMovieByIdMovie({
    required this.id,
    required this.title,
    required this.imageUrl,
    this.genre,
    this.metadata,
    required this.reviews,
  });

  factory GetMovieByIdMovie.fromJson(dynamic json) => GetMovieByIdMovie(
    id: nativeFromJson<String>(json['id']),
    title: nativeFromJson<String>(json['title']),
    imageUrl: nativeFromJson<String>(json['imageUrl']),
    genre: json['genre'] == null ? null : nativeFromJson<String>(json['genre']),
    metadata: json['metadata'] == null
        ? null
        : GetMovieByIdMovieMetadata.fromJson(json['metadata']),
    reviews: (json['reviews'] as List<dynamic>? ?? <dynamic>[])
        .map((e) => GetMovieByIdMovieReviews.fromJson(e))
        .toList(),
  );

  Map<String, dynamic> toJson() => {
    'id': nativeToJson<String>(id),
    'title': nativeToJson<String>(title),
    'imageUrl': nativeToJson<String>(imageUrl),
    if (genre != null) 'genre': nativeToJson<String?>(genre),
    if (metadata != null) 'metadata': metadata!.toJson(),
    'reviews': reviews.map((e) => e.toJson()).toList(),
  };
}

class GetMovieByIdMovieMetadata {
  final double? rating;
  final int? releaseYear;
  final String? description;

  GetMovieByIdMovieMetadata({
    this.rating,
    this.releaseYear,
    this.description,
  });

  factory GetMovieByIdMovieMetadata.fromJson(dynamic json) =>
      GetMovieByIdMovieMetadata(
        rating: json['rating'] == null ? null : nativeFromJson<double>(json['rating']),
        releaseYear: json['releaseYear'] == null ? null : nativeFromJson<int>(json['releaseYear']),
        description: json['description'] == null ? null : nativeFromJson<String>(json['description']),
      );

  Map<String, dynamic> toJson() => {
    if (rating != null) 'rating': nativeToJson<double?>(rating),
    if (releaseYear != null) 'releaseYear': nativeToJson<int?>(releaseYear),
    if (description != null) 'description': nativeToJson<String?>(description),
  };
}

class GetMovieByIdMovieReviews {
  final String? reviewText;
  final DateTime reviewDate;
  final int? rating;
  final GetMovieByIdMovieReviewsUser user;

  GetMovieByIdMovieReviews({
    this.reviewText,
    required this.reviewDate,
    this.rating,
    required this.user,
  });

  factory GetMovieByIdMovieReviews.fromJson(dynamic json) {
    // reviewDate may come as ISO string or epoch millis; handle common cases
    DateTime parseReviewDate(dynamic value) {
      if (value == null) {
        return DateTime.fromMillisecondsSinceEpoch(0);
      }
      if (value is int) {
        // assume epoch millis
        return DateTime.fromMillisecondsSinceEpoch(value);
      }
      final s = value.toString();
      return DateTime.tryParse(s) ?? DateTime.fromMillisecondsSinceEpoch(int.tryParse(s) ?? 0);
    }

    return GetMovieByIdMovieReviews(
      reviewText: json['reviewText'] == null ? null : nativeFromJson<String>(json['reviewText']),
      reviewDate: parseReviewDate(json['reviewDate']),
      rating: json['rating'] == null ? null : nativeFromJson<int>(json['rating']),
      user: GetMovieByIdMovieReviewsUser.fromJson(json['user']),
    );
  }

  Map<String, dynamic> toJson() => {
    if (reviewText != null) 'reviewText': nativeToJson<String?>(reviewText),
    'reviewDate': reviewDate.toIso8601String(),
    if (rating != null) 'rating': nativeToJson<int?>(rating),
    'user': user.toJson(),
  };
}

class GetMovieByIdMovieReviewsUser {
  final String id;
  final String username;

  GetMovieByIdMovieReviewsUser({
    required this.id,
    required this.username,
  });

  factory GetMovieByIdMovieReviewsUser.fromJson(dynamic json) =>
      GetMovieByIdMovieReviewsUser(
        id: nativeFromJson<String>(json['id']),
        username: nativeFromJson<String>(json['username']),
      );

  Map<String, dynamic> toJson() => {
    'id': nativeToJson<String>(id),
    'username': nativeToJson<String>(username),
  };
}

class GetMovieByIdData {
  final GetMovieByIdMovie? movie;

  GetMovieByIdData({this.movie});

  factory GetMovieByIdData.fromJson(dynamic json) => GetMovieByIdData(
    movie: json['movie'] == null ? null : GetMovieByIdMovie.fromJson(json['movie']),
  );

  Map<String, dynamic> toJson() => {
    if (movie != null) 'movie': movie!.toJson(),
  };
}

class GetMovieByIdVariables {
  final String id;

  GetMovieByIdVariables({required this.id});

  @Deprecated('fromJson is deprecated for Variable classes as they are no longer required for deserialization.')
  factory GetMovieByIdVariables.fromJson(Map<String, dynamic> json) =>
      GetMovieByIdVariables(id: nativeFromJson<String>(json['id']));

  Map<String, dynamic> toJson() => {
    'id': nativeToJson<String>(id),
  };
}

// --- Helpers and placeholders ---

T nativeFromJson<T>(dynamic value) {
  if (T == DateTime) {
    // caller should not ask for DateTime via this, but keep safe fallback
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value) as T;
    if (value is String) return DateTime.parse(value) as T;
  }
  return value as T;
}

dynamic nativeToJson<T>(T value) {
  if (value is DateTime) return value.toIso8601String();
  return value;
}

// Placeholder types to make compilation possible in isolation.
// Replace with real implementations in your project.

class OperationResult<T, V> {}

class QueryRef<T, V> {
  Future<OperationResult<T, V>> execute() async => OperationResult<T, V>();
}

class FirebaseDataConnect {
  QueryRef<T, V> query<T, V>(
      String name,
      Deserializer<T> deserializer,
      Serializer<V> serializer,
      V variables,
      ) {
    return QueryRef<T, V>();
  }
}}
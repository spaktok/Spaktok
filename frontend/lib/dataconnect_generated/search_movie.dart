import 'dart:convert';

part of 'example.dart';

// ======== Basic Helper Typedefs ========

typedef Serializer<T> = String Function(T value);
typedef Deserializer<T> = T Function(dynamic json);

// ======== JSON Conversion Helpers ========

T nativeFromJson<T>(dynamic value) {
  if (T == DateTime) {
    if (value is int) return DateTime.fromMillisecondsSinceEpoch(value) as T;
    if (value is String) return DateTime.parse(value) as T;
  }
  return value as T;
}

dynamic nativeToJson<T>(T value) {
  if (value is DateTime) return value.toIso8601String();
  return value;
}

// ======== Optional Wrapper ========

enum OptionalState { unset, set }

class Optional<T> {
  OptionalState state = OptionalState.unset;
  T? value;
  final T Function(dynamic) fromJsonFn;
  final dynamic Function(T) toJsonFn;

  Optional._(this.fromJsonFn, this.toJsonFn);

  static Optional<T> optional<T>(
      T Function(dynamic) fromJsonFn, dynamic Function(T) toJsonFn) {
    return Optional<T>._(fromJsonFn, toJsonFn);
  }

  Map<String, dynamic>? toJson() {
    if (state != OptionalState.set) return null;
    return {'value': toJsonFn(value as T)};
  }

  void setValue(T? v) {
    value = v;
    state = OptionalState.set;
  }
}

// ======== Query System (FirebaseDataConnect replacement) ========

class QueryResult<T, V> {
  final T? data;
  final dynamic error;

  QueryResult({this.data, this.error});
}

class QueryRef<T, V> {
  Future<QueryResult<T, V>> execute() async => QueryResult<T, V>();
}

// تم تعديل الاسم من "query" إلى "runQuery" لتجنب التحذير
class FirebaseDataConnect {
  QueryRef<T, V> runQuery<T, V>(
      String name,
      Deserializer<T> deserializer,
      Serializer<V> serializer,
      V variables,
      ) {
    return QueryRef<T, V>();
  }
}

// ======== Actual generated code for SearchMovie ========

class SearchMovieVariablesBuilder {
  final Optional<String> _titleInput =
  Optional.optional(nativeFromJson, nativeToJson);
  final Optional<String> _genre =
  Optional.optional(nativeFromJson, nativeToJson);

  final FirebaseDataConnect _dataConnect;

  SearchMovieVariablesBuilder(this._dataConnect);

  SearchMovieVariablesBuilder titleInput(String? t) {
    _titleInput.setValue(t);
    return this;
  }

  SearchMovieVariablesBuilder genre(String? t) {
    _genre.setValue(t);
    return this;
  }

  final Deserializer<SearchMovieData> dataDeserializer =
      (dynamic json) => SearchMovieData.fromJson(jsonDecode(json));

  final Serializer<SearchMovieVariables> varsSerializer =
      (SearchMovieVariables vars) => jsonEncode(vars.toJson());

  Future<QueryResult<SearchMovieData, SearchMovieVariables>> execute() {
    return ref().execute();
  }

  QueryRef<SearchMovieData, SearchMovieVariables> ref() {
    final vars = SearchMovieVariables(
      titleInput: _titleInput,
      genre: _genre,
    );
    return _dataConnect.runQuery(
      "SearchMovie",
      dataDeserializer,
      varsSerializer,
      vars,
    );
  }
}

// ======== Data Classes ========

class SearchMovieMovies {
  final String id;
  final String title;
  final String? genre;
  final String imageUrl;

  SearchMovieMovies({
    required this.id,
    required this.title,
    this.genre,
    required this.imageUrl,
  });

  factory SearchMovieMovies.fromJson(dynamic json) => SearchMovieMovies(
    id: nativeFromJson<String>(json['id']),
    title: nativeFromJson<String>(json['title']),
    genre: json['genre'] == null
        ? null
        : nativeFromJson<String>(json['genre']),
    imageUrl: nativeFromJson<String>(json['imageUrl']),
  );

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json['id'] = nativeToJson<String>(id);
    json['title'] = nativeToJson<String>(title);
    if (genre != null) json['genre'] = nativeToJson<String?>(genre);
    json['imageUrl'] = nativeToJson<String>(imageUrl);
    return json;
  }
}

class SearchMovieData {
  final List<SearchMovieMovies> movies;

  SearchMovieData({required this.movies});

  factory SearchMovieData.fromJson(dynamic json) => SearchMovieData(
    movies: (json['movies'] as List<dynamic>)
        .map((e) => SearchMovieMovies.fromJson(e))
        .toList(),
  );

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json['movies'] = movies.map((e) => e.toJson()).toList();
    return json;
  }
}

class SearchMovieVariables {
  late Optional<String> titleInput;
  late Optional<String> genre;

  SearchMovieVariables({
    required this.titleInput,
    required this.genre,
  });

  @Deprecated(
      'fromJson is deprecated for Variable classes as they are no longer required for deserialization.')
  SearchMovieVariables.fromJson(Map<String, dynamic> json) {
    titleInput = Optional.optional(nativeFromJson, nativeToJson);
    titleInput.value = json['titleInput'] == null
        ? null
        : nativeFromJson<String>(json['titleInput']);
    if (json.containsKey('titleInput')) {
      titleInput.state = OptionalState.set;
    }

    genre = Optional.optional(nativeFromJson, nativeToJson);
    genre.value =
    json['genre'] == null ? null : nativeFromJson<String>(json['genre']);
    if (json.containsKey('genre')) {
      genre.state = OptionalState.set;
    }
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (titleInput.state == OptionalState.set) {
      json['titleInput'] = titleInput.value == null
          ? null
          : nativeToJson<String>(titleInput.value as String);
    }
    if (genre.state == OptionalState.set) {
      json['genre'] = genre.value == null
          ? null
          : nativeToJson<String>(genre.value as String);
    }
    return json;
  }
}
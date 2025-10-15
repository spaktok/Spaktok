import 'dart:convert';

part of 'example.dart';

typedef Serializer<T> = String Function(T);
typedef Deserializer<T> = T Function(dynamic);

class CreateMovieVariablesBuilder {
  final FirebaseDataConnect _dataConnect;
  final String title;
  final String genre;
  final String imageUrl;

  CreateMovieVariablesBuilder(
      this._dataConnect, {
        required this.title,
        required this.genre,
        required this.imageUrl,
      });

  final Deserializer<CreateMovieData> dataDeserializer =
      (dynamic json) => CreateMovieData.fromJson(jsonDecode(json));

  final Serializer<CreateMovieVariables> varsSerializer =
      (CreateMovieVariables vars) => jsonEncode(vars.toJson());

  Future<OperationResult<CreateMovieData, CreateMovieVariables>> execute() {
    return ref().execute();
  }

  MutationRef<CreateMovieData, CreateMovieVariables> ref() {
    final vars = CreateMovieVariables(
      title: title,
      genre: genre,
      imageUrl: imageUrl,
    );
    return _dataConnect.mutation(
      "CreateMovie",
      dataDeserializer,
      varsSerializer,
      vars,
    );
  }
}

class CreateMovieMovieInsert {
  final String id;

  CreateMovieMovieInsert({
    required this.id,
  });

  factory CreateMovieMovieInsert.fromJson(dynamic json) =>
      CreateMovieMovieInsert(
        id: nativeFromJson<String>(json['id']),
      );

  Map<String, dynamic> toJson() => {
    'id': nativeToJson<String>(id),
  };
}

class CreateMovieData {
  final CreateMovieMovieInsert movieInsert;

  CreateMovieData({
    required this.movieInsert,
  });

  factory CreateMovieData.fromJson(dynamic json) => CreateMovieData(
    movieInsert: CreateMovieMovieInsert.fromJson(json['movie_insert']),
  );

  Map<String, dynamic> toJson() => {
    'movie_insert': movieInsert.toJson(),
  };
}

class CreateMovieVariables {
  final String title;
  final String genre;
  final String imageUrl;

  CreateMovieVariables({
    required this.title,
    required this.genre,
    required this.imageUrl,
  });

  @Deprecated(
      'fromJson is deprecated for Variable classes as they are no longer required for deserialization.')
  factory CreateMovieVariables.fromJson(Map<String, dynamic> json) =>
      CreateMovieVariables(
        title: nativeFromJson<String>(json['title']),
        genre: nativeFromJson<String>(json['genre']),
        imageUrl: nativeFromJson<String>(json['imageUrl']),
      );

  Map<String, dynamic> toJson() => {
    'title': nativeToJson<String>(title),
    'genre': nativeToJson<String>(genre),
    'imageUrl': nativeToJson<String>(imageUrl),
  };
}

// Helper functions and placeholder types to make the file standalone:
T nativeFromJson<T>(dynamic value) => value as T;
dynamic nativeToJson<T>(T value) => value;

class OperationResult<T, V> {
  // Add fields as needed
}

class MutationRef<T, V> {
  Future<OperationResult<T, V>> execute() async {
    return OperationResult<T, V>();
  }
}

class FirebaseDataConnect {
  MutationRef<T, V> mutation<T, V>(
      String name,
      Deserializer<T> deserializer,
      Serializer<V> serializer,
      V variables,
      ) {
    // Replace with actual implementation that performs the mutation.
    return MutationRef<T, V>();
  }

  QueryRef<SearchMovieData, SearchMovieVariables> runQuery(String s, Deserializer<SearchMovieData> dataDeserializer, Serializer<SearchMovieVariables> varsSerializer, SearchMovieVariables vars) {}
}
import 'dart:convert';

part of 'example.dart';

class AddReviewVariablesBuilder {
  final dynamic _dataConnect;
  final String movieId;
  final int rating;
  final String reviewText;

  AddReviewVariablesBuilder(
      this._dataConnect, {
        required this.movieId,
        required this.rating,
        required this.reviewText,
      });

  AddReviewData Function(dynamic) get dataDeserializer =>
          (dynamic json) => AddReviewData.fromJson(jsonDecode(json));

  String Function(AddReviewVariables) get varsSerializer =>
          (AddReviewVariables vars) => jsonEncode(vars.toJson());

  Future<OperationResult> execute() {
    return ref().execute();
  }

  MutationRef<AddReviewData, AddReviewVariables> ref() {
    AddReviewVariables vars = AddReviewVariables(
      movieId: movieId,
      rating: rating,
      reviewText: reviewText,
    );
    return _dataConnect.mutation(
      "AddReview",
      dataDeserializer,
      varsSerializer,
      vars,
    );
  }
}

class OperationResult {}

class MutationRef<T, V> {
  Future<OperationResult> execute() async {
    return OperationResult();
  }
}

class AddReviewReviewUpsert {
  final String userId;
  final String movieId;

  AddReviewReviewUpsert({
    required this.userId,
    required this.movieId,
  });

  factory AddReviewReviewUpsert.fromJson(dynamic json) => AddReviewReviewUpsert(
    userId: nativeFromJson<String>(json['userId']),
    movieId: nativeFromJson<String>(json['movieId']),
  );

  Map<String, dynamic> toJson() => {
    'userId': nativeToJson<String>(userId),
    'movieId': nativeToJson<String>(movieId),
  };
}

class AddReviewData {
  final AddReviewReviewUpsert reviewUpsert;

  AddReviewData({
    required this.reviewUpsert,
  });

  factory AddReviewData.fromJson(dynamic json) => AddReviewData(
    reviewUpsert: AddReviewReviewUpsert.fromJson(json['review_upsert']),
  );

  Map<String, dynamic> toJson() => {
    'review_upsert': reviewUpsert.toJson(),
  };
}

class AddReviewVariables {
  final String movieId;
  final int rating;
  final String reviewText;

  AddReviewVariables({
    required this.movieId,
    required this.rating,
    required this.reviewText,
  });

  @Deprecated(
      'fromJson is deprecated for Variable classes as they are no longer required for deserialization.')
  factory AddReviewVariables.fromJson(Map<String, dynamic> json) =>
      AddReviewVariables(
        movieId: nativeFromJson<String>(json['movieId']),
        rating: nativeFromJson<int>(json['rating']),
        reviewText: nativeFromJson<String>(json['reviewText']),
      );

  Map<String, dynamic> toJson() => {
    'movieId': nativeToJson<String>(movieId),
    'rating': nativeToJson<int>(rating),
    'reviewText': nativeToJson<String>(reviewText),
  };
}

T nativeFromJson<T>(dynamic value) => value as T;

dynamic nativeToJson<T>(T value) => value;
import 'dart:convert';

part of 'example.dart';

class AddReviewVariablesBuilder {
  final dynamic _dataConnect; // Must have a `mutation` method
  final String movieId;
  final int rating;
  final String reviewText;

  AddReviewVariablesBuilder(
      this._dataConnect, {
        required this.movieId,
        required this.rating,
        required this.reviewText,
      });

  // Deserializer for API response
  AddReviewData Function(dynamic) get dataDeserializer =>
          (dynamic json) => AddReviewData.fromJson(jsonDecode(json));

  // Serializer for sending variables to API
  String Function(AddReviewVariables) get varsSerializer =>
          (AddReviewVariables vars) => jsonEncode(vars.toJson());

  // Execute the mutation
  Future<OperationResult> execute() {
    return ref().execute();
  }

  // Create the mutation reference
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

// Operation result placeholder
class OperationResult {}

// Mutation reference placeholder
class MutationRef<T, V> {
  Future<OperationResult> execute() async {
    return OperationResult();
  }
}

// Review data model for the response
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

// Main response data
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

// Variables sent to the mutation
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

// Helper functions for JSON serialization
T nativeFromJson<T>(dynamic value) => value as T;

dynamic nativeToJson<T>(T value) => value;
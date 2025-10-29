/// Custom exception classes for better error handling
abstract class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic originalException;
  final StackTrace? stackTrace;

  AppException({
    required this.message,
    this.code,
    this.originalException,
    this.stackTrace,
  });

  @override
  String toString() => message;
}

/// Authentication related exceptions
class AuthException extends AppException {
  AuthException({
    required String message,
    String? code,
    dynamic originalException,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalException: originalException,
          stackTrace: stackTrace,
        );

  factory AuthException.userNotFound() {
    return AuthException(
      message: 'User not found',
      code: 'user_not_found',
    );
  }

  factory AuthException.wrongPassword() {
    return AuthException(
      message: 'Wrong password',
      code: 'wrong_password',
    );
  }

  factory AuthException.userDisabled() {
    return AuthException(
      message: 'User account has been disabled',
      code: 'user_disabled',
    );
  }

  factory AuthException.emailAlreadyInUse() {
    return AuthException(
      message: 'Email is already in use',
      code: 'email_already_in_use',
    );
  }

  factory AuthException.weakPassword() {
    return AuthException(
      message: 'Password is too weak',
      code: 'weak_password',
    );
  }

  factory AuthException.invalidEmail() {
    return AuthException(
      message: 'Invalid email address',
      code: 'invalid_email',
    );
  }

  factory AuthException.notLoggedIn() {
    return AuthException(
      message: 'User is not logged in',
      code: 'not_logged_in',
    );
  }
}

/// Network related exceptions
class NetworkException extends AppException {
  NetworkException({
    required String message,
    String? code,
    dynamic originalException,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalException: originalException,
          stackTrace: stackTrace,
        );

  factory NetworkException.noConnection() {
    return NetworkException(
      message: 'No internet connection',
      code: 'no_connection',
    );
  }

  factory NetworkException.timeout() {
    return NetworkException(
      message: 'Request timeout',
      code: 'timeout',
    );
  }

  factory NetworkException.badResponse(int statusCode) {
    return NetworkException(
      message: 'Bad response from server (Status: $statusCode)',
      code: 'bad_response',
    );
  }
}

/// Payment related exceptions
class PaymentException extends AppException {
  PaymentException({
    required String message,
    String? code,
    dynamic originalException,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalException: originalException,
          stackTrace: stackTrace,
        );

  factory PaymentException.insufficientBalance() {
    return PaymentException(
      message: 'Insufficient balance',
      code: 'insufficient_balance',
    );
  }

  factory PaymentException.paymentFailed() {
    return PaymentException(
      message: 'Payment processing failed',
      code: 'payment_failed',
    );
  }

  factory PaymentException.invalidAmount() {
    return PaymentException(
      message: 'Invalid payment amount',
      code: 'invalid_amount',
    );
  }

  factory PaymentException.cardDeclined() {
    return PaymentException(
      message: 'Card was declined',
      code: 'card_declined',
    );
  }
}

/// Database related exceptions
class DatabaseException extends AppException {
  DatabaseException({
    required String message,
    String? code,
    dynamic originalException,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalException: originalException,
          stackTrace: stackTrace,
        );

  factory DatabaseException.documentNotFound() {
    return DatabaseException(
      message: 'Document not found',
      code: 'document_not_found',
    );
  }

  factory DatabaseException.collectionNotFound() {
    return DatabaseException(
      message: 'Collection not found',
      code: 'collection_not_found',
    );
  }

  factory DatabaseException.permissionDenied() {
    return DatabaseException(
      message: 'Permission denied',
      code: 'permission_denied',
    );
  }
}

/// Validation related exceptions
class ValidationException extends AppException {
  final Map<String, String>? fieldErrors;

  ValidationException({
    required String message,
    String? code,
    this.fieldErrors,
    dynamic originalException,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalException: originalException,
          stackTrace: stackTrace,
        );

  factory ValidationException.invalidInput(Map<String, String> errors) {
    return ValidationException(
      message: 'Validation failed',
      code: 'validation_failed',
      fieldErrors: errors,
    );
  }
}

/// File related exceptions
class FileException extends AppException {
  FileException({
    required String message,
    String? code,
    dynamic originalException,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalException: originalException,
          stackTrace: stackTrace,
        );

  factory FileException.fileNotFound() {
    return FileException(
      message: 'File not found',
      code: 'file_not_found',
    );
  }

  factory FileException.fileTooLarge() {
    return FileException(
      message: 'File is too large',
      code: 'file_too_large',
    );
  }

  factory FileException.invalidFileType() {
    return FileException(
      message: 'Invalid file type',
      code: 'invalid_file_type',
    );
  }

  factory FileException.uploadFailed() {
    return FileException(
      message: 'File upload failed',
      code: 'upload_failed',
    );
  }
}

/// Generic application exception
class AppError extends AppException {
  AppError({
    required String message,
    String? code,
    dynamic originalException,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code,
          originalException: originalException,
          stackTrace: stackTrace,
        );
}

/// Generic uncaught exception
class UnknownException extends AppException {
  UnknownException({
    String message = 'An unknown error occurred',
    String? code,
    dynamic originalException,
    StackTrace? stackTrace,
  }) : super(
          message: message,
          code: code ?? 'unknown_error',
          originalException: originalException,
          stackTrace: stackTrace,
        );
}

/// Input validation utilities for the application
class Validators {
  // ─────────────────────────────── EMAIL ───────────────────────────────

  /// Validate email format
  static String? validateEmail(String? email) {
    if (email == null || email.isEmpty) {
      return 'Email is required';
    }

    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );

    if (!emailRegex.hasMatch(email)) {
      return 'Please enter a valid email address';
    }

    return null;
  }

  // ─────────────────────────────── PASSWORD ───────────────────────────────

  /// Validate password strength
  static String? validatePassword(String? password) {
    if (password == null || password.isEmpty) {
      return 'Password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!password.contains(RegExp(r'[A-Z]'))) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!password.contains(RegExp(r'[a-z]'))) {
      return 'Password must contain at least one lowercase letter';
    }

    if (!password.contains(RegExp(r'[0-9]'))) {
      return 'Password must contain at least one digit';
    }

    return null;
  }

  // ─────────────────────────────── USERNAME ───────────────────────────────

  /// Validate username
  static String? validateUsername(String? username) {
    if (username == null || username.isEmpty) {
      return 'Username is required';
    }

    if (username.length < 3) {
      return 'Username must be at least 3 characters long';
    }

    if (username.length > 20) {
      return 'Username must not exceed 20 characters';
    }

    if (!RegExp(r'^[a-zA-Z0-9_-]+$').hasMatch(username)) {
      return 'Username can only contain letters, numbers, underscores, and hyphens';
    }

    return null;
  }

  // ─────────────────────────────── PHONE ───────────────────────────────

  /// Validate phone number
  static String? validatePhoneNumber(String? phone) {
    if (phone == null || phone.isEmpty) {
      return 'Phone number is required';
    }

    final phoneRegex = RegExp(r'^[0-9+\-\s()]*$');
    if (!phoneRegex.hasMatch(phone)) {
      return 'Please enter a valid phone number';
    }

    final digitsOnly = phone.replaceAll(RegExp(r'[^\d]'), '');
    if (digitsOnly.length < 10) {
      return 'Phone number must have at least 10 digits';
    }

    return null;
  }

  // ─────────────────────────────── URL ───────────────────────────────

  /// Validate URL
  static String? validateUrl(String? url) {
    if (url == null || url.isEmpty) {
      return 'URL is required';
    }

    final urlRegex = RegExp(
      r'^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$',
    );

    if (!urlRegex.hasMatch(url)) {
      return 'Please enter a valid URL';
    }

    return null;
  }

  // ─────────────────────────────── TEXT LENGTH ───────────────────────────────

  /// Validate text length
  static String? validateTextLength(
    String? text, {
    int minLength = 0,
    int maxLength = 255,
    String fieldName = 'Text',
  }) {
    if (text == null || text.isEmpty) {
      return '$fieldName is required';
    }

    if (text.length < minLength) {
      return '$fieldName must be at least $minLength characters long';
    }

    if (text.length > maxLength) {
      return '$fieldName must not exceed $maxLength characters';
    }

    return null;
  }

  // ─────────────────────────────── NUMERIC ───────────────────────────────

  /// Validate numeric input
  static String? validateNumeric(
    String? value, {
    int? minValue,
    int? maxValue,
    String fieldName = 'Value',
  }) {
    if (value == null || value.isEmpty) {
      return '$fieldName is required';
    }

    final numValue = int.tryParse(value);
    if (numValue == null) {
      return '$fieldName must be a valid number';
    }

    if (minValue != null && numValue < minValue) {
      return '$fieldName must be at least $minValue';
    }

    if (maxValue != null && numValue > maxValue) {
      return '$fieldName must not exceed $maxValue';
    }

    return null;
  }

  // ─────────────────────────────── DOUBLE ───────────────────────────────

  /// Validate double/decimal input
  static String? validateDecimal(
    String? value, {
    double? minValue,
    double? maxValue,
    String fieldName = 'Value',
  }) {
    if (value == null || value.isEmpty) {
      return '$fieldName is required';
    }

    final numValue = double.tryParse(value);
    if (numValue == null) {
      return '$fieldName must be a valid number';
    }

    if (minValue != null && numValue < minValue) {
      return '$fieldName must be at least $minValue';
    }

    if (maxValue != null && numValue > maxValue) {
      return '$fieldName must not exceed $maxValue';
    }

    return null;
  }

  // ─────────────────────────────── REQUIRED ───────────────────────────────

  /// Validate required field
  static String? validateRequired(
    String? value, {
    String fieldName = 'This field',
  }) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  // ─────────────────────────────── MATCH ───────────────────────────────

  /// Validate two fields match (e.g., password confirmation)
  static String? validateMatch(
    String? value1,
    String? value2, {
    String fieldName = 'Fields',
  }) {
    if (value1 == null || value2 == null) {
      return '$fieldName are required';
    }

    if (value1 != value2) {
      return '$fieldName do not match';
    }

    return null;
  }

  // ─────────────────────────────── DATE ───────────────────────────────

  /// Validate date format (YYYY-MM-DD)
  static String? validateDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) {
      return 'Date is required';
    }

    try {
      DateTime.parse(dateString);
      return null;
    } catch (e) {
      return 'Please enter a valid date (YYYY-MM-DD)';
    }
  }

  // ─────────────────────────────── AGE ───────────────────────────────

  /// Validate age
  static String? validateAge(DateTime? birthDate, {int minAge = 13}) {
    if (birthDate == null) {
      return 'Birth date is required';
    }

    final today = DateTime.now();
    final age = today.year - birthDate.year;

    if (age < minAge) {
      return 'You must be at least $minAge years old';
    }

    return null;
  }

  // ─────────────────────────────── CREDIT CARD ───────────────────────────────

  /// Validate credit card number (Luhn algorithm)
  static String? validateCreditCard(String? cardNumber) {
    if (cardNumber == null || cardNumber.isEmpty) {
      return 'Card number is required';
    }

    final digitsOnly = cardNumber.replaceAll(RegExp(r'[^\d]'), '');

    if (digitsOnly.length < 13 || digitsOnly.length > 19) {
      return 'Card number must be between 13 and 19 digits';
    }

    if (!_validateLuhn(digitsOnly)) {
      return 'Invalid card number';
    }

    return null;
  }

  /// Luhn algorithm for credit card validation
  static bool _validateLuhn(String cardNumber) {
    int sum = 0;
    bool isEven = false;

    for (int i = cardNumber.length - 1; i >= 0; i--) {
      int digit = int.parse(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 == 0;
  }
}

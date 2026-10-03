export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(code, message, 401);
    this.name = 'AuthError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super('VALIDATION_ERROR', message, 400, { field });
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super('NETWORK_ERROR', message, 0);
    this.name = 'NetworkError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class PermissionError extends AppError {
  constructor(message: string = 'Permission denied') {
    super('PERMISSION_ERROR', message, 403);
    this.name = 'PermissionError';
  }
}

export const errorMessages: Record<string, string> = {
  AUTH_ERROR: 'Authentication failed. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  NETWORK_ERROR: 'Network connection failed. Please check your internet.',
  NOT_FOUND: 'The requested resource was not found.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  CONFLICT: 'This resource already exists.',
  RATE_LIMIT: 'Too many requests. Please try again later.',
  EMAIL_EXISTS: 'Email already registered.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  PASSWORD_WEAK: 'Password does not meet security requirements.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
};

export function getUserFriendlyError(error: any): string {
  if (error instanceof AppError) {
    return errorMessages[error.code] || error.message;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return errorMessages[error.message] || error.message;
  }

  return errorMessages.SERVER_ERROR;
}

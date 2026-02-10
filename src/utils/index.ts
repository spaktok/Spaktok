export * from './validation';
export * from './formatting';
export * from './storage';
export * from './api';
export * from './errorHandler';
export * from './tokenManager';
export * from './secureStorage';
export * from './sessionManager';
export * from './deviceInfo';
export * from './biometric';
export * from './rateLimiter';

// Common utilities
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

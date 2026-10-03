import { formatDistanceToNow, format } from 'date-fns';

// Format numbers
export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format count with suffix
export const formatCount = (count: number): string => {
  return formatNumber(count);
};

// Format date as relative time
export const formatRelativeTime = (date: Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Format date as short date
export const formatShortDate = (date: Date): string => {
  return format(new Date(date), 'MMM dd, yyyy');
};

// Format date and time
export const formatDateTime = (date: Date): string => {
  return format(new Date(date), 'MMM dd, yyyy hh:mm a');
};

// Format duration in seconds to HH:MM:SS
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Format currency
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Truncate text
export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Format username with @
export const formatUsername = (username: string): string => {
  return `@${username}`;
};

// Format hashtag
export const formatHashtag = (tag: string): string => {
  return `#${tag}`;
};

// Extract hashtags from text
export const extractHashtags = (text: string): string[] => {
  const regex = /#[^\s#]+/g;
  return text.match(regex) || [];
};

// Extract mentions from text
export const extractMentions = (text: string): string[] => {
  const regex = /@[^\s@]+/g;
  return text.match(regex) || [];
};

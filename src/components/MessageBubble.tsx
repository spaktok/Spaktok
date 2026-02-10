import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Message } from '@/types/messages';
import { formatRelativeTime } from '@/utils';

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onLongPress?: (messageId: string) => void;
  onImagePress?: (mediaUrl: string) => void;
  onReactionPress?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  onLongPress,
  onImagePress,
  onReactionPress,
}) => {
  const isExpiring = message.expiresAt && new Date(message.expiresAt) < new Date();

  const getBackgroundColor = () => {
    if (isOwn) return '#FF6B6B';
    return '#1a1a1a';
  };

  const getTextColor = () => {
    if (isOwn) return '#fff';
    return '#fff';
  };

  return (
    <TouchableOpacity
      onLongPress={() => onLongPress?.(message.id)}
      style={{
        marginVertical: 4,
        marginHorizontal: 12,
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {/* Message Bubble */}
      <View
        style={{
          maxWidth: '75%',
          backgroundColor: getBackgroundColor(),
          borderRadius: 12,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderBottomLeftRadius: isOwn ? 12 : 4,
          borderBottomRightRadius: isOwn ? 4 : 12,
          opacity: isExpiring ? 0.5 : 1,
        }}
      >
        {/* Text Message */}
        {message.type === 'text' && (
          <Text style={{ color: getTextColor(), fontSize: 14, lineHeight: 20 }}>
            {message.content}
          </Text>
        )}

        {/* Image Message */}
        {message.type === 'image' && message.mediaUrl && (
          <TouchableOpacity onPress={() => onImagePress?.(message.mediaUrl!)}>
            <Image
              source={{ uri: message.mediaUrl }}
              style={{ width: 200, height: 200, borderRadius: 8 }}
            />
            {isExpiring && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#00000080',
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Expired</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Video Message */}
        {message.type === 'video' && message.mediaUrl && (
          <TouchableOpacity onPress={() => onImagePress?.(message.mediaUrl!)}>
            <Image
              source={{ uri: message.mediaThumbnail || message.mediaUrl }}
              style={{ width: 200, height: 200, borderRadius: 8 }}
            />
            <View
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: [{ translateX: -12 }, { translateY: -12 }],
              }}
            >
              <Text style={{ fontSize: 24 }}>▶</Text>
            </View>
            {message.mediaDuration && (
              <View
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  backgroundColor: '#00000080',
                  paddingHorizontal: 4,
                  paddingVertical: 2,
                  borderRadius: 2,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 10 }}>
                  {Math.floor(message.mediaDuration / 60)}:{(message.mediaDuration % 60)
                    .toString()
                    .padStart(2, '0')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Voice Message */}
        {message.type === 'voice' && message.mediaUrl && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity>
              <Text style={{ fontSize: 20 }}>▶</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, height: 20, backgroundColor: '#00000020', borderRadius: 4 }} />
            {message.mediaDuration && (
              <Text style={{ color: getTextColor(), fontSize: 12 }}>
                {Math.floor(message.mediaDuration / 60)}:{(message.mediaDuration % 60)
                  .toString()
                  .padStart(2, '0')}
              </Text>
            )}
          </View>
        )}

        {/* Timestamp */}
        <Text
          style={{
            color: isOwn ? '#ffffffaa' : '#999',
            fontSize: 11,
            marginTop: message.type === 'text' ? 4 : 0,
          }}
        >
          {formatRelativeTime(new Date(message.createdAt))}
        </Text>

        {/* Expiration Info */}
        {message.expiresAt && (
          <Text
            style={{
              color: isOwn ? '#ff9999' : '#FF6B6B',
              fontSize: 10,
              marginTop: 2,
            }}
          >
            Expires: {formatRelativeTime(new Date(message.expiresAt))}
          </Text>
        )}
      </View>

      {/* Message Status */}
      {isOwn && (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#999' }}>
            {message.viewedAt ? '✓✓' : '✓'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default MessageBubble;

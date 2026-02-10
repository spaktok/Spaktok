import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Video } from '@/types';
import { formatCount, formatRelativeTime } from '@/utils';

export interface VideoCardProps {
  video: Video;
  isLiked?: boolean;
  onPress?: () => void;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onSharePress?: () => void;
  onUserPress?: () => void;
  loading?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isLiked = false,
  onPress,
  onLikePress,
  onCommentPress,
  onSharePress,
  onUserPress,
  loading = false,
}) => {
  const { width } = Dimensions.get('window');
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: width,
        backgroundColor: '#000',
        marginBottom: 1,
      }}
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <View
        style={{
          width: '100%',
          aspectRatio: 9 / 16,
          backgroundColor: '#111',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Image
          source={{ uri: video.thumbnail }}
          style={{ width: '100%', height: '100%' }}
          onLoadEnd={() => setImageLoaded(true)}
        />

        {!imageLoaded && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#11111180',
            }}
          >
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        )}

        {/* Video Duration Badge */}
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            backgroundColor: '#00000080',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
          </Text>
        </View>

        {/* View Count */}
        <View
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            backgroundColor: '#00000080',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 12 }}>
            {formatCount(video.views)} views
          </Text>
        </View>
      </View>

      {/* Video Info */}
      <View style={{ padding: 12, backgroundColor: '#000' }}>
        {/* Creator Info */}
        <TouchableOpacity
          onPress={onUserPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FF6B6B',
              marginRight: 12,
            }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 2 }}>
              Creator Name
            </Text>
            <Text style={{ color: '#999', fontSize: 12 }}>
              {formatRelativeTime(new Date(video.createdAt))}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Title */}
        <Text
          style={{
            color: '#fff',
            fontSize: 14,
            fontWeight: '500',
            marginBottom: 8,
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {video.title}
        </Text>

        {/* Description */}
        {video.description && (
          <Text
            style={{
              color: '#999',
              fontSize: 12,
              marginBottom: 12,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {video.description}
          </Text>
        )}

        {/* Tags */}
        {video.tags.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              marginBottom: 12,
              gap: 8,
            }}
          >
            {video.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: '#FF6B6B20',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                }}
              >
                <Text style={{ color: '#FF6B6B', fontSize: 11, fontWeight: '500' }}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            borderTopWidth: 1,
            borderTopColor: '#1a1a1a',
            paddingTop: 12,
          }}
        >
          <TouchableOpacity
            onPress={onLikePress}
            style={{ alignItems: 'center' }}
            disabled={loading}
          >
            <Text style={{ fontSize: 20, marginBottom: 4 }}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
            <Text style={{ color: '#999', fontSize: 11 }}>
              {formatCount(video.likes)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCommentPress}
            style={{ alignItems: 'center' }}
            disabled={loading}
          >
            <Text style={{ fontSize: 20, marginBottom: 4 }}>💬</Text>
            <Text style={{ color: '#999', fontSize: 11 }}>
              {formatCount(video.comments)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSharePress}
            style={{ alignItems: 'center' }}
            disabled={loading}
          >
            <Text style={{ fontSize: 20, marginBottom: 4 }}>📤</Text>
            <Text style={{ color: '#999', fontSize: 11 }}>
              {formatCount(video.shares)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default VideoCard;

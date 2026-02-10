import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Dimensions,
  TouchableOpacity,
  Text,
  Animated,
  PanResponder,
  Gesture,
  GestureDetector,
} from 'react-native';
import { Video } from '@/types';
import { VideoPlayer } from './VideoPlayer';
import { useDoubleTap } from '@/utils/gestureHandlers';
import { formatCount } from '@/utils';

export interface VerticalReelPlayerProps {
  video: Video;
  isLiked: boolean;
  onLikePress: () => void;
  onCommentPress: () => void;
  onSharePress: () => void;
  onFollowPress: () => void;
  onUserPress: () => void;
  onPlayPause?: (isPlaying: boolean) => void;
  visible: boolean;
}

export const VerticalReelPlayer: React.FC<VerticalReelPlayerProps> = ({
  video,
  isLiked,
  onLikePress,
  onCommentPress,
  onSharePress,
  onFollowPress,
  onUserPress,
  onPlayPause,
  visible,
}) => {
  const { width, height } = Dimensions.get('window');
  const [isPlaying, setIsPlaying] = useState(visible);
  const scaleAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;

  const { onTap: handleDoubleTap } = useDoubleTap(() => {
    if (!isLiked) {
      onLikePress();
      
      // Animate heart
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnimation, {
            toValue: 1,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnimation, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(500),
        Animated.parallel([
          Animated.timing(scaleAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  });

  useEffect(() => {
    setIsPlaying(visible);
    onPlayPause?.(visible);
  }, [visible]);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleDoubleTap}
      style={{
        width: width,
        height: height,
        backgroundColor: '#000',
        position: 'relative',
      }}
    >
      {/* Video Player */}
      <VideoPlayer
        uri={video.videoUrl}
        autoPlay={isPlaying}
        loop={true}
        resizeMode="cover"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Animated Heart on Double Tap */}
      <Animated.View
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: [
            { translateX: -30 },
            { translateY: -30 },
            { scale: scaleAnimation },
          ],
          opacity: opacityAnimation,
        }}
      >
        <Text style={{ fontSize: 80 }}>❤️</Text>
      </Animated.View>

      {/* Left Gradient Overlay */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '60%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          justifyContent: 'flex-end',
          paddingBottom: 20,
          paddingHorizontal: 16,
        }}
      >
        {/* Creator Info */}
        <TouchableOpacity
          onPress={onUserPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
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
            <Text style={{ color: '#999', fontSize: 12 }}>@username</Text>
          </View>
          <TouchableOpacity
            onPress={onFollowPress}
            style={{
              backgroundColor: '#FF6B6B',
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
              Follow
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Video Title and Description */}
        <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 8, fontSize: 14 }}>
          {video.title}
        </Text>
        {video.description && (
          <Text
            style={{
              color: '#ccc',
              fontSize: 13,
              marginBottom: 12,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {video.description}
          </Text>
        )}
      </View>

      {/* Right Action Buttons */}
      <View
        style={{
          position: 'absolute',
          right: 12,
          bottom: 80,
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Like Button */}
        <TouchableOpacity
          onPress={onLikePress}
          style={{ alignItems: 'center' }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#00000080',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>
              {isLiked ? '❤️' : '🤍'}
            </Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>
            {formatCount(video.likes)}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          onPress={onCommentPress}
          style={{ alignItems: 'center' }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#00000080',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>💬</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>
            {formatCount(video.comments)}
          </Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          onPress={onSharePress}
          style={{ alignItems: 'center' }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#00000080',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24 }}>📤</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>
            {formatCount(video.shares)}
          </Text>
        </TouchableOpacity>

        {/* More Options Button */}
        <TouchableOpacity style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: '#00000080',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>•••</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 11, marginTop: 4 }}>
            More
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default VerticalReelPlayer;

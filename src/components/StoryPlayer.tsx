import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Gesture,
  GestureDetector,
} from 'react-native';
import { Video } from 'expo-av';
import { Story } from '@/types/stories';
import { storiesService } from '@/services/stories';
import { formatRelativeTime } from '@/utils';

export interface StoryPlayerProps {
  story: Story;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onReply: (storyId: string) => void;
  visible: boolean;
}

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5; // 5 seconds

export const StoryPlayer: React.FC<StoryPlayerProps> = ({
  story,
  onClose,
  onNext,
  onPrevious,
  onReply,
  visible,
}) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewRecorded, setViewRecorded] = useState(false);
  const [loading, setLoading] = useState(true);

  const progressAnimation = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef(Date.now());

  // Record view when story becomes visible
  useEffect(() => {
    if (visible && !viewRecorded) {
      recordView();
    }
  }, [visible]);

  // Animate progress bar
  useEffect(() => {
    if (!visible || isPaused || !loading) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const duration = story.type === 'video' ? story.duration || STORY_DURATION : STORY_DURATION;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newProgress = Math.min(elapsed / duration, 1);

      setProgress(newProgress);
      progressAnimation.setValue(newProgress);

      if (newProgress >= 1) {
        clearInterval(interval);
        handleComplete();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [visible, isPaused, loading]);

  const recordView = async () => {
    try {
      await storiesService.recordView(story.id);
      setViewRecorded(true);
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const handleComplete = () => {
    setProgress(0);
    startTimeRef.current = Date.now();
    onNext();
  };

  const handleScreenPress = (e: any) => {
    const { locationX } = e.nativeEvent;
    if (locationX < width / 3) {
      onPrevious();
    } else if (locationX > (width * 2) / 3) {
      onNext();
    } else {
      setIsPaused(!isPaused);
    }
  };

  const isExpired = new Date(story.expiresAt) < new Date();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleScreenPress}
      style={{ width, height, backgroundColor: '#000', position: 'relative' }}
    >
      {/* Story Content */}
      {isExpired ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18 }}>This story has expired</Text>
        </View>
      ) : story.type === 'image' ? (
        <>
          <Image
            source={{ uri: story.mediaUrl }}
            style={{ width: '100%', height: '100%' }}
            onLoadEnd={() => setLoading(false)}
          />
          {loading && (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#00000080',
              }}
            >
              <ActivityIndicator size="large" color="#FF6B6B" />
            </View>
          )}
        </>
      ) : (
        <Video
          ref={videoRef}
          source={{ uri: story.mediaUrl }}
          shouldPlay={visible && !isPaused && !loading}
          rate={1.0}
          volume={1.0}
          isMuted={false}
          resizeMode="cover"
          onLoad={() => setLoading(false)}
          style={{ width: '100%', height: '100%' }}
        />
      )}

      {/* Progress Bar */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          backgroundColor: '#ffffff40',
        }}
      >
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: '#FF6B6B',
            width: progressAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>

      {/* Header with User Info */}
      <View
        style={{
          position: 'absolute',
          top: 20,
          left: 16,
          right: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: '#FF6B6B',
            }}
          />
          <View>
            <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 2 }}>
              User Name
            </Text>
            <Text style={{ color: '#999', fontSize: 12 }}>
              {formatRelativeTime(new Date(story.createdAt))}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: '#fff', fontSize: 24 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {story.caption && (
        <View
          style={{
            position: 'absolute',
            bottom: 80,
            left: 16,
            right: 16,
            backgroundColor: '#00000080',
            padding: 12,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>
            {story.caption}
          </Text>
        </View>
      )}

      {/* Location */}
      {story.location && (
        <View
          style={{
            position: 'absolute',
            bottom: 50,
            left: 16,
            right: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>📍</Text>
          <Text style={{ color: '#fff', fontSize: 12 }}>{story.location}</Text>
        </View>
      )}

      {/* Bottom Actions */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#00000080',
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>❤️</Text>
          <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>
            {story.likes || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onReply(story.id)}
          style={{ alignItems: 'center' }}
        >
          <Text style={{ fontSize: 20 }}>💬</Text>
          <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>
            {story.comments || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>📤</Text>
          <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>
            {story.shares || 0}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>👁️</Text>
          <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>
            {story.views || 0}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pause Indicator */}
      {isPaused && (
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [{ translateX: -20 }, { translateY: -20 }],
            backgroundColor: '#00000080',
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 20 }}>⏸</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default StoryPlayer;

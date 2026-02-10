import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';

export interface VideoPlayerProps {
  uri: string;
  thumbnailUri?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  style?: any;
}

export const VideoPlayer = React.forwardRef<Video, VideoPlayerProps>(
  (
    {
      uri,
      thumbnailUri,
      onPlay,
      onPause,
      onEnd,
      onError,
      autoPlay = false,
      loop = true,
      muted = false,
      resizeMode = 'cover',
      style,
    },
    ref
  ) => {
    const videoRef = useRef<Video>(null);
    const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const { width, height } = Dimensions.get('window');

    const isPlaying = status?.isPlaying ?? false;

    const handlePlayPause = async () => {
      if (!videoRef.current) return;

      if (isPlaying) {
        await videoRef.current.pauseAsync();
        onPause?.();
      } else {
        await videoRef.current.playAsync();
        onPlay?.();
      }
    };

    const handleStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
      setStatus(playbackStatus);

      if (playbackStatus.isLoaded) {
        setLoading(false);

        if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
          onEnd?.();
        }
      }

      if (playbackStatus.error) {
        onError?.(new Error(playbackStatus.error));
      }
    };

    const handleMuteToggle = async () => {
      if (!videoRef.current || !status?.isLoaded) return;
      await videoRef.current.setIsMutedAsync(!muted);
    };

    const formatDuration = (ms: number): string => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const displaySeconds = seconds % 60;
      return `${minutes}:${displaySeconds.toString().padStart(2, '0')}`;
    };

    const currentTime = status?.isLoaded ? status.positionMillis : 0;
    const duration = status?.isLoaded ? status.durationMillis : 0;
    const progress = duration ? (currentTime / duration) * 100 : 0;

    return (
      <View
        style={[
          {
            width: '100%',
            backgroundColor: '#000',
            position: 'relative',
          },
          style,
        ]}
      >
        <Video
          ref={videoRef}
          source={{ uri }}
          rate={1.0}
          volume={1.0}
          isMuted={muted}
          resizeMode={resizeMode}
          shouldPlay={autoPlay}
          isLooping={loop}
          useNativeControls={false}
          onPlaybackStatusUpdate={handleStatusUpdate}
          style={{ width: '100%', aspectRatio: 9 / 16 }}
          progressUpdateIntervalMillis={500}
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

        {/* Custom Controls */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#00000080',
            paddingVertical: 12,
            paddingHorizontal: 16,
          }}
        >
          {/* Progress Bar */}
          <View
            style={{
              height: 3,
              backgroundColor: '#333',
              borderRadius: 1.5,
              marginBottom: 12,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                width: `${progress}%`,
                backgroundColor: '#FF6B6B',
              }}
            />
          </View>

          {/* Controls Row */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity onPress={handlePlayPause} style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 12 }}>
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </Text>
            </TouchableOpacity>

            <Text style={{ color: '#fff', fontSize: 12, marginHorizontal: 12 }}>
              {formatDuration(currentTime || 0)} / {formatDuration(duration || 0)}
            </Text>

            <TouchableOpacity onPress={handleMuteToggle}>
              <Text style={{ color: '#fff', fontSize: 12 }}>
                {muted ? '🔇' : '🔊'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Play Button Overlay */}
        {!isPlaying && !loading && (
          <TouchableOpacity
            onPress={handlePlayPause}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: [{ translateX: -30 }, { translateY: -30 }],
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: '#FF6B6B80',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 24 }}>▶</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

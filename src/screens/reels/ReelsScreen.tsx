import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Dimensions,
  ViewToken,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFeed } from '@/hooks';
import { VerticalReelPlayer } from '@/components/VerticalReelPlayer';
import { CommentsScreen } from '@/screens/feed/CommentsScreen';

interface ViewableItem {
  item: any;
  key: string;
  index?: number;
  isViewable: boolean;
  section?: any;
}

const { height } = Dimensions.get('window');

export default function ReelsScreen() {
  const { videos, isLoading, hasMore, likedVideoIds, loadMore, toggleLike } = useFeed({
    type: 'reels',
    limit: 5,
    autoLoad: true,
  });

  const [viewableIndices, setViewableIndices] = useState<number[]>([0]);
  const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const handleViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const indices = viewableItems
        .filter((item) => item.isViewable)
        .map((item) => item.index || 0);
      setViewableIndices(indices);
    }
  ).current;

  const renderReel = ({ item, index }: { item: any; index: number }) => {
    const isVisible = viewableIndices.includes(index);

    return (
      <View style={{ height, backgroundColor: '#000' }}>
        <VerticalReelPlayer
          video={item}
          isLiked={likedVideoIds.has(item.id)}
          visible={isVisible}
          onLikePress={() => toggleLike(item.id)}
          onCommentPress={() => setCommentsVideoId(item.id)}
          onSharePress={() => {
            // TODO: Implement share
          }}
          onFollowPress={() => {
            // TODO: Implement follow
          }}
          onUserPress={() => {
            // TODO: Navigate to user profile
          }}
        />
      </View>
    );
  };

  const handleEndReached = () => {
    if (!isLoading && hasMore) {
      loadMore();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {videos.length === 0 && !isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={videos}
          renderItem={renderReel}
          keyExtractor={(item) => item.id}
          pagingEnabled
          snapToAlignment="center"
          scrollEnabled={commentsVideoId === null}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{
            itemVisiblePercentThreshold: 50,
          }}
          scrollEventThrottle={16}
          decelerationRate="fast"
          ListFooterComponent={
            isLoading && videos.length > 0 ? (
              <View
                style={{
                  height: 100,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <ActivityIndicator size="large" color="#FF6B6B" />
              </View>
            ) : null
          }
        />
      )}

      {/* Comments Modal */}
      <Modal
        visible={commentsVideoId !== null}
        animationType="slide"
        transparent={false}
      >
        <CommentsScreen
          videoId={commentsVideoId || ''}
          onClose={() => setCommentsVideoId(null)}
        />
      </Modal>
    </View>
  );
}

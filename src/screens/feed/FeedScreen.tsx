import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useFeedStore } from '@/store';
import { videoService } from '@/services';

export default function FeedScreen({ navigation }: any) {
  const { videos, setVideos, isLoading, setIsLoading, hasMore } = useFeedStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    setIsLoading(true);
    try {
      const response = await videoService.getFeed(1, 20);
      setVideos(response.videos);
    } catch (error) {
      console.error('Feed error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await videoService.getFeed(1, 20);
      setVideos(response.videos);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading && videos.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#000' }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B6B" />}
    >
      <View style={{ paddingVertical: 10 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 20 }}>
          Feed
        </Text>
        {/* Video cards will go here */}
        {videos.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ color: '#999' }}>No videos yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

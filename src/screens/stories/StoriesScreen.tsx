import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoryPlayer } from '@/components/StoryPlayer';
import { storiesService } from '@/services';
import { Story } from '@/types/stories';

const { width } = Dimensions.get('window');

export default function StoriesScreen() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setIsLoading(true);
      const data = await storiesService.getStoriesFeed();
      setStories(data);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoryViewed = async (storyId: string) => {
    try {
      await storiesService.markStoryAsViewed(storyId);
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  };

  const selectedStory = stories.find((s) => s.id === selectedStoryId);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 12,
          paddingBottom: 12,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
          Stories
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      ) : stories.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999', fontSize: 16 }}>No stories available</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom }}
        >
          {stories.map((story) => (
            <TouchableOpacity
              key={story.id}
              onPress={() => {
                setSelectedStoryId(story.id);
                handleStoryViewed(story.id);
              }}
              activeOpacity={0.7}
              style={{ marginBottom: 12 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#1a1a1a',
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: story.viewed ? 0 : 2,
                  borderColor: story.viewed ? 'transparent' : '#FF6B6B',
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#FF6B6B',
                    marginRight: 12,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    {story.username}
                  </Text>
                  <Text style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    {story.createdAt}
                  </Text>
                </View>
                {!story.viewed && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#FF6B6B',
                    }}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Story Modal */}
      <Modal
        visible={selectedStoryId !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setSelectedStoryId(null)}
      >
        {selectedStory && (
          <StoryPlayer
            story={selectedStory}
            onClose={() => setSelectedStoryId(null)}
            onNextStory={() => {
              const currentIndex = stories.findIndex((s) => s.id === selectedStoryId);
              if (currentIndex < stories.length - 1) {
                setSelectedStoryId(stories[currentIndex + 1].id);
              } else {
                setSelectedStoryId(null);
              }
            }}
            onPreviousStory={() => {
              const currentIndex = stories.findIndex((s) => s.id === selectedStoryId);
              if (currentIndex > 0) {
                setSelectedStoryId(stories[currentIndex - 1].id);
              }
            }}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

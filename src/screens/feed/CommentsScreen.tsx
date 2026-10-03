import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { commentsService } from '@/services';
import { Comment } from '@/types';
import { formatRelativeTime } from '@/utils';

export interface CommentsScreenProps {
  videoId: string;
  onClose?: () => void;
}

const CommentItem: React.FC<{
  comment: Comment;
  onReply?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
}> = ({ comment, onReply, onLike }) => {
  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
      }}
    >
      {/* Comment Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <View>
          <Text style={{ color: '#fff', fontWeight: '600', marginBottom: 2 }}>
            User Name
          </Text>
          <Text style={{ color: '#999', fontSize: 12 }}>
            {formatRelativeTime(new Date(comment.createdAt))}
          </Text>
        </View>
      </View>

      {/* Comment Content */}
      <Text style={{ color: '#fff', fontSize: 14, marginBottom: 12, lineHeight: 20 }}>
        {comment.content}
      </Text>

      {/* Comment Actions */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={() => onLike?.(comment.id)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text>❤️</Text>
          <Text style={{ color: '#999', fontSize: 12 }}>{comment.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onReply?.(comment.id)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        >
          <Text style={{ color: '#FF6B6B', fontSize: 12 }}>Reply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const CommentsScreen: React.FC<CommentsScreenProps> = ({ videoId, onClose }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [posting, setPosting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    if (!hasMore || loading) return;

    setLoading(true);
    try {
      const response = await commentsService.getComments(videoId, page, 20);
      
      if (page === 1) {
        setComments(response.comments);
      } else {
        setComments((prev) => [...prev, ...response.comments]);
      }

      setHasMore(response.hasMore);
      setPage(page + 1);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!text.trim() || posting) return;

    setPosting(true);
    try {
      const newComment = await commentsService.addComment(videoId, text);
      setComments((prev) => [newComment, ...prev]);
      setText('');
      inputRef.current?.blur();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setPosting(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await commentsService.likeComment(videoId, commentId);
      // Update comment likes
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likes: c.likes + 1 } : c
        )
      );
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#1a1a1a',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Comments ({comments.length})
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: '#FF6B6B', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Comments List */}
        {loading && comments.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={({ item }) => (
              <CommentItem
                comment={item}
                onLike={handleLikeComment}
              />
            )}
            keyExtractor={(item) => item.id}
            onEndReached={() => loadComments()}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#999' }}>No comments yet</Text>
              </View>
            }
            ListFooterComponent={
              loading && comments.length > 0 ? (
                <ActivityIndicator size="small" color="#FF6B6B" style={{ marginVertical: 16 }} />
              ) : null
            }
          />
        )}

        {/* Comment Input */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderTopWidth: 1,
            borderTopColor: '#1a1a1a',
            flexDirection: 'row',
            gap: 8,
            alignItems: 'flex-end',
          }}
        >
          <TextInput
            ref={inputRef}
            style={{
              flex: 1,
              backgroundColor: '#1a1a1a',
              color: '#fff',
              padding: 12,
              borderRadius: 8,
              fontSize: 14,
              maxHeight: 100,
            }}
            placeholder="Add a comment..."
            placeholderTextColor="#666"
            value={text}
            onChangeText={setText}
            multiline
            editable={!posting}
          />
          <TouchableOpacity
            onPress={handlePostComment}
            disabled={!text.trim() || posting}
            style={{
              backgroundColor: posting ? '#FF6B6B80' : '#FF6B6B',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: '600' }}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CommentsScreen;

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
  ActionSheetIOS,
} from 'react-native';
import { messagesService } from '@/services/messages';
import { useChatStore } from '@/store/chatStore';
import { MessageBubble } from '@/components/MessageBubble';
import { Message, Conversation } from '@/types/messages';
import * as ImagePicker from 'expo-image-picker';

export interface ChatScreenProps {
  conversationId: string;
  otherUser?: { id: string; name: string; avatar?: string };
  onClose?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  conversationId,
  otherUser,
  onClose,
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    messages: messagesMap,
    setMessages,
    addMessage,
    updateMessage,
    activeConversation,
    typingUsers,
    setActiveConversation,
    isLoadingMessages,
    setIsLoadingMessages,
  } = useChatStore();

  const messages = messagesMap.get(conversationId) || [];
  const currentUserId = 'currentUserId'; // TODO: Get from auth store

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  const loadMessages = async () => {
    if (isLoadingMessages) return;

    setIsLoadingMessages(true);
    setLoading(true);

    try {
      const response = await messagesService.getMessages(conversationId, 1, 50);
      setMessages(conversationId, response.messages.reverse());
      setHasMore(response.hasMore);
      setPage(1);

      // Mark as read
      if (response.messages.length > 0) {
        const latestMessage = response.messages[response.messages.length - 1];
        if (latestMessage.senderId !== currentUserId) {
          await messagesService.markAsRead(conversationId, latestMessage.id);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
      setLoading(false);
      scrollToBottom();
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || loading || isLoadingMessages) return;

    setLoading(true);

    try {
      const response = await messagesService.getMessages(conversationId, page + 1, 50);
      const existingMessages = messagesMap.get(conversationId) || [];
      setMessages(conversationId, [...response.messages.reverse(), ...existingMessages]);
      setHasMore(response.hasMore);
      setPage(page + 1);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return;

    const messageText = message;
    setMessage('');
    setSending(true);

    try {
      // Optimistic update
      const tempMessage: Message = {
        id: Math.random().toString(36),
        conversationId,
        senderId: currentUserId,
        recipientId: otherUser?.id || '',
        type: 'text',
        content: messageText,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addMessage(conversationId, tempMessage);
      scrollToBottom();

      // Send to server
      const sentMessage = await messagesService.sendMessage(conversationId, messageText, 'text');
      updateMessage(conversationId, tempMessage.id, sentMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      // Rollback optimistic update
    } finally {
      setSending(false);
    }
  };

  const handleTyping = () => {
    messagesService.sendTypingIndicator(conversationId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      messagesService.sendTypingIndicator(conversationId, false);
    }, 2000);
  };

  const handleAttachMedia = async () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Cancel', 'Photo', 'Video'],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (buttonIndex === 1) {
          // Photo
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
          });

          if (!result.canceled) {
            setSending(true);
            try {
              const sentMessage = await messagesService.sendMediaMessage(
                conversationId,
                result.assets[0].uri,
                'image'
              );
              addMessage(conversationId, sentMessage);
              scrollToBottom();
            } catch (error) {
              console.error('Error sending image:', error);
            } finally {
              setSending(false);
            }
          }
        } else if (buttonIndex === 2) {
          // Video
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
          });

          if (!result.canceled) {
            setSending(true);
            try {
              const sentMessage = await messagesService.sendMediaMessage(
                conversationId,
                result.assets[0].uri,
                'video',
                { duration: result.assets[0].duration }
              );
              addMessage(conversationId, sentMessage);
              scrollToBottom();
            } catch (error) {
              console.error('Error sending video:', error);
            } finally {
              setSending(false);
            }
          }
        }
      }
    );
  };

  const handleSendSnapchatStyle = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setSending(true);
      try {
        const sentMessage = await messagesService.sendSnapchatStyleMessage(
          conversationId,
          result.assets[0].uri,
          10, // 10 seconds
          true // Delete after view
        );
        addMessage(conversationId, sentMessage);
        scrollToBottom();
      } catch (error) {
        console.error('Error sending snapchat style message:', error);
      } finally {
        setSending(false);
      }
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message; index: number }) => {
    const isOwn = item.senderId === currentUserId;
    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        onLongPress={(messageId) => {
          // Show message options
        }}
      />
    );
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
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
              {otherUser?.name || 'Chat'}
            </Text>
            {typingUsers.size > 0 && (
              <Text style={{ color: '#FF6B6B', fontSize: 12 }}>typing...</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: '#FF6B6B', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        {loading && messages.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#999' }}>No messages yet</Text>
              </View>
            }
            ListFooterComponent={
              loading ? (
                <ActivityIndicator size="small" color="#FF6B6B" style={{ marginVertical: 16 }} />
              ) : null
            }
          />
        )}

        {/* Input Area */}
        <View
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderTopWidth: 1,
            borderTopColor: '#1a1a1a',
            flexDirection: 'row',
            gap: 8,
            alignItems: 'flex-end',
          }}
        >
          <TouchableOpacity
            onPress={handleAttachMedia}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FF6B6B',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>📎</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSendSnapchatStyle}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FF6B6B40',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 18 }}>👻</Text>
          </TouchableOpacity>

          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#1a1a1a',
              color: '#fff',
              padding: 12,
              borderRadius: 20,
              fontSize: 14,
              maxHeight: 100,
            }}
            placeholder="Message..."
            placeholderTextColor="#666"
            value={message}
            onChangeText={(text) => {
              setMessage(text);
              handleTyping();
            }}
            multiline
            editable={!sending}
          />

          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!message.trim() || sending}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: message.trim() ? '#FF6B6B' : '#FF6B6B40',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ fontSize: 18 }}>▶</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

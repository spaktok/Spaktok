import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LiveStream, LiveStreamMessage } from '@/types/live';
import { liveService } from '@/services/live';

interface LiveStreamPlayerProps {
  stream: LiveStream;
  isHost?: boolean;
  onClose: () => void;
  onSendGift?: (giftId: string, quantity: number) => void;
  onFollow?: (userId: string) => void;
}

export const LiveStreamPlayer: React.FC<LiveStreamPlayerProps> = ({
  stream,
  isHost = false,
  onClose,
  onSendGift,
  onFollow,
}) => {
  const [messages, setMessages] = useState<LiveStreamMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewers, setViewers] = useState(stream.viewerCount);
  const scrollViewRef = useRef<ScrollView>(null);
  const messageRefreshInterval = useRef<NodeJS.Timeout>();
  const viewerCountInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadMessages();
    
    // Poll for new messages every 2 seconds
    messageRefreshInterval.current = setInterval(() => {
      loadMessages();
    }, 2000);

    // Update viewer count every 5 seconds
    viewerCountInterval.current = setInterval(() => {
      updateViewerCount();
    }, 5000);

    return () => {
      if (messageRefreshInterval.current) clearInterval(messageRefreshInterval.current);
      if (viewerCountInterval.current) clearInterval(viewerCountInterval.current);
    };
  }, [stream.id]);

  const loadMessages = async () => {
    try {
      const newMessages = await liveService.getChatMessages(stream.id, 50);
      setMessages(newMessages);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const updateViewerCount = async () => {
    try {
      const count = await liveService.getViewerCount(stream.id);
      setViewers(count);
    } catch (error) {
      console.error('Failed to update viewer count:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      setIsLoading(true);
      await liveService.sendChatMessage(stream.id, messageInput);
      setMessageInput('');
      loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {/* Video Area */}
        <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#000',
            }}
          >
            {/* Placeholder for Agora video stream */}
            <Text style={{ color: '#fff', fontSize: 14 }}>
              Live Stream Video Area
            </Text>
          </View>

          {/* Stream Header */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: 'rgba(0,0,0,0.3)',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#FF6B6B',
                  marginRight: 6,
                }}
              />
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>LIVE</Text>
            </View>
            <Text style={{ color: '#fff', fontSize: 12 }}>{viewers.toLocaleString()} viewers</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Stream Info Overlay */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, marginBottom: 4 }}>
              {stream.broadcaster.displayName}
            </Text>
            <Text
              numberOfLines={1}
              style={{ color: '#ccc', fontSize: 12 }}
            >
              {stream.title}
            </Text>
          </View>
        </View>

        {/* Chat & Actions Sidebar */}
        <View style={{ width: 280, backgroundColor: '#000', borderLeftWidth: 1, borderLeftColor: '#1a1a1a', flexDirection: 'column' }}>
          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1, padding: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <View key={msg.id} style={{ marginBottom: 12 }}>
                {msg.type === 'text' ? (
                  <>
                    <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '600' }}>
                      {msg.user.displayName}
                    </Text>
                    <Text style={{ color: '#ccc', fontSize: 12, marginTop: 2 }}>
                      {msg.message}
                    </Text>
                  </>
                ) : msg.type === 'gift' ? (
                  <View
                    style={{
                      backgroundColor: '#FF6B6B20',
                      borderRadius: 8,
                      padding: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: '#FF6B6B',
                    }}
                  >
                    <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '600' }}>
                      {msg.user.displayName} sent {msg.giftData?.giftName}
                    </Text>
                    <Text style={{ color: '#ccc', fontSize: 11, marginTop: 2 }}>
                      Qty: {msg.giftData?.quantity} • Value: ₨{msg.giftData?.giftValue}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>

          {/* Input Area */}
          <View style={{ paddingHorizontal: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: '#1a1a1a' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#1a1a1a',
                borderRadius: 20,
                paddingHorizontal: 12,
                marginBottom: 8,
              }}
            >
              <TextInput
                style={{ flex: 1, color: '#fff', paddingVertical: 8, paddingHorizontal: 4 }}
                placeholder="Say something..."
                placeholderTextColor="#666"
                value={messageInput}
                onChangeText={setMessageInput}
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={isLoading || !messageInput.trim()}
              >
                <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '600' }}>Send</Text>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {!isHost && (
                <>
                  <TouchableOpacity
                    onPress={() => onFollow?.(stream.broadcaster.id)}
                    style={{
                      flex: 1,
                      backgroundColor: '#FF6B6B',
                      borderRadius: 8,
                      paddingVertical: 8,
                      alignItems: 'center',
                      marginRight: 6,
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                      Follow
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onSendGift?.('default', 1)}
                    style={{
                      flex: 1,
                      backgroundColor: '#1a1a1a',
                      borderRadius: 8,
                      paddingVertical: 8,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#FF6B6B',
                    }}
                  >
                    <Text style={{ color: '#FF6B6B', fontWeight: '600', fontSize: 12 }}>
                      🎁 Gift
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

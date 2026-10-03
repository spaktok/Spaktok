import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Gift } from '@/types/payments';
import { paymentService } from '@/services/payment';

interface GiftSelectorProps {
  visible: boolean;
  recipientId: string;
  streamId?: string;
  videoId?: string;
  storyId?: string;
  onSelect: (gift: Gift, quantity: number) => void;
  onClose: () => void;
}

export const GiftSelector: React.FC<GiftSelectorProps> = ({
  visible,
  recipientId,
  streamId,
  videoId,
  storyId,
  onSelect,
  onClose,
}) => {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<'all' | 'common' | 'rare'>('all');

  useEffect(() => {
    if (visible) {
      loadGifts();
    }
  }, [visible]);

  const loadGifts = async () => {
    try {
      setIsLoading(true);
      const data = await paymentService.getGifts();
      setGifts(data);
    } catch (error) {
      console.error('Failed to load gifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendGift = async () => {
    if (!selectedGift) return;

    try {
      const qty = parseInt(quantity) || 1;
      await paymentService.sendGift(
        selectedGift.id,
        recipientId,
        qty,
        message || undefined,
        streamId,
        videoId,
        storyId
      );
      onSelect(selectedGift, qty);
      handleClose();
    } catch (error) {
      console.error('Failed to send gift:', error);
    }
  };

  const handleClose = () => {
    setSelectedGift(null);
    setQuantity('1');
    setMessage('');
    onClose();
  };

  const filteredGifts = gifts.filter((gift) => {
    if (filter === 'all') return true;
    return gift.displayRarity === filter;
  });

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: '#999',
      uncommon: '#66BB6A',
      rare: '#42A5F5',
      epic: '#AB47BC',
      legendary: '#FFD54F',
    };
    return colors[rarity] || '#999';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#1a1a1a',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>
            Send a Gift
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: '600' }}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View
          style={{
            flexDirection: 'row',
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 8,
          }}
        >
          {(['all', 'common', 'rare'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setFilter(tab)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: filter === tab ? '#FF6B6B' : '#1a1a1a',
              }}
            >
              <Text
                style={{
                  color: filter === tab ? '#fff' : '#ccc',
                  fontSize: 12,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gifts Grid */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#FF6B6B" />
          </View>
        ) : (
          <FlatList
            data={filteredGifts}
            numColumns={3}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12 }}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setSelectedGift(item)}
                style={{
                  width: '31%',
                  backgroundColor: selectedGift?.id === item.id ? '#FF6B6B20' : '#1a1a1a',
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                  borderWidth: selectedGift?.id === item.id ? 2 : 1,
                  borderColor:
                    selectedGift?.id === item.id
                      ? '#FF6B6B'
                      : getRarityColor(item.displayRarity),
                }}
              >
                <View
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 8,
                    backgroundColor: getRarityColor(item.displayRarity) + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>🎁</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                  {item.name}
                </Text>
                <Text
                  style={{
                    color: getRarityColor(item.displayRarity),
                    fontSize: 11,
                    marginTop: 4,
                    fontWeight: '600',
                  }}
                >
                  ₨{item.price}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Selection Details */}
        {selectedGift && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#1a1a1a',
              paddingHorizontal: 16,
              paddingVertical: 16,
              backgroundColor: '#1a1a1a',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
              {selectedGift.name}
            </Text>
            <Text style={{ color: '#999', fontSize: 12, marginBottom: 12 }}>
              {selectedGift.description}
            </Text>

            <TextInput
              style={{
                backgroundColor: '#000',
                color: '#fff',
                padding: 10,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#333',
                marginBottom: 12,
                height: 80,
                textAlignVertical: 'top',
              }}
              placeholder="Add a message (optional)"
              placeholderTextColor="#666"
              value={message}
              onChangeText={setMessage}
              multiline
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                Quantity:
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setQuantity(Math.max(1, parseInt(quantity) - 1).toString())}
                >
                  <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '600' }}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={{
                    backgroundColor: '#000',
                    color: '#fff',
                    padding: 8,
                    borderRadius: 6,
                    borderWidth: 1,
                    borderColor: '#333',
                    width: 50,
                    textAlign: 'center',
                  }}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                />
                <TouchableOpacity
                  onPress={() => setQuantity((parseInt(quantity) + 1).toString())}
                >
                  <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '600' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <Text style={{ color: '#999', fontSize: 12 }}>Total Cost:</Text>
              <Text style={{ color: '#FF6B6B', fontSize: 18, fontWeight: 'bold' }}>
                ₨{(selectedGift.price * parseInt(quantity || 1)).toLocaleString()}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSendGift}
              style={{
                backgroundColor: '#FF6B6B',
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                Send Gift
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

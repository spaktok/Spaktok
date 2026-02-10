import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 20 }}>
        Spaktok
      </Text>
      <ActivityIndicator size="large" color="#FF6B6B" />
    </View>
  );
}

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

export default function OnboardingScreen({ navigation }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Welcome to Spaktok
      </Text>
      <Text style={{ color: '#999', fontSize: 16, marginBottom: 40, textAlign: 'center' }}>
        The ultimate social media platform combining the best of TikTok, Snapchat, and YouTube
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('Login')}
        style={{
          backgroundColor: '#FF6B6B',
          paddingVertical: 15,
          paddingHorizontal: 40,
          borderRadius: 8,
          marginBottom: 15,
          width: '100%',
        }}
      >
        <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
          Login
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
        style={{
          backgroundColor: '#1a1a1a',
          paddingVertical: 15,
          paddingHorizontal: 40,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#FF6B6B',
          width: '100%',
        }}
      >
        <Text style={{ color: '#FF6B6B', textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
          Create Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { authService } from '@/services';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <Text style={{ color: '#FF6B6B', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>

        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
          Reset Password
        </Text>

        {sent ? (
          <>
            <Text style={{ color: '#999', fontSize: 14, marginBottom: 20 }}>
              Check your email for password reset instructions
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={{
                backgroundColor: '#FF6B6B',
                padding: 15,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={{ color: '#999', fontSize: 14, marginBottom: 20 }}>
              Enter your email to receive password reset instructions
            </Text>

            <TextInput
              style={{
                backgroundColor: '#1a1a1a',
                color: '#fff',
                padding: 15,
                marginBottom: 20,
                borderRadius: 8,
                borderColor: '#333',
                borderWidth: 1,
              }}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
            />

            <TouchableOpacity
              onPress={handleReset}
              disabled={loading}
              style={{
                backgroundColor: '#FF6B6B',
                padding: 15,
                borderRadius: 8,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

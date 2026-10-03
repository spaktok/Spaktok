import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/utils/validation';
import { useAuth } from '@/hooks';

export default function LoginScreen({ navigation }: any) {
  const { loginUser, loading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const result = await loginUser(data);
    if (!result.success) {
      console.error('Login failed:', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <View style={{ marginBottom: 40 }}>
          <Text
            style={{
              color: '#FF6B6B',
              fontSize: 36,
              fontWeight: 'bold',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Spaktok
          </Text>
          <Text style={{ color: '#999', fontSize: 14, textAlign: 'center' }}>
            Welcome back to your social hub
          </Text>
        </View>

        {error && (
          <View
            style={{
              backgroundColor: '#FF6B6B20',
              borderWidth: 1,
              borderColor: '#FF6B6B',
              borderRadius: 8,
              padding: 12,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: '#FF6B6B', fontSize: 14 }}>{error}</Text>
            <TouchableOpacity onPress={clearError} style={{ marginTop: 8 }}>
              <Text style={{ color: '#FF6B6B', fontSize: 12, fontWeight: '600' }}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={{ marginBottom: 16 }}>
              <TextInput
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  padding: 15,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: errors.email ? '#FF6B6B' : '#333',
                  fontSize: 16,
                }}
                placeholder="Email"
                placeholderTextColor="#666"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                editable={!loading}
              />
              {errors.email && (
                <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4 }}>
                  {errors.email.message}
                </Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={{ marginBottom: 24 }}>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    padding: 15,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: errors.password ? '#FF6B6B' : '#333',
                    fontSize: 16,
                  }}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPassword}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 15, top: 15 }}
                >
                  <Text style={{ color: '#FF6B6B', fontSize: 14 }}>
                    {showPassword ? 'Hide' : 'Show'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4 }}>
                  {errors.password.message}
                </Text>
              )}
            </View>
          )}
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ marginBottom: 24 }}>
          <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '600' }}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#FF6B6B80' : '#FF6B6B',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 50,
            marginBottom: 20,
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: '#999', fontSize: 14 }}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '600' }}>Register</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

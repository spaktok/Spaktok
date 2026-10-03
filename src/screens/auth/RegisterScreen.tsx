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
  Linking,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/utils/validation';
import { useAuth } from '@/hooks';

export default function RegisterScreen({ navigation }: any) {
  const { registerUser, loading, error, clearError } = useAuth();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    if (!agreedToTerms) {
      return;
    }
    const result = await registerUser(data);
    if (!result.success) {
      console.error('Registration failed:', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#000' }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <Text style={{ color: '#FF6B6B', fontSize: 16, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>

        <View style={{ marginBottom: 30 }}>
          <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 8 }}>
            Create Account
          </Text>
          <Text style={{ color: '#999', fontSize: 14 }}>Join Spaktok today</Text>
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
          </View>
        )}

        <Controller
          control={control}
          name="displayName"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  padding: 15,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: errors.displayName ? '#FF6B6B' : '#333',
                }}
                placeholder="Full Name"
                placeholderTextColor="#666"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!loading}
              />
              {errors.displayName && (
                <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4 }}>
                  {errors.displayName.message}
                </Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  padding: 15,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: errors.username ? '#FF6B6B' : '#333',
                }}
                placeholder="Username"
                placeholderTextColor="#666"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!loading}
              />
              {errors.username && (
                <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4 }}>
                  {errors.username.message}
                </Text>
              )}
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={{ marginBottom: 12 }}>
              <TextInput
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  padding: 15,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: errors.email ? '#FF6B6B' : '#333',
                }}
                placeholder="Email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
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
            <View style={{ marginBottom: 12 }}>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    padding: 15,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: errors.password ? '#FF6B6B' : '#333',
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

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={{ marginBottom: 20 }}>
              <TextInput
                style={{
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  padding: 15,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: errors.confirmPassword ? '#FF6B6B' : '#333',
                }}
                placeholder="Confirm Password"
                placeholderTextColor="#666"
                secureTextEntry
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!loading}
              />
              {errors.confirmPassword && (
                <Text style={{ color: '#FF6B6B', fontSize: 12, marginTop: 4 }}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>
          )}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            style={{
              width: 20,
              height: 20,
              borderWidth: 2,
              borderColor: agreedToTerms ? '#FF6B6B' : '#333',
              borderRadius: 4,
              marginRight: 10,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: agreedToTerms ? '#FF6B6B' : 'transparent',
            }}
          >
            {agreedToTerms && <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>✓</Text>}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#999', fontSize: 12 }}>
              I agree to the{' '}
              <Text
                style={{ color: '#FF6B6B' }}
                onPress={() => Linking.openURL('https://spaktok.com/terms')}
              >
                Terms of Service
              </Text>
              {' and '}
              <Text
                style={{ color: '#FF6B6B' }}
                onPress={() => Linking.openURL('https://spaktok.com/privacy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={loading || !agreedToTerms}
          style={{
            backgroundColor: loading || !agreedToTerms ? '#FF6B6B80' : '#FF6B6B',
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
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#999', fontSize: 14 }}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={{ color: '#FF6B6B', fontSize: 14, fontWeight: '600' }}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

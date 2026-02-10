import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RootNavigator from '@/navigation/RootNavigator';
import { useAuthStore } from '@/store';
import SplashScreen from '@/screens/SplashScreen';

export default function App() {
  const insets = useSafeAreaInsets();
  const { isLoading, hydrateAuth } = useAuthStore();

  useEffect(() => {
    hydrateAuth();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

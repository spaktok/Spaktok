import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUIStore } from '@/store';

// Tab screens
import FeedScreen from '@/screens/feed/FeedScreen';
import ReelsScreen from '@/screens/reels/ReelsScreen';
import CreateScreen from '@/screens/create/CreateScreen';
import MessagesScreen from '@/screens/messages/MessagesScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

// Detail screens
import VideoDetailScreen from '@/screens/feed/VideoDetailScreen';
import ChatScreen from '@/screens/messages/ChatScreen';
import UserProfileScreen from '@/screens/profile/UserProfileScreen';

const Tab = createBottomTabNavigator();
const FeedStack = createNativeStackNavigator();
const ReelsStack = createNativeStackNavigator();
const MessagesStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function FeedStackNavigator() {
  return (
    <FeedStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' },
      }}
    >
      <FeedStack.Screen name="FeedList" component={FeedScreen} />
      <FeedStack.Screen name="VideoDetail" component={VideoDetailScreen} />
      <FeedStack.Screen name="UserProfile" component={UserProfileScreen} />
    </FeedStack.Navigator>
  );
}

function ReelsStackNavigator() {
  return (
    <ReelsStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' },
      }}
    >
      <ReelsStack.Screen name="ReelsList" component={ReelsScreen} />
      <ReelsStack.Screen name="VideoDetail" component={VideoDetailScreen} />
    </ReelsStack.Navigator>
  );
}

function MessagesStackNavigator() {
  return (
    <MessagesStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' },
      }}
    >
      <MessagesStack.Screen name="MessagesList" component={MessagesScreen} />
      <MessagesStack.Screen name="Chat" component={ChatScreen} />
    </MessagesStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#000' },
      }}
    >
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="UserProfile" component={UserProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export default function MainNavigator() {
  const { selectedTab, setSelectedTab } = useUIStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopColor: '#222',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#888',
        tabBarShowLabel: false,
      }}
      sceneContainerStyle={{ backgroundColor: '#000' }}
    >
      <Tab.Screen
        name="FeedTab"
        component={FeedStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            // Icon component here
            <></>
          ),
        }}
      />
      <Tab.Screen
        name="ReelsTab"
        component={ReelsStackNavigator}
        options={{
          tabBarLabel: 'Reels',
          tabBarIcon: ({ color, size }) => <></>,
        }}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreateScreen}
        options={{
          tabBarLabel: 'Create',
          tabBarIcon: ({ color, size }) => <></>,
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStackNavigator}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color, size }) => <></>,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <></>,
        }}
      />
    </Tab.Navigator>
  );
}

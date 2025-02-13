import { Text, View, Pressable } from "react-native";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from "react";
import { TokenResponse } from "expo-auth-session";
import { getUserId, getUserIds, updateUser, authenticateUser, checkProfileComplete } from '../services/api';
import OnboardingScreen from "./components/onboardingScreen";
import SwipingScreen from './components/swipingScreen';
import { SegmentedButtons } from 'react-native-paper';
import MessagingScreen from './components/messagingScreen';
import SocketProvider from "./contexts/SocketContext";

WebBrowser.maybeCompleteAuthSession();

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}


export default function Index() {
  const [userInfo, setUserInfo] = useState<TokenResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState('swipe');

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (response?.type === 'success') { 
        setUserInfo(response?.authentication);
        getUserInfo(response.authentication?.accessToken ?? '');
      }
    };
    fetchData();
  }, [response]);

  const handleUserAuthentication = async (user: UserProfile) => {
    try {
      const userData = {
        email: user.email,
        name: user.name,
        picture: user.picture
      };
      const authenticatedUser = await authenticateUser(userData);
      setUserId(authenticatedUser.id);
      
      // Check if profile is complete
      const profileStatus = await checkProfileComplete(authenticatedUser.id);
      setIsProfileComplete(profileStatus.isComplete);
      
      console.log('User authenticated:', authenticatedUser);
      return authenticatedUser;
    } catch (error) {
      console.error('Error authenticating user:', error);
    }
  };

  const getUserInfo = async (token: string) => {
    try {
      const response = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const user = await response.json();
      setUserProfile(user);
      await handleUserAuthentication(user);
    } catch (error) {
      console.log("Error fetching user profile:", error);
    }
  };

  const renderMainContent = () => {
    if (!userProfile) {
      return (
        <Pressable
          onPress={() => promptAsync()}
          style={{
            backgroundColor: '#4285F4',
            padding: 16,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Sign in with Google
          </Text>
        </Pressable>
      );
    }

    if (userId && !isProfileComplete) {
      return (
        <View style={{ flex: 1, width: '100%' }}>
          <Text style={{ textAlign: 'center', marginBottom: 20 }}>
            Complete your profile to start matching!
          </Text>
          <OnboardingScreen
            name={userProfile.name}
            userId={userId}
            onComplete={async (profileData) => {
              console.log('Profile data:', profileData);
              await updateUser(userId, {
                id: userId,
                name: userProfile.name,
                email: userProfile.email,
                picture: userProfile.picture,
                bio: profileData.bio,
                interests: profileData.preference,
                mainPicture: profileData.image,
                age: Number(profileData.age),
                gender: profileData.gender
              });
              setIsProfileComplete(true);
            }}
          />
        </View>
      );
    }

    return (
      <View style={{ flex: 1, width: '100%' }}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'swipe', label: 'Swipe' },
            { value: 'messages', label: 'Messages' },
          ]}
          style={{ margin: 12 }}
        />
        {activeTab === 'swipe' ? (
          <SwipingScreen userId={userId!} />
        ) : (
          <MessagingScreen userId={userId!} />
        )}
      </View>
    );
  };

  return (
        <SocketProvider>
    
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {renderMainContent()}
    </View>
    </SocketProvider>
  );
}

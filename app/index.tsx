import { Text, View, Pressable } from "react-native";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from "react";
import { TokenResponse } from "expo-auth-session";
import { getUserId, getUserIds, updateUser, authenticateUser } from '../services/api';
import Card from "./components/tinderCard";
import OnboardingScreen from "./components/onboardingScreen";

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

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      {!userProfile ? (
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
      ) : (
        <OnboardingScreen
          name={userProfile.name}
          userId={userId!}
          onComplete={async (profileData) => {
            if (!userId) {
              console.error('No user ID available');
              return;
            }
            console.log('Profile data:', profileData);
            updateUser(userId, {
              id: userId,
              name: userProfile.name,
              email: userProfile.email,
              picture: userProfile.picture,
              bio: profileData.bio,
              interests: profileData.preference,
              mainPicture: profileData.image,
              age: Number(profileData.age)
            });
          }}
        />
      )}
    </View>
  );
}

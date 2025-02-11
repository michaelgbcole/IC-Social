import { Text, View, Pressable } from "react-native";
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useState } from "react";
import { TokenResponse } from "expo-auth-session";
import { getUserIds, saveUser } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export default function Index() {
  const [userInfo, setUserInfo] = useState<TokenResponse | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userIds, setUserIds] = useState<string[]>([]);

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
        try {
          const ids = await getUserIds();
          setUserIds(ids);
          console.log('User IDs fetched successfully:', ids);
        } catch (error) {
          console.error('Error fetching user IDs:', error);
        }
      }
    };
    fetchData();
  }, [response]);

  const saveUserToDatabase = async (user: UserProfile) => {
    try {
      const userData = {
        email: user.email,
        name: user.name,
        picture: user.picture
      };
      const savedUser = await saveUser(userData);
      console.log('User saved successfully:', savedUser);
    } catch (error) {
      console.error('Error saving user to database:', error);
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
      await saveUserToDatabase(user);
    } catch (error) {
      console.log("Error fetching user profile:", error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
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

      {userProfile && (
        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
            Welcome, {userProfile.name}!
          </Text>
          <Text style={{ fontSize: 16, color: 'gray' }}>
            User IDs: {userIds}
          </Text>
        </View>
      )}
    </View>
  );
}

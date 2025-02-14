import { Text, View, Pressable, Image, StyleSheet } from "react-native";
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
import LoadingScreen from './components/LoadingScreen';
import { COLORS } from './theme';

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
  const [isInitializing, setIsInitializing] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    const initializeApp = async () => {
      setIsInitializing(true);
      try {
        if (response?.type === 'success') {
          setUserInfo(response.authentication);
          await getUserInfo(response.authentication?.accessToken ?? '');
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
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
    if (isInitializing) {
      return <LoadingScreen />;
    }

    if (!userProfile) {
      return (
        <View style={styles.authContainer}>
          <Image 
            source={require('../assets/images/IC-logo.png')} 
            style={styles.authLogo}
          />
          <Text style={styles.welcomeText}>Welcome to IC Social</Text>
          <Pressable
            onPress={() => promptAsync()}
            style={styles.googleButton}
          >
            <Text style={styles.googleButtonText}>
              Sign in with Google
            </Text>
          </Pressable>
        </View>
      );
    }

    if (!isProfileComplete) {
      return (
        <View style={styles.container}>
          <OnboardingScreen
            name={userProfile.name}
            userId={userId!}
            onComplete={async (profileData) => {
              await updateUser(userId!, {
                id: userId!,
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
            {
              value: 'swipe',
              label: 'Swipe',
              style: styles.segmentButton,
              checkedColor: COLORS.primary,
            },
            {
              value: 'messages',
              label: 'Messages',
              style: styles.segmentButton,
              checkedColor: COLORS.primary,
            },
          ]}
          style={styles.segmentedButtons}
          theme={{
            colors: {
              secondaryContainer: COLORS.primary + '20', // Add 20% opacity
              onSecondaryContainer: COLORS.primary,
            }
          }}
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
      <View style={styles.container}>
        {renderMainContent()}
      </View>
    </SocketProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
  },
  authLogo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 30,
  },
  googleButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    elevation: 4,
  },
  googleButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  segmentedButtons: {
    margin: 12,
  },
  segmentButton: {
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
});

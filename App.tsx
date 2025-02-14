import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { theme, navigationTheme } from './app/theme';
import SocketProvider from './app/contexts/SocketContext';
import Index from './app/index';
import { StatusBar } from 'expo-status-bar';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <PaperProvider theme={theme}>
        <StatusBar backgroundColor={theme.colors.primary} style="light" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Root" component={WrappedIndex} />
        </Stack.Navigator>
      </PaperProvider>
    </NavigationContainer>
  );
}

const WrappedIndex = () => (
  <SocketProvider>
    <Index />
  </SocketProvider>
);

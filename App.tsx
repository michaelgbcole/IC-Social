import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { theme, navigationTheme } from './app/theme';
import SocketProvider from './app/contexts/SocketContext';
import Index from './app/index';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  return (
    <NavigationContainer theme={navigationTheme}>
      <PaperProvider theme={theme}>
        <StatusBar backgroundColor={theme.colors.primary} style="light" />
        <SocketProvider>
          <Index />
        </SocketProvider>
      </PaperProvider>
    </NavigationContainer>
  );
}

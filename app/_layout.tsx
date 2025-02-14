import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from './theme';

export default function Layout() {
  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

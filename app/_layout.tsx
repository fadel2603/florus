import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import {
  GasoekOne_400Regular,
} from '@expo-google-fonts/gasoek-one';
import {
  Gabarito_400Regular,
  Gabarito_500Medium,
  Gabarito_600SemiBold,
  Gabarito_700Bold,
} from '@expo-google-fonts/gabarito';
import {
  Urbanist_400Regular,
  Urbanist_500Medium,
  Urbanist_600SemiBold,
  Urbanist_700Bold,
} from '@expo-google-fonts/urbanist';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    GasoekOne_400Regular,
    Gabarito_400Regular,
    Gabarito_500Medium,
    Gabarito_600SemiBold,
    Gabarito_700Bold,
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="plant/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="scan-result" options={{ presentation: 'card' }} />
        <Stack.Screen name="recommendation" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add-plant/camera" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="add-plant/analyzing" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="add-plant/result" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="profile" options={{ presentation: 'card' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
});

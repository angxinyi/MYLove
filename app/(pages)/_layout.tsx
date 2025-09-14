import { Stack } from 'expo-router';

export default function PagesLayout() {
  return (
    <Stack>
      <Stack.Screen name="pairing" options={{ headerShown: false }} />
      <Stack.Screen name="pairing-enter-code" options={{ headerShown: false }} />
      <Stack.Screen name="pairing-anniversary" options={{ headerShown: false }} />
    </Stack>
  );
}
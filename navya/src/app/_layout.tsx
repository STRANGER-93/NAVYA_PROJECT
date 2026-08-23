import { Stack } from "expo-router";
import { ProfileProvider } from "../features/profile/ProfileContext";
import { MoodHistoryProvider } from "../features/mood/MoodHistoryContext";
import { JournalProvider } from "../features/journal/JournalContext";
import { CycleProvider } from "../features/cycle/CycleContext";
import { AuthProvider } from "../features/auth/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
    <ProfileProvider>
    <CycleProvider>
    <MoodHistoryProvider>
    <JournalProvider>
    <Stack screenOptions={{ headerShown: false }}>

      <Stack.Screen name="index" />

      <Stack.Screen name="onboarding" />

      <Stack.Screen name="login" />

      <Stack.Screen name="signup" />

      <Stack.Screen name="forgot-password" />

      <Stack.Screen name="setup" />

      <Stack.Screen name="setup-complete" />

      <Stack.Screen name="dashboard" />

      <Stack.Screen name="cycle" />

      <Stack.Screen name="notifications" />

      <Stack.Screen name="profile" />

      <Stack.Screen name="edit-profile" />

      <Stack.Screen name="mood" />

      <Stack.Screen name="mood-result" />

      <Stack.Screen name="mood-activity" />

      <Stack.Screen name="journal-editor" />

      <Stack.Screen name="journal" />

      <Stack.Screen name="journal-detail" />

    </Stack>
    </JournalProvider>
    </MoodHistoryProvider>
    </CycleProvider>
    </ProfileProvider>
    </AuthProvider>
  );
}

import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

import ScreenContainer from "../components/ScreenContainer";
import Logo from "../components/Logo";
import PageIndicator from "../components/PageIndicator";
import splashStyles from "../styles/splashStyles";
import { useAuth } from "../features/auth/AuthContext";

export default function SplashScreen() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const handleContinue = () => {
    if (loading) return;
    if (session?.setupCompleted) router.replace("/dashboard");
    else if (session) router.replace("/setup");
    else router.replace("/onboarding");
  };

  return (
    <ScreenContainer>
      <Pressable
        style={splashStyles.container}
        onPress={handleContinue}
      >
        {/* Top Section */}
        <View style={splashStyles.top}>
          <Logo />

          <Text style={splashStyles.title}>
            NAVYA
          </Text>

          <Text style={splashStyles.subtitle}>
            UNDERSTAND YOUR CYCLE.{"\n"}
            CARE FOR YOUR MIND.
          </Text>
        </View>

        {/* Page Indicator */}
        <View style={splashStyles.middle}>
          <PageIndicator />
        </View>

        {/* Bottom Text */}
        <View style={splashStyles.bottom}>
          <Text style={splashStyles.tap}>
            Tap to continue
          </Text>
        </View>
      </Pressable>
    </ScreenContainer>
  );
}

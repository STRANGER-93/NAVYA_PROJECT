import React from "react";
import {
  View,
  Text,
  Image,
} from "react-native";

import onboardingStyles from "../styles/onboardingStyles";

import SkipButton from "./SkipButton";
import OnboardingIndicator from "./OnboardingIndicator";
import OnboardingButton from "./OnboardingButton";

import { OnboardingItem } from "../constants/onboardingData";

type Props = {
  item: OnboardingItem;
  currentIndex: number;
  totalPages: number;
  onNext: () => void;
  onSkip: () => void;
  onLogin: () => void;
};

export default function OnboardingCard({
  item,
  currentIndex,
  totalPages,
  onNext,
  onSkip,
  onLogin,
}: Props) {
  return (
    <View style={onboardingStyles.container}>
      <View style={onboardingStyles.skipContainer}>
        <SkipButton onPress={onSkip} />
      </View>

      <View style={onboardingStyles.imageContainer}>
        <Image
          source={item.image}
          style={onboardingStyles.image}
          resizeMode="contain"
        />
      </View>

      <View style={onboardingStyles.textContainer}>
        <Text style={onboardingStyles.title}>
          {item.title}
        </Text>

        <Text style={onboardingStyles.description}>
          {item.description}
        </Text>
      </View>

      <View style={onboardingStyles.bottomContainer}>
        <OnboardingIndicator currentIndex={currentIndex} />

        <OnboardingButton
          title={item.buttonTitle}
          onPress={onNext}
        />

        {currentIndex === totalPages - 1 && (
          <Text
            style={{
              textAlign: "center",
              fontSize: 16,
            }}
            onPress={onLogin}
          >
            Already have an account?{" "}
            <Text
              style={{
                fontWeight: "700",
              }}
            >
              Log In
            </Text>
          </Text>
        )}
      </View>
    </View>
  );
}

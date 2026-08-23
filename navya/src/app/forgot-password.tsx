import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import Colors from "../constants/colors";
import BackButton from "../components/auth/BackButton";
import { KeyboardAwareScrollView, KeyboardAwareTextInput } from "../components/layout/KeyboardAwareScrollView";

const emailExpression = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [hasSentEmail, setHasSentEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendResetLink = () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!emailExpression.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    // UI-only flow: email delivery will be connected when authentication is added.
    setHasSentEmail(true);
  };

  if (hasSentEmail) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <View style={styles.confirmationHeader}>
          <BackButton onPress={() => setHasSentEmail(false)} />
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Check your email for reset instructions.</Text>
        </View>

        <View style={styles.confirmationContent}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={44} color="#C475F7" />
          </View>
          <Text style={styles.successTitle}>Email Sent!</Text>
          <Text style={styles.successMessage}>
            Please check your inbox for the password reset link.
          </Text>
          <GradientButton title="Back to Login" onPress={() => router.replace("/login")} compact />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <KeyboardAwareScrollView
        style={styles.screen}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        <BackButton onPress={() => router.back()} />

        <View style={styles.formHeader}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your email and we'll send you a reset link.</Text>
        </View>

        <View>
          <Text style={styles.label}>Email Address</Text>
          <KeyboardAwareTextInput
            style={[styles.input, error ? styles.inputError : null]}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (error) setError(null);
            }}
            placeholder="aarya@example.com"
            placeholderTextColor="#9B8BA9"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            accessibilityLabel="Email address"
            returnKeyType="done"
            onSubmitEditing={handleSendResetLink}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <GradientButton title="Send Reset Link" onPress={handleSendResetLink} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

type GradientButtonProps = {
  title: string;
  onPress: () => void;
  compact?: boolean;
};

function GradientButton({ title, onPress, compact = false }: GradientButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={[styles.buttonPressable, compact ? styles.compactButton : null]}
    >
      <LinearGradient
        colors={["#DC91F8", "#BD70F4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <Text style={styles.buttonLabel}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 17,
    paddingTop: 54,
    paddingBottom: 40,
  },
  formHeader: {
    marginTop: 52,
    marginBottom: 37,
  },
  confirmationHeader: {
    paddingHorizontal: 16,
    paddingTop: 48,
  },
  title: {
    color: Colors.darkPurple,
    fontSize: 31,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 5,
    color: "#A377C8",
    fontSize: 18,
    lineHeight: 25,
  },
  label: {
    marginBottom: 8,
    color: Colors.darkPurple,
    fontSize: 17,
    fontWeight: "500",
  },
  input: {
    height: 62,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E7CCFF",
    borderRadius: 19,
    backgroundColor: Colors.white,
    color: Colors.darkPurple,
    fontSize: 17,
  },
  inputError: {
    borderColor: "#D85777",
  },
  errorText: {
    marginTop: 7,
    color: "#C34164",
    fontSize: 13,
  },
  buttonPressable: {
    marginTop: 26,
  },
  button: {
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  buttonLabel: {
    color: Colors.darkPurple,
    fontSize: 20,
    fontWeight: "500",
  },
  confirmationContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 84,
  },
  successIcon: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
    backgroundColor: "#ECDDFF",
  },
  successTitle: {
    marginTop: 33,
    color: Colors.darkPurple,
    fontSize: 23,
    fontWeight: "700",
  },
  successMessage: {
    marginTop: 14,
    color: "#A377C8",
    fontSize: 18,
    lineHeight: 25,
    textAlign: "center",
  },
  compactButton: {
    width: 211,
    marginTop: 39,
  },
});

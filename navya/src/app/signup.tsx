import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";


import BackButton from "../components/auth/BackButton";
import AuthHeader from "../components/auth/AuthHeader";
import AuthInput from "../components/auth/AuthInput";
import PasswordInput from "../components/auth/PasswordInput";
import AuthButton from "../components/auth/AuthButton";
import CustomCheckbox from "../components/auth/CustomCheckbox";
import TermsModal from "../components/auth/TermsModal";
import { useAuth } from "../features/auth/AuthContext";
import { KeyboardAwareScrollView } from "../components/layout/KeyboardAwareScrollView";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [accepted, setAccepted] = useState(false);

  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert("Validation", "Please enter your full name.");
      return false;
    }

    if (!email.trim()) {
      Alert.alert("Validation", "Please enter your email.");
      return false;
    }

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
      Alert.alert("Validation", "Please enter a valid email.");
      return false;
    }

    if (password.length < 8) {
      Alert.alert(
        "Validation",
        "Password must contain at least 8 characters."
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Validation",
        "Passwords do not match."
      );
      return false;
    }

    if (!accepted) {
      Alert.alert(
        "Validation",
        "Please accept Terms & Privacy Policy."
      );
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      await signUp(fullName.trim(), email.trim(), password);

      Alert.alert(
        "Success",
        "Account Created Successfully",
        [
          {
            text: "Continue",
            onPress: () => router.replace("/setup"),
          },
        ]
      );

    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <KeyboardAwareScrollView
  style={{ flex: 1 }}
  contentContainerStyle={{
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 60,
  }}
  showsVerticalScrollIndicator={false}
>
          <BackButton
            onPress={() => router.back()}
          />

          <AuthHeader
            title="Create Account"
            subtitle="Start your wellness journey with NAVYA"
          />

          <AuthInput
            label="Full Name"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            onSubmitEditing={() => emailRef.current?.focus()}
          />

          <AuthInput
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            inputRef={emailRef}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <PasswordInput
            label="Password"
            placeholder="Minimum 8 characters"
            value={password}
            onChangeText={setPassword}
            inputRef={passwordRef}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            inputRef={confirmPasswordRef}
            onSubmitEditing={() => void handleSignup()}
          />

          <View
            style={{
              flexDirection: "row",
              marginTop: 10,
              marginBottom: 20,
            }}
          >
            <CustomCheckbox
              checked={accepted}
              onPress={() =>
                setAccepted(!accepted)
              }
            />

            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                color: "#666",
                lineHeight: 24,
                fontSize: 15,
              }}
            >
              I agree to the{" "}

              <Text
                style={{
                  color: "#B86EF8",
                  fontWeight: "700",
                }}
                onPress={() =>
                  setShowTerms(true)
                }
              >
                Terms of Service
              </Text>

              {" "}and{" "}

              <Text
                style={{
                  color: "#B86EF8",
                  fontWeight: "700",
                }}
                onPress={() =>
                  setShowPrivacy(true)
                }
              >
                Privacy Policy
              </Text>
            </Text>
          </View>

          <AuthButton
            title={
              loading
                ? "Creating..."
                : "Create Account"
            }
            onPress={handleSignup}
          />

          <View style={{ flex: 1 }} />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 35,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: "#777",
                fontSize: 16,
              }}
            >
              Already have an account?
            </Text>

            <Pressable
              onPress={() =>
                router.replace("/login")
              }
            >
              <Text
                style={{
                  color: "#B86EF8",
                  fontWeight: "700",
                  fontSize: 16,
                }}
              >
                {" "}Log In
              </Text>
            </Pressable>
          </View>
        </KeyboardAwareScrollView>

      <TermsModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms of Service"
        content={`Welcome to NAVYA.

By creating an account you agree to use the application responsibly.

NAVYA provides wellness tracking and informational insights only. It should not replace professional medical advice.

You are responsible for keeping your login credentials secure.

We reserve the right to update these terms as the application evolves.

Thank you for choosing NAVYA.`}
      />

      <TermsModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
        content={`Your privacy is important to us.

NAVYA collects only the information necessary to provide personalized menstrual cycle tracking, mood insights, and wellness recommendations.

Your journal entries are private.

We never sell your personal information.

You may request deletion of your account and associated data at any time.

Your data is encrypted during transmission and handled securely.`}
      />
    </>
  );
}

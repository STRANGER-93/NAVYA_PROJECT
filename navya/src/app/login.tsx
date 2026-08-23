import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";

import authStyles from "../styles/authStyles";

import BackButton from "../components/auth/BackButton";
import AuthHeader from "../components/auth/AuthHeader";
import AuthInput from "../components/auth/AuthInput";
import PasswordInput from "../components/auth/PasswordInput";
import AuthButton from "../components/auth/AuthButton";
import { useAuth } from "../features/auth/AuthContext";
import { KeyboardAwareScrollView } from "../components/layout/KeyboardAwareScrollView";

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("Validation", "Please enter your email address.");
      return false;
    }

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
      Alert.alert("Validation", "Please enter a valid email address.");
      return false;
    }

    if (!password.trim()) {
      Alert.alert("Validation", "Please enter your password.");
      return false;
    }

    if (password.length < 8) {
      Alert.alert(
        "Validation",
        "Password should contain at least 8 characters."
      );
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const session = await signIn(email.trim(), password);

      Alert.alert(
        "Success",
        "Login Successful",
        [
          {
            text: "Continue",
            onPress: () => router.replace(session.setupCompleted ? "/dashboard" : "/setup"),
          },
        ]
      );

    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Unable to login.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
        {/* Back Button */}
        <BackButton onPress={() => router.back()} />

        {/* Header */}
        <AuthHeader
          title="Welcome Back"
          subtitle="Continue your wellness journey"
        />

        {/* Email */}
        <AuthInput
          label="Email Address"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          inputRef={emailRef}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        {/* Password Label */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              fontWeight: "500",
              color: "#24153D",
            }}
          >
            Password
          </Text>

          <Pressable
            onPress={() => router.push("/forgot-password")}
          >
            <Text
              style={{
                color: "#B86EF8",
                fontWeight: "600",
                fontSize: 15,
              }}
            >
              Forgot Password?
            </Text>
          </Pressable>
        </View>

        {/* Password */}
        <PasswordInput
          label=""
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          inputRef={passwordRef}
          onSubmitEditing={() => void handleLogin()}
        />

        {/* Login Button */}
        <AuthButton
          title={loading ? "Logging In..." : "Log In"}
          onPress={handleLogin}
        />

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Footer */}
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
            Don't have an account?
          </Text>

          <Pressable
            onPress={() => router.push("/signup")}
          >
            <Text
              style={{
                color: "#B86EF8",
                fontWeight: "700",
                fontSize: 16,
              }}
            >
              {" "}Sign Up
            </Text>
          </Pressable>
        </View>
    
      </KeyboardAwareScrollView>
  );
}

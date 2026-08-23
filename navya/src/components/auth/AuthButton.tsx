import React from "react";
import { Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import authStyles from "../../styles/authStyles";

type Props = {
  title: string;
  onPress: () => void;
};

export default function AuthButton({
  title,
  onPress,
}: Props) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={["#D892F8", "#B86EF8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={authStyles.button}
      >
        <Text style={authStyles.buttonText}>
          {title}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
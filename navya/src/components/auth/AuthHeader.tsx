import React from "react";
import { View, Text } from "react-native";

import authStyles from "../../styles/authStyles";

type Props = {
  title: string;
  subtitle: string;
};

export default function AuthHeader({
  title,
  subtitle,
}: Props) {
  return (
    <View style={authStyles.headerContainer}>
      <Text style={authStyles.title}>
        {title}
      </Text>

      <Text style={authStyles.subtitle}>
        {subtitle}
      </Text>
    </View>
  );
}

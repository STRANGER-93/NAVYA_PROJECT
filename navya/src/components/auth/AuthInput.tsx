import React from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
} from "react-native";

import authStyles from "../../styles/authStyles";
import { useKeyboardAwareFocus } from "../layout/KeyboardAwareScrollView";

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
};

export default function AuthInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = "default",
  returnKeyType = "next",
  onSubmitEditing,
  inputRef,
}: Props) {
  const onFocus = useKeyboardAwareFocus();
  return (
    <View style={authStyles.inputContainer}>
      <Text style={authStyles.label}>
        {label}
      </Text>

      <TextInput
        style={authStyles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={onFocus}
        ref={inputRef}
      />
    </View>
  );
}

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ReturnKeyTypeOptions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import authStyles from "../../styles/authStyles";
import { useKeyboardAwareFocus } from "../layout/KeyboardAwareScrollView";

type Props = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  inputRef?: React.RefObject<TextInput | null>;
};

export default function PasswordInput({
  label,
  placeholder,
  value,
  onChangeText,
  returnKeyType = "done",
  onSubmitEditing,
  inputRef,
}: Props) {
  const [hidden, setHidden] = useState(true);
  const onFocus = useKeyboardAwareFocus();

  return (
    <View style={authStyles.inputContainer}>
        {label ? (
        <Text style={authStyles.label}>
            {label}
        </Text>
        ) : null}

      <View style={authStyles.passwordContainer}>
        <TextInput
          style={authStyles.passwordInput}
          placeholder={placeholder}
          secureTextEntry={hidden}
          value={value}
          onChangeText={onChangeText}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={onFocus}
          ref={inputRef}
        />

        <Pressable
          onPress={() => setHidden(!hidden)}
        >
          <Ionicons
            name={
              hidden
                ? "eye-outline"
                : "eye-off-outline"
            }
            size={24}
            color="#8B6BAE"
          />
        </Pressable>
      </View>
    </View>
  );
}

import React, { createContext, useCallback, useContext, useRef } from "react";
import { KeyboardAvoidingView, NativeSyntheticEvent, Platform, ScrollView, ScrollViewProps, TargetedEvent, TextInput, TextInputProps } from "react-native";

type KeyboardScrollContextValue = { revealInput: (target: number) => void } | null;
const KeyboardScrollContext = createContext<KeyboardScrollContextValue>(null);

type Props = ScrollViewProps & { keyboardVerticalOffset?: number };

/** A shared form container that resizes for the keyboard and keeps focused inputs visible. */
export function KeyboardAwareScrollView({ children, keyboardVerticalOffset = 0, contentContainerStyle, ...props }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const revealInput = useCallback((target: number) => {
    requestAnimationFrame(() => {
      const responder = scrollRef.current as unknown as { scrollResponderScrollNativeHandleToKeyboard?: (node: number, offset: number, animated: boolean) => void } | null;
      responder?.scrollResponderScrollNativeHandleToKeyboard?.(target, 96, true);
    });
  }, []);
  return <KeyboardScrollContext.Provider value={{ revealInput }}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={keyboardVerticalOffset}><ScrollView ref={scrollRef} {...props} contentContainerStyle={contentContainerStyle} keyboardShouldPersistTaps="handled" keyboardDismissMode="none" automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}>{children}</ScrollView></KeyboardAvoidingView></KeyboardScrollContext.Provider>;
}

/** Attach this handler to a TextInput's onFocus to reveal it above the keyboard. */
export function useKeyboardAwareFocus(onFocus?: (event: NativeSyntheticEvent<TargetedEvent>) => void) {
  const context = useContext(KeyboardScrollContext);
  return useCallback((event: NativeSyntheticEvent<TargetedEvent>) => { onFocus?.(event); context?.revealInput(event.nativeEvent.target); }, [context, onFocus]);
}

export const KeyboardAwareTextInput = React.forwardRef<TextInput, TextInputProps>(function KeyboardAwareTextInput({ onFocus, ...props }, ref) {
  const handleFocus = useKeyboardAwareFocus(onFocus);
  return <TextInput ref={ref} {...props} onFocus={handleFocus} />;
});

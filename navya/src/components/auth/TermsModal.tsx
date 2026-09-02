import React from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  content: string;
};

export default function TermsModal({
  visible,
  onClose,
  title,
  content,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
    >
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.35)",
        }}
      >
        <View
          style={{
            height: "75%",
            backgroundColor: "white",
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            padding: 24,
          }}
        >
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              marginBottom: 15,
              color: "#24153D",
            }}
          >
            {title}
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                fontSize: 16,
                lineHeight: 28,
                color: "#666",
              }}
            >
              {content}
            </Text>
          </ScrollView>

          <Pressable
            style={{
              marginTop: 20,
              backgroundColor: "#C58AF9",
              paddingVertical: 16,
              borderRadius: 18,
              alignItems: "center",
            }}
            onPress={onClose}
          >
            <Text
              style={{
                color: "white",
                fontWeight: "700",
                fontSize: 18,
              }}
            >
              Close
            </Text>
          </Pressable>

        </View>
      </View>
    </Modal>
  );
}

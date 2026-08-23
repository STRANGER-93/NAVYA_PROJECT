import { StyleSheet } from "react-native";
import Colors from "../constants/colors";

const onboardingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "space-between",
  },

  skipContainer: {
    alignItems: "flex-end",
  },

  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  image: {
    width: 240,
    height: 240,
  },

  textContainer: {
    alignItems: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: Colors.darkPurple,
    textAlign: "center",
    marginBottom: 15,
  },

  description: {
    fontSize: 17,
    lineHeight: 28,
    color: "#777777",
    textAlign: "center",
    paddingHorizontal: 10,
  },

  bottomContainer: {
    gap: 25,
  },
});

export default onboardingStyles;
import { StyleSheet } from "react-native";
import Colors from "../constants/colors";

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 60,
    alignItems: "center",
  },

  top: {
    alignItems: "center",
    marginTop: 50,
  },

  title: {
    marginTop: 30,
    fontSize: 48,
    fontWeight: "700",
    letterSpacing: 10,
    color: Colors.darkPurple,
  },

  subtitle: {
    marginTop: 15,
    fontSize: 15,
    color: Colors.subtitle,
    letterSpacing: 1,
    textAlign: "center",
    textTransform: "uppercase",
  },

  middle: {
    marginBottom: 80,
  },

  bottom: {
    marginBottom: 20,
  },

  tap: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: "500",
  },
});

export default splashStyles;
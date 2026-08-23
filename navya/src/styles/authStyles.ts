import { StyleSheet } from "react-native";
import Colors from "../constants/colors";

const authStyles = StyleSheet.create({
  container: {
  backgroundColor: Colors.background,
  paddingHorizontal: 28,
  paddingTop: 60,
  paddingBottom: 40,
},

  headerContainer: {
    marginTop: 30,
    marginBottom: 35,
  },

  title: {
    fontSize: 42,
    fontWeight: "700",
    color: Colors.darkPurple,
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 18,
    color: Colors.subtitle,
  },

  inputContainer: {
    marginBottom: 22,
  },

  label: {
    fontSize: 18,
    fontWeight: "500",
    color: Colors.darkPurple,
    marginBottom: 10,
  },

  input: {
    height: 62,
    borderWidth: 1,
    borderColor: "#E7D2FF",
    borderRadius: 18,
    paddingHorizontal: 18,
    fontSize: 17,
    color: Colors.darkPurple,
    backgroundColor: Colors.white,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E7D2FF",
    borderRadius: 18,
    backgroundColor: Colors.white,
    paddingHorizontal: 18,
    height: 62,
  },

  passwordInput: {
    flex: 1,
    fontSize: 17,
    color: Colors.darkPurple,
  },

  button: {
    height: 62,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },

  buttonText: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.darkPurple,
  },
});

export default authStyles;
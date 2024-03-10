import { StyleSheet } from "react-native";

const commonStyles = StyleSheet.create({
  textInput: {
    minWidth: "50%",
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  inputLabel: {
    fontSize: 20,
  },
  touchableHighlightButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: "rgba(51, 51, 51, 1)",
  },
  touchableHighlightButtonText: {
    fontSize: 12,
    lineHeight: 21,
    fontWeight: "bold",
    letterSpacing: 0.25,
    color: "white",
  },
});
export default commonStyles;

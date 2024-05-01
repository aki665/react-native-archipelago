import { StyleSheet } from "react-native";

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    flexDirection: "row",
    padding: 5,
    alignItems: "center",
  },
  text: {
    color: "red",
    flex: 10,
    verticalAlign: "middle",
  },
  button: {
    flex: 2,
  },
  icon: {
    flex: 2,
  },
});

export default errorStyles;

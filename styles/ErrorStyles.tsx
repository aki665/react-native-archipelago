import { StyleSheet } from "react-native";

const errorStyles = StyleSheet.create({
  container: {
    backgroundColor: "black",
    flexDirection: "row",
    padding: 5,
    alignItems: "center",
  },
  text: {
    color: "red",
    flex: 10,
    verticalAlign: "middle",
    fontSize: 18,
  },
  button: {
    flex: 3,
    paddingVertical: "5%",
  },
  icon: {
    flex: 3,
  },
});

export default errorStyles;

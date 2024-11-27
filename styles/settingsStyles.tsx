import { StyleSheet } from "react-native";

const settingsStyles = StyleSheet.create({
  settingsContainer: {
    borderColor: "black",
  },
  list: {
    width: "90%",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    borderRadius: 1,
    elevation: 2,
    marginBottom: 3,
  },
});
export default settingsStyles;

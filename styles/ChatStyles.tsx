import { StyleSheet } from "react-native";

const chatStyles = StyleSheet.create({
  chat: {
    flexDirection: "column-reverse",
    flex: 1,
    flexWrap: "nowrap",
    rowGap: 10,
  },
  message: {
    flex: 1,
    borderWidth: 1,
  },
});
export default chatStyles;

import { StyleSheet } from "react-native";

import Colors from "./Colors";

const chatStyles = StyleSheet.create({
  chat: {
    flexDirection: "column",
    flex: 1,
    flexWrap: "nowrap",
    rowGap: 10,
    margin: 5,
  },
  message: {
    flex: 1,
    color: Colors.black,
  },
  chatBox: {
    flex: 1,
  },
  chatInputBox: {
    flexDirection: "row",
    marginBottom: 5,
    marginRight: 5,
  },
});
export default chatStyles;

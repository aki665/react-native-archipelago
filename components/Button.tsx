import React from "react";
import { Text, TextStyle, ViewStyle } from "react-native";
import { TouchableHighlight } from "react-native-gesture-handler";

import commonStyles from "../styles/CommonStyles";

export default function Button({
  onPress,
  text,
  buttonStyle,
  textStyle,
}: Readonly<{
  onPress: () => void;
  text: string;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
}>) {
  return (
    <TouchableHighlight
      style={{ ...commonStyles.touchableHighlightButton, ...buttonStyle }}
      onPress={onPress}
    >
      <Text
        style={{ ...commonStyles.touchableHighlightButtonText, ...textStyle }}
      >
        {text}
      </Text>
    </TouchableHighlight>
  );
}

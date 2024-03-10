import React, { ReactNode } from "react";
import {
  Text,
  TextStyle,
  TouchableHighlight,
  TouchableHighlightProps,
  ViewStyle,
} from "react-native";

import commonStyles from "../styles/CommonStyles";

export default function Button({
  onPress,
  text,
  buttonStyle,
  textStyle,
  buttonProps,
  children,
  startIcon,
  endIcon,
  removeText = false,
}: Readonly<{
  onPress: () => void;
  text: string;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  buttonProps?: TouchableHighlightProps;
  children?: ReactNode | ReactNode[];
  startIcon?: ReactNode | ReactNode[];
  endIcon?: ReactNode | ReactNode[];
  removeText?: boolean;
}>) {
  return (
    <TouchableHighlight
      style={{ ...commonStyles.touchableHighlightButton, ...buttonStyle }}
      onPress={onPress}
      {...buttonProps}
    >
      <>
        {children}
        {!removeText && (
          <Text
            style={{
              ...commonStyles.touchableHighlightButtonText,
              ...textStyle,
            }}
          >
            {startIcon}
            {text}
            {endIcon}
          </Text>
        )}
      </>
    </TouchableHighlight>
  );
}

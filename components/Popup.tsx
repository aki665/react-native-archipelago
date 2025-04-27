import React, { ReactNode } from "react";
import { Modal, View, ViewStyle } from "react-native";

import commonStyles from "../styles/CommonStyles";

export default function Popup({
  visible,
  closePopup,
  popupStyle,
  animationType = "slide",
  children,
}: Readonly<{
  visible: boolean;
  closePopup: () => void;
  popupStyle?: ViewStyle;
  animationType?: Modal["props"]["animationType"];
  children?: ReactNode | ReactNode[];
}>) {
  return (
    <Modal
      animationType={animationType}
      transparent
      visible={visible}
      onRequestClose={() => {
        closePopup();
      }}
    >
      <View style={commonStyles.centeredView}>
        <View style={{ ...commonStyles.modalView, ...popupStyle }}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

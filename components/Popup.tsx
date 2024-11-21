import React, { ReactNode } from "react";
import { Modal, View, ViewStyle } from "react-native";

import commonStyles from "../styles/CommonStyles";

export default function Popup({
  visible,
  closePopup,
  popupStyle,
  children,
}: Readonly<{
  visible: boolean;
  closePopup: () => void;
  popupStyle: ViewStyle;
  children?: ReactNode | ReactNode[];
}>) {
  return (
    <Modal
      animationType="slide"
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

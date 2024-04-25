import React, { ReactNode } from "react";
import { Modal, View } from "react-native";

import commonStyles from "../styles/CommonStyles";

export default function Popup({
  visible,
  closePopup,
  children,
}: Readonly<{
  visible: boolean;
  closePopup: () => void;
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
        <View style={commonStyles.modalView}>{children}</View>
      </View>
    </Modal>
  );
}

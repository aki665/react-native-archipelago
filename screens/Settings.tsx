import { AntDesign } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import APLicense from "../components/APLicense";
import Button from "../components/Button";
import Popup from "../components/Popup";
import { Settings, SettingsContext } from "../components/SettingsContext";
import commonStyles from "../styles/CommonStyles";
import { MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";

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
    flex: 1,
    borderRadius: 4,
    maxHeight: 150,
    overflow: "hidden",
    backgroundColor: "white",
    marginHorizontal: 12,
    marginVertical: 6,
  },
  name: {
    flex: 10,
    marginVertical: 10,
    marginLeft: 10,
    fontSize: 25,
  },
});

/**
 * Renders a single setting from the default settings array in SettingsContext. Input type is determined from the type of the setting's value.
 */
function SettingItem({
  setting,
  onChange,
}: Readonly<{
  setting: Settings;
  onChange: (newValue: any, name: any) => void;
}>) {
  const [settingState, setSettingState] = useState(setting.value);

  if (typeof setting.value === "string") {
    return (
      <TextInput
        style={{ ...commonStyles.textInput, width: "25%" }}
        defaultValue={setting.value}
        onChangeText={(newText) => onChange(newText, setting.name)}
      />
    );
  }
  if (typeof setting.value === "number") {
    return (
      <TextInput
        style={{ ...commonStyles.textInput, minWidth: "20%" }}
        value={settingState.toString()}
        inputMode="numeric"
        onChangeText={(newText) => {
          setSettingState(newText);
          const newValue = parseInt(newText, 10);
          const min = setting.minValue ?? 0;
          const max = setting.maxValue ?? Infinity;
          if (isNaN(newValue)) {
            //don't change the setting if it is not a number
          } else if (newValue < min) {
            onChange(min, setting.name);
          } else if (newValue > max) {
            onChange(max, setting.name);
          } else {
            onChange(newValue, setting.name);
          }
        }}
        onEndEditing={(e) => {
          const min = setting.minValue ?? 0;
          const max = setting.maxValue ?? Infinity;
          const newValue = parseInt(e.nativeEvent.text, 10);
          if (e.nativeEvent.text === "" || isNaN(newValue))
            setSettingState(setting.value);
          else if (newValue < min) {
            setSettingState(min);
          } else if (newValue > max) {
            setSettingState(max);
          }
        }}
      />
    );
  }
  if (typeof setting.value === "boolean" && typeof settingState === "boolean") {
    return (
      <Switch
        trackColor={{ true: "#green" }}
        thumbColor="#f4f3f4"
        onValueChange={(value) => {
          setSettingState(value);
          onChange(value, setting.name);
        }}
        value={settingState}
        style={{ margin: 12 }}
      />
    );
  }
}

/**
 * An array containing settings that have unique display
 */
const hiddenSettings = [""];
export default function SettingsScreen({
  navigation,
}: Readonly<{
  navigation: MaterialTopTabBarProps["navigation"];
}>) {
  const { settings, handleSettingChange } = useContext(SettingsContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const closePopup = () => {
    setModalVisible(false);
  };
  return (
    <>
      <Popup visible={modalVisible} closePopup={closePopup}>
        <Text style={commonStyles.modalText}>{selectedDescription}</Text>
        <View style={commonStyles.modalButtonContainer}>
          <Button onPress={closePopup} text="Close" />
        </View>
      </Popup>
      <ScrollView style={settingsStyles.settingsContainer} nestedScrollEnabled>
        <APLicense />
        <>
          {settings
            .filter((setting) => !hiddenSettings.includes(setting.name))
            .map((setting) => {
              return (
                <View style={settingsStyles.item} key={setting.name}>
                  <Text style={settingsStyles.name}>
                    {setting.displayName}{" "}
                    <AntDesign
                      onPress={() => {
                        setSelectedDescription(setting.description);
                        setModalVisible(true);
                      }}
                      name="questioncircleo"
                      size={15}
                      color="black"
                    />
                  </Text>
                  <SettingItem
                    setting={setting}
                    onChange={handleSettingChange}
                  />
                </View>
              );
            })}
        </>
      </ScrollView>
    </>
  );
}

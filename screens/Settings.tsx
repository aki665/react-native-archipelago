import { AntDesign } from "@expo/vector-icons";
import React, { useContext, useState } from "react";
import { ScrollView, Switch, Text, TextInput, View } from "react-native";

import APLicense from "../components/APLicense";
import Button from "../components/Button";
import Popup from "../components/Popup";
import { Settings, SettingsContext } from "../components/SettingsContext";
import commonStyles from "../styles/CommonStyles";
import settingsStyles from "../styles/settingsStyles";
import { save, STORAGE_TYPES } from "../utils/storageHandler";

function SettingItem({
  setting,
  onChange,
}: Readonly<{
  setting: Settings;
  onChange: (newValue: any, name: any) => void;
}>) {
  const [switchState, setSwitchState] = useState(setting.value);

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
        defaultValue={setting.value.toString()}
        onChangeText={(newText) =>
          onChange(parseInt(newText, 10), setting.name)
        }
      />
    );
  }
  if (typeof setting.value === "boolean" && typeof switchState === "boolean") {
    return (
      <Switch
        trackColor={{ true: "#green" }}
        thumbColor="#f4f3f4"
        onValueChange={(value) => {
          setSwitchState(value);
          onChange(value, setting.name);
        }}
        value={switchState}
      />
    );
  }
}

export default function SettingsScreen() {
  const { settings, setSettings } = useContext(SettingsContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState("");
  const closePopup = () => {
    setModalVisible(false);
  };
  const handleSettingChange = async (
    newValue: Settings["value"],
    name: string,
  ) => {
    const newSettings = settings;
    const newSettingIndex = newSettings.findIndex(
      (setting) => setting.name === name,
    );
    newSettings[newSettingIndex].value = newValue;
    await save(newSettings, "__settings", STORAGE_TYPES.OBJECT);
    setSettings(newSettings);
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
          {settings.map((setting) => {
            return (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  flex: 1,
                  borderRadius: 4,
                  maxHeight: 150,
                  overflow: "hidden",
                  backgroundColor: "white",
                  marginHorizontal: 12,
                  marginVertical: 6,
                }}
                key={setting.name}
              >
                <Text
                  style={{
                    flex: 10,
                    marginTop: 10,
                    marginLeft: 10,
                    fontSize: 25,
                  }}
                >
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
                <SettingItem setting={setting} onChange={handleSettingChange} />
              </View>
            );
          })}
        </>
      </ScrollView>
    </>
  );
}

import { MaterialTopTabNavigationHelpers } from "@react-navigation/material-top-tabs/lib/typescript/src/types";
import { ConnectionInformation, ITEMS_HANDLING_FLAGS } from "archipelago.js";
import React, { useContext, useState } from "react";
import { ActivityIndicator, Alert, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import { ClientContext } from "../components/ClientContext";
import { ErrorContext } from "../components/ErrorContext";
import Popup from "../components/Popup";
import commonStyles from "../styles/CommonStyles";
import mainStyles from "../styles/MainStyles";
import { STORAGE_TYPES, getAllNames, save } from "../utils/storageHandler";

export type apInfo = {
  hostname: string;
  port: number;
  name: string;
  password?: string;
};

/**
 * Renders AP information inputs
 * @param onPress a method that is run when the included button is pressed
 * @param buttonText What the button says on it
 * @param loading State that when it is true, the fields and button are disabled
 * @param savedInfo default values for the fields
 */
export function ApInformation({
  onPress,
  buttonText,
  loading,
  savedInfo,
}: Readonly<{
  onPress: (apInfo: apInfo) => void;
  buttonText: string;
  loading: boolean;
  savedInfo?: apInfo;
}>) {
  const [apInfo, setApInfo] = useState<apInfo>(
    savedInfo || {
      hostname: "archipelago.gg",
      port: 0,
      name: "",
      password: undefined,
    },
  );
  const [portString, setPortString] = useState(
    savedInfo?.port.toString() ?? "",
  );
  return (
    <>
      <View>
        <Text style={commonStyles.inputLabel}>Address</Text>
        <TextInput
          style={commonStyles.textInput}
          onChangeText={(text) => {
            setApInfo({ ...apInfo, hostname: text });
          }}
          value={apInfo.hostname}
          editable={!loading}
          placeholder="Address"
        />
      </View>
      <View>
        <Text style={commonStyles.inputLabel}>Port</Text>
        <TextInput
          style={commonStyles.textInput}
          keyboardType="number-pad"
          onChangeText={(text) => {
            setPortString(text);
            setApInfo({ ...apInfo, port: parseInt(text, 10) || 0 });
          }}
          value={portString}
          editable={!loading}
          placeholder="Port"
        />
      </View>
      <View>
        <Text style={commonStyles.inputLabel}>Name</Text>
        <TextInput
          style={commonStyles.textInput}
          onChangeText={(text) => {
            setApInfo({ ...apInfo, name: text });
          }}
          value={apInfo.name}
          editable={!loading}
          placeholder="Name"
        />
      </View>
      <View>
        <Text style={commonStyles.inputLabel}>Password</Text>
        <TextInput
          style={commonStyles.textInput}
          onChangeText={(text) => {
            setApInfo({ ...apInfo, password: text || undefined });
          }}
          value={apInfo.password}
          editable={!loading}
          placeholder="Password"
        />
      </View>
      <Button
        text={buttonText}
        textStyle={{ fontSize: 16 }}
        onPress={() => {
          onPress(apInfo);
        }}
        buttonProps={{ disabled: loading }}
        removeText={loading}
      >
        {loading && <ActivityIndicator size="large" color="white" />}
      </Button>
    </>
  );
}

export default function Connect({
  navigation,
}: Readonly<{
  navigation: MaterialTopTabNavigationHelpers;
}>) {
  const client = useContext(ClientContext);
  const { setError } = useContext(ErrorContext);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [infoToSave, setInfoToSave] = useState({});

  const connect = () => {
    navigation.navigate("connected");
    setModalVisible(false);
  };
  const saveInfoAndConnect = async () => {
    await save(infoToSave, sessionName, STORAGE_TYPES.OBJECT);
    connect();
  };
  const handleSaveConnectionInfo = async () => {
    const existingNames = await getAllNames();
    if (existingNames?.some((value: string) => value === sessionName)) {
      Alert.alert(
        "A connection is already saved with the specified name",
        "Do you want to replace the existing one with this new one?",
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Replace",
            onPress: () => {
              saveInfoAndConnect();
            },
          },
        ],
      );
    } else {
      saveInfoAndConnect();
    }
  };

  const connectToAP = async (apInfo: apInfo) => {
    try {
      setLoading(true);
      const connectionInfo: ConnectionInformation = {
        protocol: "wss",
        tags: ["TextOnly"],
        game: "",
        items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
        ...apInfo,
      };

      await client.connect(connectionInfo);
      setSessionName(`${apInfo.name} @ ${apInfo.hostname}:${apInfo.port}`);
      setModalVisible(true);
      setInfoToSave(apInfo);
      setLoading(false);
      setError("");
    } catch (e) {
      setError(e);
      console.error(e);
      setLoading(false);
    }
  };

  const closePopup = () => {
    client.disconnect();
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={mainStyles.connectionContainer}>
      <Popup visible={modalVisible} closePopup={closePopup}>
        <Text style={commonStyles.modalText}>
          What do you want to save this connection as?
        </Text>
        <TextInput
          style={commonStyles.textInput}
          onChangeText={(text) => {
            setSessionName(text);
          }}
          value={sessionName}
          editable={!loading}
          placeholder="Session name"
        />
        <View style={commonStyles.modalButtonContainer}>
          <Button
            text="Cancel"
            onPress={() => {
              closePopup();
            }}
          />
          <Button
            text="Connect without saving"
            onPress={() => connect()}
            buttonStyle={{ marginLeft: 20 }}
          />
          <Button
            text="Save"
            onPress={() => handleSaveConnectionInfo()}
            buttonStyle={{ marginLeft: 20 }}
          />
        </View>
      </Popup>
      <ApInformation
        onPress={connectToAP}
        buttonText="Connect to Archipelago"
        loading={loading}
      />
    </SafeAreaView>
  );
}

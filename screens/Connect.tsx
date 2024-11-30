import { MaterialTopTabNavigationHelpers } from "@react-navigation/material-top-tabs/lib/typescript/src/types";
import { ConnectionInformation, ITEMS_HANDLING_FLAGS } from "archipelago.js";
import React, { useContext, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EXTRA_DATA } from "./SavedInfo";
import APConnectionInfo, { apInfo } from "../components/APConnectionInfo";
import Button from "../components/Button";
import { ClientContext } from "../components/ClientContext";
import { ErrorContext } from "../components/ErrorContext";
import Popup from "../components/Popup";
import commonStyles from "../styles/CommonStyles";
import mainStyles from "../styles/MainStyles";
import {
  STORAGE_TYPES,
  getAllNames,
  remove,
  save,
} from "../utils/storageHandler";

export default function Connect({
  navigation,
}: Readonly<{
  navigation: MaterialTopTabNavigationHelpers;
}>) {
  const { client, connectionInfoRef } = useContext(ClientContext);
  const { setError } = useContext(ErrorContext);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [infoToSave, setInfoToSave] = useState({});

  const connect = (replacedInfo = false) => {
    navigation.navigate("connected", {
      sessionName,
      replacedInfo,
    });
    setModalVisible(false);
  };
  const saveInfoAndConnect = async () => {
    EXTRA_DATA.forEach((data) => {
      remove(sessionName + data.name);
    });
    await save(infoToSave, sessionName, STORAGE_TYPES.OBJECT);
    connect(true);
  };

  const handleSaveConnectionInfo = async () => {
    const existingNames = await getAllNames();
    if (existingNames?.some((value: string) => value === sessionName)) {
      Alert.alert(
        "A connection is already saved with the specified name",
        "Do you want to replace the existing one with this new one?\nNOTE: Deletes all saved info relating to this connection",
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
      const port = apInfo.port !== 0 ? apInfo.port : 38281;
      const connectionInfo: ConnectionInformation = {
        game: "Archipela-Go!",
        items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
        ...apInfo,
        port,
      };

      await client.connect(connectionInfo);
      if (connectionInfoRef !== null) {
        connectionInfoRef.current = connectionInfo;
      }
      setSessionName(`${apInfo.name} @ ${apInfo.hostname}:${port}`);
      setModalVisible(true);
      setInfoToSave({ ...apInfo, port });
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
            onPress={() => {
              setSessionName("");
              connect();
            }}
            buttonStyle={{ marginLeft: 20 }}
          />
          <Button
            text="Save"
            onPress={() => handleSaveConnectionInfo()}
            buttonStyle={{ marginLeft: 20 }}
          />
        </View>
      </Popup>
      <APConnectionInfo
        onPress={connectToAP}
        buttonText="Connect to Archipelago"
        loading={loading}
      />
    </SafeAreaView>
  );
}

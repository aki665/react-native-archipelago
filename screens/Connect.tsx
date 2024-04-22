import {
  Client,
  ConnectionInformation,
  ITEMS_HANDLING_FLAGS,
} from "archipelago.js";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../components/Button";
import commonStyles from "../styles/CommonStyles";
import mainStyles from "../styles/MainStyles";
import { save } from "../utils/storageHandler";

export default function Connect({ navigation }) {
  const client = new Client();
  const [apInfo, setApInfo] = useState<{
    hostname: string;
    port: number;
    name: string;
    password?: string;
  }>({
    hostname: "archipelago.gg",
    port: 0,
    name: "",
    password: undefined,
  });
  const [portString, setPortString] = useState("");
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [sessionName, setSessionName] = useState("");

  const handleSaveConnectionInfo = async () => {
    await save(apInfo, sessionName);
    navigation.navigate("connected", {
      client,
    });
  };

  const connectToAP = async () => {
    try {
      setLoading(true);
      const connectionInfo: ConnectionInformation = {
        protocol: "wss",
        tags: ["AP", "TextOnly"],
        game: "",
        items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
        ...apInfo,
      };

      await client.connect(connectionInfo);
      //client.say("connected to the server from react-native!");
      /* navigation.navigate("connected", {
        client,
      }); */
      setSessionName(`${apInfo.name} @ ${apInfo.hostname}:${apInfo.port}`);
      setModalVisible(true);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={mainStyles.connectionContainer}>
      <View>
        <Modal
          animationType="slide"
          transparent
          visible={modalVisible}
          onRequestClose={() => {
            client.disconnect();
            setModalVisible(!modalVisible);
          }}
        >
          <View style={commonStyles.centeredView}>
            <View style={commonStyles.modalView}>
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
                placeholder="Port"
              />
              <View style={commonStyles.modalButtonContainer}>
                <Button
                  text="Save"
                  onPress={() => handleSaveConnectionInfo()}
                />
                <Button
                  text="Cancel"
                  onPress={() => {
                    client.disconnect();
                    setModalVisible(!modalVisible);
                  }}
                  buttonStyle={{ marginLeft: 40 }}
                />
              </View>
            </View>
          </View>
        </Modal>
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
        text="connect to Archipelago"
        textStyle={{ fontSize: 16 }}
        onPress={connectToAP}
        buttonProps={{ disabled: loading }}
        removeText={loading}
      >
        {loading && <ActivityIndicator size="large" color="white" />}
      </Button>
    </SafeAreaView>
  );
}

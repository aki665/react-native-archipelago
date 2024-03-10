import {
  Client,
  ConnectionInformation,
  ITEMS_HANDLING_FLAGS,
  PrintJSONPacket,
} from "archipelago.js";
import React, { useState } from "react";
import { Button, SafeAreaView, Text, TextInput, View } from "react-native";

import commonStyles from "../styles/CommonStyles";
import mainStyles from "../styles/MainStyles";

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

  const connectToAP = async () => {
    try {
      const connectionInfo: ConnectionInformation = {
        protocol: "wss",
        tags: ["AP", "TextOnly"],
        game: "",
        items_handling: ITEMS_HANDLING_FLAGS.REMOTE_ALL,
        ...apInfo,
      };

      await client.connect(connectionInfo);
      client.say("connected to the server from react-native!");
      navigation.navigate("connected", {
        client,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={mainStyles.mainContainer}>
      <View style={mainStyles.connectionContainer}>
        <View>
          <Text style={commonStyles.inputLabel}>Address</Text>
          <TextInput
            style={commonStyles.textInput}
            onChangeText={(text) => {
              setApInfo({ ...apInfo, hostname: text });
            }}
            value={apInfo.hostname}
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
          />
        </View>
        <View>
          <Text style={commonStyles.inputLabel}>password</Text>
          <TextInput
            style={commonStyles.textInput}
            onChangeText={(text) => {
              setApInfo({ ...apInfo, password: text || undefined });
            }}
            value={apInfo.password}
          />
        </View>
        <Button title="connect to Archipelago" onPress={connectToAP} />
      </View>
    </SafeAreaView>
  );
}

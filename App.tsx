import {
  Client,
  ConnectionInformation,
  ITEMS_HANDLING_FLAGS,
  SERVER_PACKET_TYPE,
} from "archipelago.js";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import Chat from "./screens/chat";

export default function App() {
  const client = new Client();
  const [apInfo, setApInfo] = useState({
    hostname: "archipelago.gg",
    port: 0,
    name: "",
    password: "",
  });
  const [messages, setMessages] = useState<string[]>([]);
  const [connection, setConnection] = useState("Disconnected");
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
      client.addListener(SERVER_PACKET_TYPE.CONNECTED, (packet) => {
        setConnection(packet.cmd);
      });
      client.addListener(SERVER_PACKET_TYPE.PRINT_JSON, (packet, message) => {
        console.log("message", message);
        console.log("packet", packet);
        setMessages((prevState) => [...prevState, packet.data[0].text]);
        // Add any additional logic here.
      });
      await client.connect(connectionInfo);
      client.say("connected to the server from react-native!");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {connection === "Disconnected" && (
        <>
          <View>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={styles.textInput}
              onChangeText={(text) => {
                setApInfo({ ...apInfo, hostname: text });
              }}
              value={apInfo.hostname}
            />
          </View>
          <View>
            <Text style={styles.inputLabel}>Port</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="number-pad"
              onChangeText={(text) => {
                setPortString(text);
                setApInfo({ ...apInfo, port: parseInt(text, 10) || 0 });
              }}
              value={portString}
            />
          </View>
          <View>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.textInput}
              onChangeText={(text) => {
                setApInfo({ ...apInfo, name: text });
              }}
              value={apInfo.name}
            />
          </View>
          <Button title="connect to Archipelago" onPress={connectToAP} />
        </>
      )}
      {connection !== "Disconnected" && (
        <Chat messages={messages} client={client} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    minWidth: "50%",
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  inputLabel: {
    fontSize: 20,
  },
});

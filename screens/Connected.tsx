import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Client, PrintJSONPacket, SERVER_PACKET_TYPE } from "archipelago.js";
import React, { useEffect, useState } from "react";
import { Alert, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Chat from "./chat";

const Tab = createMaterialTopTabNavigator();

function Placeholder() {
  return <></>;
}

/**
 * Handler for ap messaging
 * @param packet Packet recieved from archipelago
 * @param message message string
 */

export default function Connected({
  route,
  navigation,
}: Readonly<{
  route: { params: { client: Client } };
}>) {
  const { client } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const insets = useSafeAreaInsets();

  const handleMessages = (packet: PrintJSONPacket) => {
    const msg = packet.data.map((object) => {
      switch (object.type) {
        case "color":
          return { type: "text", text: object.text, color: object.color };
        case "player_id":
          console.log(client.players.get(parseInt(object.text, 10)));
          return {
            type: "player",
            text: client.players.get(parseInt(object.text, 10))?.alias,
            selfPlayer: client.data.slot === parseInt(object.text, 10),
          };
        case "item_id":
          return {
            type: "item",
            text: client.items.name(object.player, parseInt(object.text, 10)),
            itemType: object.flags,
          };
        case "location_id":
          return {
            type: "location",
            text: client.locations.name(
              object.player,
              parseInt(object.text, 10),
            ),
          };
        default:
          return { type: "text", text: object.text };
      }
    });
    console.log("revieved message", msg);
    setMessages((prevState) => [...prevState, msg]);
  };

  const handleDisconnect = async () => {
    client.removeListener(SERVER_PACKET_TYPE.PRINT_JSON, (packet, message) => {
      console.log("starting message listener...");
      handleMessages(packet);
    });
    client.disconnect();
    setMessages([]);
    navigation.navigate("connect");
  };
  useEffect(() => {
    client.addListener(SERVER_PACKET_TYPE.CONNECTED, (packet) => {
      //setConnection(packet.cmd);
    });
    client.addListener(SERVER_PACKET_TYPE.CONNECTION_REFUSED, (packet) => {
      //setConnection(packet.cmd);
    });
    client.addListener(SERVER_PACKET_TYPE.PRINT_JSON, (packet, message) => {
      console.log("starting message listener...");
      handleMessages(packet);
      // Add any additional logic here.
    });
    const backAction = () => {
      Alert.alert(
        "Disconnect from AP?",
        "This will take you back to the connection screen",
        [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          { text: "YES", onPress: () => handleDisconnect() },
        ],
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => {
      client.removeListener(
        SERVER_PACKET_TYPE.PRINT_JSON,
        (packet, message) => {
          console.log("starting message listener...");
          handleMessages(packet);
        },
      );
      backHandler.remove();
    };
  }, []);

  return (
    <Tab.Navigator initialRouteName="chat" style={{ paddingTop: insets.top }}>
      <Tab.Screen name="chat">
        {(props) => <Chat {...props} client={client} messages={messages} />}
      </Tab.Screen>
      <Tab.Screen name="nothing yet" component={Placeholder} />
    </Tab.Navigator>
  );
}

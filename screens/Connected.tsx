import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialTopTabNavigationHelpers } from "@react-navigation/material-top-tabs/lib/typescript/src/types";
import { Client, PrintJSONPacket, SERVER_PACKET_TYPE } from "archipelago.js";
import React, { useEffect, useState } from "react";
import { Alert, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MapScreen from "./MapScreen";
import Chat from "./chat";

const Tab = createMaterialTopTabNavigator();

export default function Connected({
  route,
  navigation,
}: Readonly<{
  route: {
    params: { client: Client; sessionName: string; replacedInfo: boolean };
  };
  navigation: MaterialTopTabNavigationHelpers;
  replacedInfo: boolean;
}>) {
  const { client, sessionName, replacedInfo } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const insets = useSafeAreaInsets();

  const handleMessages = (packet: PrintJSONPacket) => {
    const msg = packet.data.map((object, index) => {
      const key = messages.flat().length + index; //figure something out to make these unique
      console.log(messages);
      switch (object.type) {
        case "color":
          return {
            type: "color",
            text: object.text,
            color: object.color,
            key,
          };
        case "player_id":
          return {
            type: "player",
            text: client.players.get(parseInt(object.text, 10))?.alias,
            selfPlayer: client.data.slot === parseInt(object.text, 10),
            key,
          };
        case "item_id":
          return {
            type: "item",
            text: client.items.name(object.player, parseInt(object.text, 10)),
            itemType: object.flags,
            key,
          };
        case "location_id":
          console.log("getting location name");
          return {
            type: "location",
            text: client.locations.name(
              object.player,
              parseInt(object.text, 10),
            ),
            key,
          };
        case "text":
          return { type: "text", text: object.text };
        case "item_name":
          return {
            type: "item",
            text: object.text,
            itemType: object.flags,
            key,
          };
        case "location_name":
          return {
            type: "location",
            text: object.text,
            key,
          };
        default:
          return { type: "text", text: object.text, key };
      }
    });
    console.log("handled message", msg);
    setMessages((prevState) => [...prevState, msg]);
  };

  const handleDisconnect = async () => {
    client.removeListener(SERVER_PACKET_TYPE.PRINT_JSON, (packet, message) => {
      console.log("starting message listener...");
      handleMessages(packet);
    });
    console.log("disconnecting...");
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
          {
            text: "YES",
            onPress: () => {
              handleDisconnect();
            },
          },
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
      <Tab.Screen name="map">
        {(props) => (
          <MapScreen
            {...props}
            client={client}
            sessionName={sessionName}
            replacedInfo={replacedInfo}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

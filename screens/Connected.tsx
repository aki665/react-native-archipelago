import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialTopTabNavigationHelpers } from "@react-navigation/material-top-tabs/lib/typescript/src/types";
import { PrintJSONPacket, SERVER_PACKET_TYPE } from "archipelago.js";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Chat, { messages } from "./chat";
import { ClientContext } from "../components/ClientContext";

const Tab = createMaterialTopTabNavigator();

function Placeholder() {
  return <></>;
}

/**Check connection status every this many seconds */
const ALLOWED_TIME_BETWEEN_PACKETS = 30;

const minTime = ALLOWED_TIME_BETWEEN_PACKETS * 1000;

export default function Connected({
  navigation,
}: Readonly<{
  navigation: MaterialTopTabNavigationHelpers;
}>) {
  const { client, connectionInfoRef } = useContext(ClientContext);

  const [messages, setMessages] = useState<messages>([]);
  const insets = useSafeAreaInsets();
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /**
   * Parses a received message and puts it into the messages state. Used by chat.tsx to display messages.
   */
  const handleMessages = (packet: PrintJSONPacket) => {
    const msg = packet.data.map((object) => {
      switch (object.type) {
        case "color":
          return {
            type: "color",
            text: object.text,
            color: object.color,
          };
        case "player_id":
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
          console.log("getting location name");
          return {
            type: "location",
            text: client.locations.name(
              object.player,
              parseInt(object.text, 10),
            ),
          };
        case "text":
          return { type: "text", text: object.text };
        case "item_name":
          return {
            type: "item",
            text: object.text,
            itemType: object.flags,
          };
        case "location_name":
          return {
            type: "location",
            text: object.text,
          };
        default:
          return { type: "text", text: object.text };
      }
    });
    console.log("handled message", msg);
    setMessages((prevState) => [...prevState, msg]);
  };

  const handleDisconnect = async () => {
    client.removeListener(SERVER_PACKET_TYPE.PRINT_JSON, handleMessages);
    console.log("disconnecting...");
    client.disconnect();
    setMessages([]);
    const retry = retryRef.current;
    if (retry !== null) {
      clearInterval(retry);
    }
    navigation.navigate("connect");
  };

  const handleReconnection = async () => {
    const info = connectionInfoRef?.current;
    console.log(client.status);
    if (client.status === "Disconnected") {
      try {
        if (info) {
          console.log("trying to connect with info", info);
          const res = await client.connect(info);
          console.log(res);
        }
      } catch (e) {
        const retry = retryRef.current;
        if (retry !== null) {
          clearInterval(retry);
        }
        console.log(e);
        Alert.alert(
          "Connection Error!",
          "You have been disconnected, and the automatic attempt to reconnect failed.",
          [
            {
              text: "Go to info screen",
              onPress: () => {
                handleDisconnect();
              },
              style: "cancel",
            },
          ],
        );
      }
    }
  };

  useEffect(() => {
    client.addListener(SERVER_PACKET_TYPE.PRINT_JSON, handleMessages);

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

    const retry = setInterval(() => {
      handleReconnection();
    }, minTime);
    retryRef.current = retry;

    return () => {
      console.log("Connected.tsx useEffect cleanup is running...");
      client.removeListener(SERVER_PACKET_TYPE.PRINT_JSON, handleMessages);
      backHandler.remove();
      clearInterval(retry);
    };
  }, []);

  return (
    <Tab.Navigator initialRouteName="chat" style={{ paddingTop: insets.top }}>
      <Tab.Screen name="chat">
        {(props) => <Chat {...props} messages={messages} />}
      </Tab.Screen>
      <Tab.Screen name="nothing yet" component={Placeholder} />
    </Tab.Navigator>
  );
}

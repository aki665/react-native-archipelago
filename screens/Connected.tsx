import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialTopTabNavigationHelpers } from "@react-navigation/material-top-tabs/lib/typescript/src/types";
import {
  CLIENT_PACKET_TYPE,
  PrintJSONPacket,
  SERVER_PACKET_TYPE,
  ServerPacket,
} from "archipelago.js";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Chat, { messages } from "./chat";
import { ClientContext } from "../components/ClientContext";

const Tab = createMaterialTopTabNavigator();

function Placeholder() {
  return <></>;
}

/**Send a sync to the server, if the connection hasn't been verified in this many seconds */
const ALLOWED_TIME_BETWEEN_PACKETS = 15;

const minTime = ALLOWED_TIME_BETWEEN_PACKETS * 1000;

export default function Connected({
  navigation,
}: Readonly<{
  navigation: MaterialTopTabNavigationHelpers;
}>) {
  const { client, connectionInfoRef } = useContext(ClientContext);

  const [messages, setMessages] = useState<messages>([]);
  const insets = useSafeAreaInsets();
  const lastConnectionRef = useRef(new Date().getTime());
  const triedSyncRef = useRef(false);
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
    client.removeListener("PacketReceived", handleConnectionStatus);
    console.log("disconnecting...");
    client.disconnect();
    setMessages([]);
    const retry = retryRef.current;
    if (retry !== null) {
      clearInterval(retry);
    }
    navigation.navigate("connect");
  };

  const handleConnectionStatus = () => {
    lastConnectionRef.current = new Date().getTime();
    triedSyncRef.current = false;
  };

  const checkConnected = (lastConnection: number) => {
    if (lastConnection + minTime < new Date().getTime()) {
      console.log(
        "connection not verified in ",
        ALLOWED_TIME_BETWEEN_PACKETS,
        "seconds. Sending Sync package...",
      );
      triedSyncRef.current = true;
      client.send({ cmd: CLIENT_PACKET_TYPE.SYNC });
    }
  };

  const handleReconnection = async () => {
    const info = connectionInfoRef?.current;
    const checkConnection = triedSyncRef.current;
    const lastConnection = lastConnectionRef.current;

    console.log(
      lastConnection + minTime < new Date().getTime(),
      checkConnection,
    );
    checkConnected(lastConnection);
    if (lastConnection + minTime < new Date().getTime() && checkConnection) {
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
    client.addListener("PacketReceived", handleConnectionStatus);

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
    }, 10000);
    retryRef.current = retry;

    return () => {
      console.log("Connected.tsx useEffect cleanup is running...");
      client.removeListener(SERVER_PACKET_TYPE.PRINT_JSON, handleMessages);
      client.removeListener("PacketReceived", handleConnectionStatus);
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

import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialTopTabNavigationHelpers } from "@react-navigation/material-top-tabs/lib/typescript/src/types";
import { PrintJSONPacket } from "archipelago.js";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Chat, { messages } from "./chat";
import { ClientContext } from "../components/ClientContext";
import { SettingsContext } from "../components/SettingsContext";

const Tab = createMaterialTopTabNavigator();

function Placeholder() {
  return <></>;
}

export default function Connected({
  navigation,
}: Readonly<{
  navigation: MaterialTopTabNavigationHelpers;
}>) {
  const { client, connectionInfoRef } = useContext(ClientContext);

  const { getSetting } = useContext(SettingsContext);
  const AUTO_RETRY_AMOUNT = getSetting("AUTO_RETRY_AMOUNT", "number");

  const [messages, setMessages] = useState<messages>([]);
  const insets = useSafeAreaInsets();
  const retryCountRef = useRef<number>(0);

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
            text: client.players.findPlayer(parseInt(object.text, 10))?.alias,
            //text: client.players.get(parseInt(object.text, 10))?.alias,
            selfPlayer:
              client.players.self.slot ===
              client.players.findPlayer(parseInt(object.text, 10))?.slot,
            //selfPlayer: client.data.slot === parseInt(object.text, 10),
          };
        case "item_id":
          return {
            type: "item",
            text: client.package.lookupItemName(
              client.players.findPlayer(object.player)?.game ?? "",
              parseInt(object.text, 10),
            ),
            //text: client.items.name(object.player, parseInt(object.text, 10)),
            itemType: object.flags,
          };
        case "location_id":
          console.log("getting location name");
          return {
            type: "location",
            text: client.package.lookupLocationName(
              client.players.findPlayer(object.player)?.game ?? "",
              parseInt(object.text, 10),
            ),
            //text: client.locations.name(object.player,parseInt(object.text, 10),),
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
    client.socket.off("printJSON", handleMessages);
    console.log("disconnecting...");
    client.socket.disconnect();
    setMessages([]);
    navigation.navigate("connect");
  };

  /**
   * Client listeners are defined here to remake them on reconnect
   */
  const handleAddListeners = () => {
    try {
      client.socket.off("printJSON", handleMessages);
    } catch {
      console.log("message listener not initialized yet...");
    }
    client.socket.on("printJSON", handleMessages);
  };

  const handleReconnection = async () => {
    const info = connectionInfoRef?.current;
    try {
      if (info) {
        await client.login(info.url, info.name, info.game, info.connectionInfo);
        handleAddListeners();
        setMessages((prevState) => [
          ...prevState,
          [
            {
              text: "Reconnected successfully",
            },
          ],
        ]);
      }
    } catch (e) {
      retryCountRef.current += 1;

      if (retryCountRef.current === AUTO_RETRY_AMOUNT) {
        console.log(e);
        Alert.alert(
          "Connection Error!",
          "You have been disconnected, and the automatic attempts to reconnect failed.",
          [
            {
              text: "Disconnect",
              onPress: () => {
                handleDisconnect();
              },
              style: "cancel",
            },
          ],
        );
      } else {
        setMessages((prevState) => [
          ...prevState,
          [
            {
              text: "Reconnection failed. Trying again...",
            },
          ],
        ]);
      }
      handleReconnection();
    }
  };

  useEffect(() => {
    handleAddListeners();

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

    console.log("messages", client.messages.log);
    client.socket.on("disconnected", handleReconnection);

    return () => {
      console.log("Connected.tsx useEffect cleanup is running...");
      client.socket.off("printJSON", handleMessages);
      backHandler.remove();
      client.socket.off("disconnected", handleReconnection);
    };
  }, []);

  return (
    <Tab.Navigator initialRouteName="chat" style={{ paddingTop: insets.top }}>
      <Tab.Screen name="chat">
        {(props) => (
          <Chat {...props} messages={messages} setMessages={setMessages} />
        )}
      </Tab.Screen>
      <Tab.Screen name="nothing yet" component={Placeholder} />
    </Tab.Navigator>
  );
}

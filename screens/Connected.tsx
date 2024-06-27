import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialTopTabNavigationHelpers } from "@react-navigation/material-top-tabs/lib/typescript/src/types";
import { PrintJSONPacket, SERVER_PACKET_TYPE } from "archipelago.js";
import * as Location from "expo-location";
import React, { useContext, useEffect, useState } from "react";
import { Alert, BackHandler, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MapScreen from "./MapScreen";
import Chat, { messages } from "./chat";
import { ClientContext } from "../components/ClientContext";
import { ErrorContext } from "../components/ErrorContext";

const Tab = createMaterialTopTabNavigator();

export default function Connected({
  route,
  navigation,
}: Readonly<{
  route: {
    params: { sessionName: string; replacedInfo: boolean };
  };
  navigation: MaterialTopTabNavigationHelpers;
}>) {
  const { sessionName, replacedInfo } = route.params;
  const client = useContext(ClientContext);

  const [messages, setMessages] = useState<messages>([]);
  const insets = useSafeAreaInsets();
  const { setError } = useContext(ErrorContext);
  const [allowedLocation, setAllowedLocation] = useState(false);
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

  const handleBackgroundPermission = async () => {
    const backgroundStatus = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus.status === "granted") {
      setAllowedLocation(true);
    } else {
      setError("Permission to access location was denied");
      handleDisconnect();
    }
  };

  const askLocationPermission = async () => {
    const fgPermission = await Location.getForegroundPermissionsAsync();
    const bgPermission = await Location.getBackgroundPermissionsAsync();
    if (fgPermission.granted && bgPermission.granted) {
      setAllowedLocation(true);
    } else {
      const foregroundStatus =
        await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus.status !== "granted") {
        setError("Permission to access location was denied");
        handleDisconnect();
        return;
      }
      if (Platform.OS === "android") {
        Alert.alert(
          "Background location permission required!",
          "Background location permission is required for the app to function. Go to settings and set the location permission to always. Pressing cancel will disconnect you from the current server.",
          [
            {
              text: "Cancel",
              onPress: () => {
                handleDisconnect();
              },
              style: "cancel",
            },
            {
              text: "Go to settings",
              onPress: () => {
                handleBackgroundPermission();
              },
            },
          ],
        );
      } else {
        handleBackgroundPermission();
      }
    }
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
    askLocationPermission();
    return () => {
      client.removeListener(SERVER_PACKET_TYPE.PRINT_JSON, handleMessages);

      backHandler.remove();
    };
  }, []);

  return (
    <Tab.Navigator initialRouteName="chat" style={{ paddingTop: insets.top }}>
      <Tab.Screen name="chat">
        {(props) => <Chat {...props} messages={messages} />}
      </Tab.Screen>
      {allowedLocation && (
        <Tab.Screen name="map">
          {(props) => (
            <MapScreen
              {...props}
              sessionName={sessionName}
              replacedInfo={replacedInfo}
            />
          )}
        </Tab.Screen>
      )}
    </Tab.Navigator>
  );
}

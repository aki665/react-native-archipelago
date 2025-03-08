import {
  createMaterialTopTabNavigator,
  MaterialTopTabBarProps,
} from "@react-navigation/material-top-tabs";
import { PrintJSONPacket } from "archipelago.js";
import * as Location from "expo-location";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  NativeEventSubscription,
  Platform,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MapScreen from "./MapScreen";
import Chat, { messages } from "./chat";
import Button from "../components/Button";
import { ClientContext } from "../components/ClientContext";
import { ErrorContext } from "../components/ErrorContext";
import { SettingsContext } from "../components/SettingsContext";
import HintsScreen from "./HintsScreen";

const Tab = createMaterialTopTabNavigator();

export default function Connected({
  route,
  navigation,
}: Readonly<{
  route: {
    params: { sessionName: string };
  };
  navigation: MaterialTopTabBarProps["navigation"];
}>) {
  const { sessionName } = route.params;
  const { client, connectionInfoRef } = useContext(ClientContext);

  const { getSetting } = useContext(SettingsContext);
  const AUTO_RETRY_AMOUNT = getSetting("AUTO_RETRY_AMOUNT", "number");
  const AUTOMATIC_RECONNECTION = getSetting(
    "AUTOMATIC_RECONNECTION",
    "boolean",
  );

  const [messages, setMessages] = useState<messages>([]);

  const insets = useSafeAreaInsets();
  const { setError } = useContext(ErrorContext);
  const [allowedLocation, setAllowedLocation] = useState(false);
  const retryCountRef = useRef<number>(0);
  const backHandler = useRef<NativeEventSubscription | undefined>(undefined);
  const isDisconnecting = useRef(false);
  const [disconnected, setDisconnected] = useState<boolean>(false);
  const [reconnecting, setReconnecting] = useState<boolean>(false);

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
    backHandler.current?.remove();
    isDisconnecting.current = true;
    client.socket.off("disconnected", onDisconnect);
    client.socket.off("printJSON", handleMessages);
    console.log("disconnecting...");
    client.socket.disconnect();
    setMessages([]);
    navigation.reset({ routes: [{ name: "connect" }] });
  };

  /**
   * Client listeners are defined here to remake them on reconnect
   */
  const handleAddListeners = () => {
    try {
      //client.socket.off("printJSON", handleMessages);
    } catch {
      console.log("message listener not initialized yet...");
    }
    //client.socket.on("printJSON", handleMessages);
  };

  const connect = async () => {
    const info = connectionInfoRef?.current;
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
      setDisconnected(false);
      setReconnecting(false);
    }
  };

  const manualReconnection = async () => {
    try {
      setReconnecting(true);
      await connect();
    } catch {
      retryCountRef.current += 1;

      setMessages((prevState) => [
        ...prevState,
        [
          {
            text: "Reconnection failed.",
          },
        ],
      ]);
      setReconnecting(false);
    }
  };

  const automaticReconnection = async () => {
    try {
      await connect();
    } catch {
      retryCountRef.current += 1;

      if (retryCountRef.current === AUTO_RETRY_AMOUNT) {
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
      automaticReconnection();
    }
  };

  const onDisconnect = () => {
    if (AUTOMATIC_RECONNECTION) {
      if (AUTO_RETRY_AMOUNT === 0) {
        Alert.alert("Connection Error!", "You have been disconnected", [
          {
            text: "Disconnect",
            onPress: () => {
              handleDisconnect();
            },
            style: "cancel",
          },
        ]);
      } else {
        setMessages((prevState) => [
          ...prevState,
          [{ text: "Connection lost. Retrying..." }],
        ]);
        automaticReconnection();
      }
    } else {
      setMessages((prevState) => [
        ...prevState,
        [{ text: "Connection lost." }],
      ]);
      setDisconnected(true);
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

    backHandler.current = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    client.socket.on("disconnected", onDisconnect);
    client.socket.on("printJSON", handleMessages);

    askLocationPermission();
  }, []);

  return (
    <Tab.Navigator
      initialRouteName="Chat"
      style={{ paddingTop: insets.top }}
      screenOptions={{ swipeEnabled: false }}
    >
      <Tab.Screen name="Chat">
        {(props) => (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={reconnecting} enabled={false} />
            }
            contentContainerStyle={{ flex: 1 }}
            nestedScrollEnabled
          >
            {disconnected && (
              <Button
                {...props}
                buttonStyle={{
                  marginTop: 5,
                  width: "95%",
                  alignSelf: "center",
                }}
                onPress={() => {
                  manualReconnection();
                }}
                buttonProps={{ disabled: reconnecting }}
                text="Reconnect"
              />
            )}
            <Chat {...props} messages={messages} setMessages={setMessages} />
          </ScrollView>
        )}
      </Tab.Screen>
      {allowedLocation && (
        <Tab.Screen name="Map">
          {(props) => (
            <MapScreen
              {...props}
              sessionName={sessionName}
              isDisconnecting={isDisconnecting}
            />
          )}
        </Tab.Screen>
      )}
      <Tab.Screen name="Hints" component={HintsScreen} />
    </Tab.Navigator>
  );
}

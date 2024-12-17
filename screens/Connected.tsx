import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { MaterialTopTabNavigationHelpers } from "@react-navigation/material-top-tabs/lib/typescript/src/types";
import { PrintJSONPacket, SERVER_PACKET_TYPE } from "archipelago.js";
import * as Location from "expo-location";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Alert, AppState, BackHandler, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MapScreen from "./MapScreen";
import Chat, { messages } from "./chat";
import { ClientContext } from "../components/ClientContext";
import { ErrorContext } from "../components/ErrorContext";
import { SettingsContext } from "../components/SettingsContext";

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
  const { client, connectionInfoRef } = useContext(ClientContext);

  const { getSetting } = useContext(SettingsContext);
  const CHECK_CONNECTION_TIME = getSetting("CHECK_CONNECTION_TIME", "number");
  const AUTO_RETRY_AMOUNT = getSetting("AUTO_RETRY_AMOUNT", "number");

  const minTime = CHECK_CONNECTION_TIME * 1000;

  const [messages, setMessages] = useState<messages>([]);
  const [refreshClientListeners, setRefreshClientListeners] =
    useState<boolean>(false);

  const insets = useSafeAreaInsets();
  const { setError } = useContext(ErrorContext);
  const [allowedLocation, setAllowedLocation] = useState(false);
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retryCountRef = useRef<number>(0);
  const reconnectingRef = useRef<boolean>(false);
  const appState = useRef(AppState.currentState);

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

  /**
   * Client listeners are defined here to remake them on reconnect
   */
  const handleAddListeners = () => {
    setRefreshClientListeners(true);
    try {
      client.removeListener(SERVER_PACKET_TYPE.PRINT_JSON, handleMessages);
    } catch {
      console.log("message listener not initialized yet...");
    }
    client.addListener(SERVER_PACKET_TYPE.PRINT_JSON, handleMessages);
  };

  const checkConnection = () => {
    console.log("status in checkConnection", client.status);
    if (
      client.status === "Disconnected" &&
      retryRef.current === null &&
      appState.current === "active" //Only check the status when the app is active
    ) {
      console.log("disconnected");
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

        const retry = setInterval(() => {
          handleReconnection();
        }, 1000);
        retryRef.current = retry;
      }
    } else if (client.status === "Connected" && retryRef.current !== null) {
      const retry = retryRef.current;
      if (retry !== null) {
        clearInterval(retry);
      }
      retryRef.current = null;
      retryCountRef.current = 0;
    }
  };

  const handleReconnection = async () => {
    if (!reconnectingRef.current && client.status !== "Connecting") {
      console.log(reconnectingRef.current, client.status);
      const info = connectionInfoRef?.current;
      try {
        if (info) {
          reconnectingRef.current = true;
          await client.connect(info);
          handleAddListeners();
          setMessages((prevState) => [
            ...prevState,
            [
              {
                text: "Reconnected successfully",
              },
            ],
          ]);
          reconnectingRef.current = false;
        }
      } catch (e) {
        retryCountRef.current += 1;

        if (retryCountRef.current === AUTO_RETRY_AMOUNT) {
          const retry = retryRef.current;
          if (retry !== null) {
            clearInterval(retry);
          }
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
        reconnectingRef.current = false;
      }
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

    const connectionCheck = setInterval(() => {
      checkConnection();
    }, minTime);

    askLocationPermission();
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        client.disconnect(); // Explicitly disconnect the client if the app goes into the background state...
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        handleReconnection(); //And reconnect once the app is active again.
        handleAddListeners();
      }

      appState.current = nextAppState;
      console.log("AppState", appState.current);
    });

    return () => {
      console.log("Connected.tsx useEffect cleanup is running...");
      client.removeListener(SERVER_PACKET_TYPE.PRINT_JSON, handleMessages);
      backHandler.remove();
      clearInterval(connectionCheck);
      subscription.remove();
    };
  }, []);

  return (
    <Tab.Navigator initialRouteName="chat" style={{ paddingTop: insets.top }}>
      <Tab.Screen name="chat">
        {(props) => (
          <Chat {...props} messages={messages} setMessages={setMessages} />
        )}
      </Tab.Screen>
      {allowedLocation && (
        <Tab.Screen name="map">
          {(props) => (
            <MapScreen
              {...props}
              sessionName={sessionName}
              replacedInfo={replacedInfo}
              refreshClientListeners={refreshClientListeners}
            />
          )}
        </Tab.Screen>
      )}
    </Tab.Navigator>
  );
}

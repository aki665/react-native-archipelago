// In App.js in a new project

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as TaskManager from "expo-task-manager";
import React from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import ClientContextProvider from "./components/ClientContext";
import ErrorContextProvider, { ErrorMessage } from "./components/ErrorContext";
import SettingsContextProvider from "./components/SettingsContext";
import ConnectTabs from "./screens/ConnectTabs";
import Connected from "./screens/Connected";
import structuredClone from "@ungap/structured-clone";
require("react-native-get-random-values");

if (!("structuredClone" in globalThis)) {
  globalThis.structuredClone = structuredClone;
}

const Stack = createNativeStackNavigator();

const EmptyHeader = () => <></>;
TaskManager.unregisterAllTasksAsync();

function App() {
  return (
    <SafeAreaProvider>
      <ErrorContextProvider>
        <ClientContextProvider>
          <SettingsContextProvider>
            <View style={{ flex: 15 }}>
              <StatusBar style="dark" />
              <NavigationContainer>
                <Stack.Navigator
                  initialRouteName="connect"
                  screenOptions={{ header: EmptyHeader }}
                >
                  <Stack.Screen name="connect" component={ConnectTabs} />
                  <Stack.Screen name="connected" component={Connected} />
                </Stack.Navigator>
              </NavigationContainer>
            </View>
            <ErrorMessage />
          </SettingsContextProvider>
        </ClientContextProvider>
      </ErrorContextProvider>
    </SafeAreaProvider>
  );
}
export default App;
